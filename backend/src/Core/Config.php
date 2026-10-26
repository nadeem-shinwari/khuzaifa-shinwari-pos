<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Application configuration.
 *
 * Every value is resolved from the environment so the same code base can run
 * against a local SQLite file and a production MySQL database.
 */
final class Config
{
    /** @var array<string, mixed>|null */
    private static ?array $config = null;

    /**
     * Build (once) and return the configuration array.
     *
     * @return array<string, mixed>
     */
    public static function all(): array
    {
        if (self::$config !== null) {
            return self::$config;
        }

        $connection = strtolower(Env::string('DB_CONNECTION', 'sqlite'));
        $basePath = dirname(__DIR__, 3);

        self::$config = [
            'app' => [
                'name' => Env::string('APP_NAME', 'Khuzaifa Shinwari'),
                'env' => Env::string('APP_ENV', 'local'),
                'debug' => Env::bool('APP_DEBUG', true),
                'url' => rtrim(Env::string('APP_URL', 'http://localhost:5173'), '/'),
                'timezone' => Env::string('APP_TIMEZONE', 'Asia/Karachi'),
            ],
            'paths' => [
                'base' => $basePath,
                'backend' => $basePath . '/backend',
                'storage' => $basePath . '/backend/storage',
                'logs' => $basePath . '/backend/storage/logs',
                'sqlite' => $basePath . '/backend/storage/sqlite',
                'migrations' => $basePath . '/backend/migrations',
            ],
            'database' => [
                'connection' => $connection,
                'sqlite' => [
                    // DB_SQLITE_PATH is the dedicated option; DB_DATABASE is
                    // kept as a fallback so an existing .env keeps working.
                    'path' => self::resolvePath(
                        Env::string('DB_SQLITE_PATH', Env::string('DB_DATABASE', 'backend/storage/sqlite/app.sqlite')),
                    ),
                ],
                'mysql' => [
                    'host' => Env::string('DB_HOST', '127.0.0.1'),
                    'port' => Env::int('DB_PORT', 3306),
                    'database' => Env::string('DB_DATABASE', ''),
                    'username' => Env::string('DB_USERNAME', ''),
                    'password' => Env::string('DB_PASSWORD', ''),
                    'charset' => Env::string('DB_CHARSET', 'utf8mb4'),
                ],
            ],
            'session' => [
                'name' => Env::string('SESSION_NAME', 'ks_session'),
                'lifetime' => Env::int('SESSION_LIFETIME', 7200),
                'secure' => Env::bool('SESSION_SECURE_COOKIE', false),
                'samesite' => Env::string('SESSION_SAME_SITE', 'Lax'),
            ],
            'security' => [
                'csrf_token_name' => 'csrf_token',
                'csrf_header' => 'X-CSRF-Token',
                'max_login_attempts' => Env::int('AUTH_MAX_ATTEMPTS', 5),
                'lockout_seconds' => Env::int('AUTH_LOCKOUT_SECONDS', 300),
                'password_min_length' => Env::int('AUTH_PASSWORD_MIN_LENGTH', 8),
            ],
        ];

        return self::$config;
    }

    /**
     * Read a configuration value using dot notation, e.g. Config::get('db.host').
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $segments = explode('.', $key);
        $value = self::all();

        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }

    /**
     * Resolve a configured path.
     *
     * Relative paths are resolved against the project root, so the same
     * .env file works on Windows, Linux and the hosting platform.
     */
    private static function resolvePath(string $path): string
    {
        $path = trim($path);

        if ($path === '') {
            return '';
        }

        // Absolute Windows path (C:\... or C:/...).
        if (preg_match('#^[A-Za-z]:[\\\\/]#', $path) === 1) {
            return str_replace('\\', '/', $path);
        }

        // Absolute Unix path.
        if (str_starts_with($path, '/')) {
            return $path;
        }

        return dirname(__DIR__, 3) . '/' . str_replace('\\', '/', $path);
    }

    /**
     * Test helper: force a value into the config tree.
     */
    public static function set(string $key, mixed $value): void
    {
        $segments = explode('.', $key);
        $config = self::all();
        $cursor = &$config;

        foreach ($segments as $segment) {
            if (!isset($cursor[$segment]) || !is_array($cursor[$segment])) {
                $cursor[$segment] = [];
            }
            $cursor = &$cursor[$segment];
        }

        $cursor = $value;
        self::$config = $config;
    }

    /**
     * Test helper: discard the memoised configuration.
     */
    public static function reset(): void
    {
        self::$config = null;
    }
}
