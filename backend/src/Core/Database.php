<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Shared PDO connection factory.
 *
 * A single connection instance is reused per request. The factory only knows
 * about the two supported drivers (sqlite / mysql) and never leaks credentials
 * into a response.
 */
final class Database
{
    private static ?PDO $connection = null;

    /**
     * Return the shared connection, creating it on first use.
     */
    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        self::$connection = self::make();

        return self::$connection;
    }

    /**
     * Create a fresh connection (used by the migration runner and tests).
     */
    public static function make(): PDO
    {
        $driver = strtolower((string) Config::get('database.connection', 'sqlite'));

        return match ($driver) {
            'sqlite' => self::makeSqlite(),
            'mysql', 'mysqli' => self::makeMysql(),
            default => throw new RuntimeException("Unsupported database connection: {$driver}"),
        };
    }

    private static function makeSqlite(): PDO
    {
        $path = (string) Config::get('database.sqlite.path', '');
        if ($path === '') {
            throw new RuntimeException('DB_DATABASE must be set for the sqlite connection.');
        }

        $directory = dirname($path);
        if (!is_dir($directory) && !@mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new RuntimeException("Unable to create the SQLite directory: {$directory}");
        }

        try {
            $pdo = new PDO('sqlite:' . $path, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $exception) {
            throw new RuntimeException('Unable to open the SQLite database file.', 0, $exception);
        }

        // Foreign keys are disabled by default in SQLite.
        $pdo->exec('PRAGMA foreign_keys = ON');

        return $pdo;
    }

    private static function makeMysql(): PDO
    {
        $host = (string) Config::get('database.mysql.host');
        $port = (int) Config::get('database.mysql.port', 3306);
        $database = (string) Config::get('database.mysql.database');
        $charset = (string) Config::get('database.mysql.charset', 'utf8mb4');

        if ($database === '') {
            throw new RuntimeException('DB_DATABASE must be set for the mysql connection.');
        }

        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";

        try {
            $pdo = new PDO($dsn, (string) Config::get('database.mysql.username'), (string) Config::get('database.mysql.password'), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $exception) {
            throw new RuntimeException('Unable to connect to the MySQL database.', 0, $exception);
        }

        return $pdo;
    }

    /**
     * Run a callback inside a database transaction.
     *
     * The transaction is rolled back automatically when the callback throws,
     * which keeps posting logic (sales, purchases, transfers) atomic.
     */
    public static function transaction(callable $callback): mixed
    {
        $pdo = self::connection();
        $pdo->beginTransaction();

        try {
            $result = $callback($pdo);
            $pdo->commit();

            return $result;
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $exception;
        }
    }

    /**
     * True when the current connection supports the given driver.
     */
    public static function driver(): string
    {
        return (string) self::connection()->getAttribute(PDO::ATTR_DRIVER_NAME);
    }

    /**
     * Test helper: drop the shared connection.
     */
    public static function disconnect(): void
    {
        self::$connection = null;
    }
}
