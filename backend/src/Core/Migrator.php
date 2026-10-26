<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Versioned schema migration runner.
 *
 * Migrations live in "backend/migrations" as plain PHP files named
 * "YYYY_MM_DD_HHMMSS_description.php". Each file returns an anonymous class
 * with an "up(PDO $pdo, string $driver)" method and an optional
 * "down(PDO $pdo, string $driver)" method used by the rollback command.
 *
 * A "schema_migrations" table records what has already been applied, so a
 * migration runs at most once. SQL is kept dialect neutral by using the
 * Schema builder instead of raw DDL.
 */
final class Migrator
{
    private PDO $pdo;

    private string $driver;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->driver = strtolower((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
    }

    /**
     * Create the bookkeeping table used to track applied migrations.
     */
    public function ensureRepository(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations ('
            . 'migration VARCHAR(191) NOT NULL, '
            . 'batch INTEGER NOT NULL DEFAULT 1, '
            . 'applied_at VARCHAR(32) NOT NULL, '
            . 'PRIMARY KEY (migration)'
            . ')',
        );
    }

    /**
     * Names of the migrations that have already been applied.
     *
     * @return array<int, string>
     */
    public function applied(): array
    {
        $this->ensureRepository();

        $statement = $this->pdo->query('SELECT migration FROM schema_migrations ORDER BY migration');
        if ($statement === false) {
            return [];
        }

        $migrations = [];
        foreach ($statement->fetchAll(PDO::FETCH_COLUMN) as $migration) {
            $migrations[] = (string) $migration;
        }

        return $migrations;
    }

    /**
     * Discover the migration files, sorted by name.
     *
     * @return array<int, array{name: string, path: string}>
     */
    public function available(?string $directory = null): array
    {
        $directory ??= (string) Config::get('paths.migrations', '');

        if ($directory === '' || !is_dir($directory)) {
            throw new RuntimeException("The migrations directory does not exist: {$directory}");
        }

        $files = glob(rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . '*.php') ?: [];
        sort($files, SORT_STRING);

        $migrations = [];
        foreach ($files as $file) {
            $migrations[] = [
                'name' => basename($file, '.php'),
                'path' => $file,
            ];
        }

        return $migrations;
    }

    /**
     * Apply every migration that has not run yet.
     *
     * @return array<int, string> The names of the applied migrations.
     */
    public function migrate(?string $directory = null): array
    {
        $this->ensureRepository();

        $applied = $this->applied();
        $batch = $this->nextBatch();
        $executed = [];

        foreach ($this->available($directory) as $migration) {
            if (in_array($migration['name'], $applied, true)) {
                continue;
            }

            $this->run($migration['path'], $migration['name'], $batch);
            $executed[] = $migration['name'];
        }

        return $executed;
    }


    /**
     * Roll back the applied migrations.
     *
     * By default only the newest batch is reverted. Pass a higher $steps value
     * to revert more batches, or 0 to revert every applied migration.
     *
     * @return array<int, string> The names of the reverted migrations.
     */
    public function rollback(?string $directory = null, int $steps = 1): array
    {
        $this->ensureRepository();

        $statement = $this->pdo->query(
            'SELECT migration, batch FROM schema_migrations ORDER BY batch DESC, migration DESC',
        );
        if ($statement === false) {
            return [];
        }

        $records = $statement->fetchAll(PDO::FETCH_ASSOC);
        if ($records === []) {
            return [];
        }

        $files = [];
        foreach ($this->available($directory) as $migration) {
            $files[$migration['name']] = $migration['path'];
        }

        $reverted = [];
        $batches = [];

        foreach ($records as $record) {
            $name = (string) $record['migration'];
            $batch = (int) $record['batch'];

            if (!isset($files[$name])) {
                continue;
            }

            // A step of 0 means "revert everything", any other value limits
            // the rollback to that many batches.
            if ($steps > 0 && !in_array($batch, $batches, true)) {
                if (count($batches) >= $steps) {
                    continue;
                }

                $batches[] = $batch;
            }

            $this->reverse($files[$name], $name);
            $reverted[] = $name;
        }

        return $reverted;
    }

    /**
     * Run a single migration file and record it in the repository.
     */
    private function run(string $path, string $name, int $batch): void
    {
        $migration = $this->load($path);

        try {
            $migration->up($this->pdo, $this->driver);
        } catch (PDOException $exception) {
            throw new RuntimeException(
                "Migration {$name} failed: {$exception->getMessage()}",
                0,
                $exception,
            );
        }

        $statement = $this->pdo->prepare(
            'INSERT INTO schema_migrations (migration, batch, applied_at) VALUES (:migration, :batch, :applied_at)',
        );
        $statement->execute([
            'migration' => $name,
            'batch' => $batch,
            'applied_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Revert a single migration file and drop it from the repository.
     */
    private function reverse(string $path, string $name): void
    {
        $migration = $this->load($path);

        if (method_exists($migration, 'down')) {
            try {
                $migration->down($this->pdo, $this->driver);
            } catch (PDOException $exception) {
                throw new RuntimeException(
                    "Rollback of {$name} failed: {$exception->getMessage()}",
                    0,
                    $exception,
                );
            }
        }

        $statement = $this->pdo->prepare('DELETE FROM schema_migrations WHERE migration = :migration');
        $statement->execute(['migration' => $name]);
    }

    /**
     * Load a migration file and return the migration object it declares.
     */
    private function load(string $path): object
    {
        if (!is_file($path)) {
            throw new RuntimeException("Migration file not found: {$path}");
        }

        $migration = require $path;

        if (!is_object($migration) || !method_exists($migration, 'up')) {
            throw new RuntimeException("Migration {$path} must return an object with an up() method.");
        }

        return $migration;
    }

    /**
     * The batch number the next run belongs to.
     */
    private function nextBatch(): int
    {
        return $this->lastBatch() + 1;
    }

    /**
     * The most recent batch number (0 when nothing ran yet).
     */
    private function lastBatch(): int
    {
        $statement = $this->pdo->query('SELECT MAX(batch) FROM schema_migrations');
        if ($statement === false) {
            return 0;
        }

        $batch = $statement->fetchColumn();

        return $batch === false || $batch === null ? 0 : (int) $batch;
    }
}
