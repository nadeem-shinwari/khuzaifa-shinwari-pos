<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Small, dialect aware schema builder.
 *
 * Migrations describe columns in one portable way and the builder emits the
 * matching SQLite or MySQL DDL. This keeps every migration file free of
 * driver specific SQL, as required by the project instructions.
 */
final class Schema
{
    private PDO $pdo;

    private string $driver;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->driver = strtolower((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
    }

    /**
     * The auto-incrementing primary key column.
     */
    public static function id(string $name = 'id'): Column
    {
        return Column::id($name);
    }

    /**
     * A short text column (defaults to 191 characters, the MySQL index limit).
     */
    public static function string(string $name, int $length = 191): Column
    {
        return Column::string($name, $length);
    }

    /**
     * A long text column.
     */
    public static function text(string $name): Column
    {
        return Column::text($name);
    }

    /**
     * An integer column.
     */
    public static function integer(string $name): Column
    {
        return Column::integer($name);
    }

    /**
     * A big integer column.
     */
    public static function bigInteger(string $name): Column
    {
        return Column::bigInteger($name);
    }

    /**
     * A boolean column.
     */
    public static function boolean(string $name): Column
    {
        return Column::boolean($name);
    }

    /**
     * A fixed precision decimal column (money).
     */
    public static function decimal(string $name, int $precision = 15, int $scale = 2): Column
    {
        return Column::decimal($name, $precision, $scale);
    }

    /**
     * A date column.
     */
    public static function date(string $name): Column
    {
        return Column::date($name);
    }

    /**
     * A date and time column.
     */
    public static function dateTime(string $name): Column
    {
        return Column::dateTime($name);
    }

    /**
     * Create a table from a list of columns.
     *
     * @param array<int, Column> $columns
     * @param array<int, string> $foreignKeys Extra "FOREIGN KEY (...) REFERENCES ..." clauses
     */
    public function create(string $table, array $columns, array $foreignKeys = []): void
    {
        $definitions = [];

        foreach ($columns as $column) {
            $definitions[] = $this->columnSql($column);
        }

        $sql = sprintf(
            'CREATE TABLE IF NOT EXISTS %s (%s)',
            $this->quoteTable($table),
            implode(', ', array_merge($definitions, $foreignKeys)),
        );

        $this->execute($sql);
    }

    /**
     * Create an index. MySQL has no "IF NOT EXISTS" for indexes, so the
     * existing indexes are inspected first.
     */
    public function index(string $table, array|string $columns, string $name = ''): void
    {
        $columnList = is_array($columns) ? $columns : [$columns];
        $name = $name !== '' ? $name : $table . '_' . implode('_', $columnList) . '_index';

        if ($this->indexExists($table, $name)) {
            return;
        }

        $this->execute(sprintf(
            'CREATE INDEX %s ON %s (%s)',
            $this->quoteIdentifier($name),
            $this->quoteTable($table),
            implode(', ', array_map([$this, 'quoteIdentifier'], $columnList)),
        ));
    }

    /**
     * Create a unique index.
     */
    public function unique(string $table, array $columns, string $name = ''): void
    {
        $name = $name !== '' ? $name : $table . '_' . implode('_', $columns) . '_unique';

        if ($this->indexExists($table, $name)) {
            return;
        }

        $this->execute(sprintf(
            'CREATE UNIQUE INDEX %s ON %s (%s)',
            $this->quoteIdentifier($name),
            $this->quoteTable($table),
            implode(', ', array_map([$this, 'quoteIdentifier'], $columns)),
        ));
    }

    /**
     * Add a foreign key constraint for a column.
     *
     * SQLite supports foreign keys at table creation time and will reject
     * `ALTER TABLE ... ADD CONSTRAINT`; in that case we only create the index to
     * keep the migration portable and let the database enforce at runtime when
     * the table itself includes the constraint.
     */
    public function foreignKey(string $table, string $column, string $referencesTable, string $referencesColumn = 'id', string $name = ''): void
    {
        $name = $name !== '' ? $name : $table . '_' . $column . '_fk';

        if ($this->driver === 'mysql') {
            $this->execute(sprintf(
                'ALTER TABLE %s ADD CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s (%s)',
                $this->quoteTable($table),
                $this->quoteIdentifier($name),
                $this->quoteIdentifier($column),
                $this->quoteTable($referencesTable),
                $this->quoteIdentifier($referencesColumn),
            ));

            return;
        }

        // SQLite does not support ADD CONSTRAINT in ALTER TABLE, so we keep the
        // relationship index for the schema while relying on the table creation
        // DDL for enforcement when needed.
        $this->index($table, $column, $name);
    }

    /**
     * Drop a table if it exists.
     */
    public function drop(string $table): void
    {
        $this->execute(sprintf('DROP TABLE IF EXISTS %s', $this->quoteTable($table)));
    }

    /**
     * True when the table exists in the current database.
     */
    public function hasTable(string $table): bool
    {
        try {
            $statement = $this->pdo->prepare(
                $this->driver === 'mysql'
                    ? 'SHOW TABLES LIKE :table'
                    : "SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table",
            );
            $statement->execute(['table' => $table]);

            return $statement->fetchColumn() !== false;
        } catch (PDOException) {
            return false;
        }
    }

    /**
     * The DDL fragment of a single column.
     */
    private function columnSql(Column $column): string
    {
        $name = $this->quoteIdentifier($column->name());
        $type = $this->columnType($column);
        $parts = [$name, $type];

        if ($column->isAutoIncrement()) {
            // SQLite only accepts "PRIMARY KEY AUTOINCREMENT" in that order,
            // while MySQL expects "AUTO_INCREMENT" before "PRIMARY KEY".
            if ($this->driver === 'mysql') {
                $parts[] = 'NOT NULL';
                $parts[] = 'AUTO_INCREMENT';
                $parts[] = 'PRIMARY KEY';
            } else {
                $parts[] = 'PRIMARY KEY AUTOINCREMENT';
            }
        } else {
            $parts[] = $column->isNullable() ? 'NULL' : 'NOT NULL';

            $default = $column->defaultValue();
            if ($default !== null) {
                $parts[] = 'DEFAULT ' . $default;
            }

            if ($column->isUnique()) {
                $parts[] = 'UNIQUE';
            }
        }

        return implode(' ', $parts);
    }

    /**
     * The driver specific SQL type of a column.
     */
    private function columnType(Column $column): string
    {
        $mysql = $this->driver === 'mysql';

        return match ($column->type()) {
            Column::TYPE_ID => $mysql ? 'BIGINT UNSIGNED' : 'INTEGER',
            Column::TYPE_STRING => sprintf('VARCHAR(%d)', $column->length()),
            Column::TYPE_TEXT => 'TEXT',
            Column::TYPE_INTEGER => $mysql ? 'INT' : 'INTEGER',
            Column::TYPE_BIG_INTEGER => $mysql ? 'BIGINT' : 'INTEGER',
            Column::TYPE_BOOLEAN => $mysql ? 'TINYINT(1)' : 'INTEGER',
            Column::TYPE_DECIMAL => sprintf(
                $mysql ? 'DECIMAL(%d,%d)' : 'NUMERIC(%d,%d)',
                $column->length(),
                $column->scale(),
            ),
            Column::TYPE_DATE => 'DATE',
            Column::TYPE_DATE_TIME => $mysql ? 'DATETIME' : 'TEXT',
            default => throw new RuntimeException('Unsupported column type: ' . $column->type()),
        };
    }


    /**
     * True when an index with the given name already exists on the table.
     */
    private function indexExists(string $table, string $name): bool
    {
        try {
            if ($this->driver === 'mysql') {
                $statement = $this->pdo->prepare(
                    'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :name',
                );
            } else {
                $statement = $this->pdo->prepare(
                    "SELECT 1 FROM sqlite_master WHERE type = 'index' AND tbl_name = :table AND name = :name",
                );
            }

            $statement->execute(['table' => $table, 'name' => $name]);

            return $statement->fetchColumn() !== false;
        } catch (PDOException) {
            return false;
        }
    }

    /**
     * Execute a statement on the connection.
     */
    private function execute(string $sql): void
    {
        $this->pdo->exec($sql);
    }

    /**
     * Quote an identifier for the active driver.
     */
    private function quoteIdentifier(string $identifier): string
    {
        return $this->driver === 'mysql'
            ? '`' . str_replace('`', '``', $identifier) . '`'
            : '"' . str_replace('"', '""', $identifier) . '"';
    }

    /**
     * Quote a table name for the active driver.
     */
    private function quoteTable(string $table): string
    {
        return $this->quoteIdentifier($table);
    }
}
