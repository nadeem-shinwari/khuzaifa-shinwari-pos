<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Minimal, dependency-free .env loader.
 *
 * Reads a KEY=VALUE file once and exposes the values through typed getters.
 * Real environment variables always win over the .env file, so hosting
 * platforms that inject configuration (e.g. InfinityFree) do not need a
 * .env file at all.
 */
final class Env
{
    /** @var array<string, string> */
    private static array $values = [];

    private static bool $loaded = false;

    /**
     * Load the .env file (if present) into memory.
     */
    public static function load(string $path): void
    {
        if (self::$loaded) {
            return;
        }

        self::$loaded = true;

        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (str_starts_with($line, 'export ')) {
                $line = substr($line, 7);
            }

            $position = strpos($line, '=');
            if ($position === false) {
                continue;
            }

            $key = trim(substr($line, 0, $position));
            $value = trim(substr($line, $position + 1));

            if ($key === '') {
                continue;
            }

            // Strip matching single or double quotes.
            $length = strlen($value);
            if ($length >= 2) {
                $first = $value[0];
                $last = $value[$length - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            self::$values[$key] = $value;
        }
    }

    /**
     * Read a raw string value.
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        $fromProcess = getenv($key);
        if ($fromProcess !== false && $fromProcess !== '') {
            return $fromProcess;
        }

        if (array_key_exists($key, self::$values)) {
            return self::$values[$key];
        }

        return $default;
    }

    public static function string(string $key, string $default = ''): string
    {
        $value = self::get($key);

        return $value === null ? $default : $value;
    }

    public static function int(string $key, int $default = 0): int
    {
        $value = self::get($key);

        return $value === null || $value === '' ? $default : (int) $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::get($key);
        if ($value === null || $value === '') {
            return $default;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Test helper: inject a value directly (used by the test bootstrap).
     */
    public static function set(string $key, string $value): void
    {
        self::$values[$key] = $value;
    }

    /**
     * Test helper: reset the loaded state.
     */
    public static function reset(): void
    {
        self::$values = [];
        self::$loaded = false;
    }
}
