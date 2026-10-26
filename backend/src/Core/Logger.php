<?php

declare(strict_types=1);

namespace App\Core;

/**
 * File based logger.
 *
 * Log files live outside the public web root. Messages are sanitised so that
 * credentials are never written to disk.
 */
final class Logger
{
    /**
     * Write a line to the application log.
     */
    public static function log(string $level, string $message, array $context = []): void
    {
        $directory = (string) Config::get('paths.logs', '');
        if ($directory === '') {
            return;
        }

        if (!is_dir($directory)) {
            @mkdir($directory, 0775, true);
        }

        if (!is_dir($directory) || !is_writable($directory)) {
            return;
        }

        $line = sprintf(
            "[%s] %s: %s %s%s",
            date('Y-m-d H:i:s'),
            strtoupper($level),
            self::sanitize($message),
            $context === [] ? '' : self::sanitize(json_encode($context, JSON_UNESCAPED_UNICODE) ?: ''),
            PHP_EOL,
        );

        @file_put_contents($directory . '/app-' . date('Y-m-d') . '.log', $line, FILE_APPEND | LOCK_EX);
    }

    public static function info(string $message, array $context = []): void
    {
        self::log('info', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::log('error', $message, $context);
    }

    /**
     * Remove values that look like secrets from log output.
     *
     * Each entry is [pattern, replacement]. The replacement keeps the
     * descriptive prefix and masks only the secret value.
     */
    private static function sanitize(string $value): string
    {
        $patterns = [
            ['/(password["\']?\s*[:=]\s*["\']?)([^"\'\s,}]+)/i', '$1***'],
            ['/(DB_PASSWORD=\s*)(\S+)/i', '$1***'],
            ['/(mysql:host=[^;]+;port=\d+;dbname=)([^;]+)/i', '$1***'],
        ];

        foreach ($patterns as [$pattern, $replacement]) {
            $result = @preg_replace($pattern, $replacement, $value);
            if (is_string($result)) {
                $value = $result;
            }
        }

        return $value;
    }
}
