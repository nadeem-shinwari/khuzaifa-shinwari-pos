<?php

declare(strict_types=1);

/**
 * Application bootstrap.
 *
 * Loads the environment, registers the PSR-4 style autoloader for the
 * App\ namespace, configures error handling and starts the session.
 *
 * This file is shared by the HTTP front controller, the CLI scripts and the
 * test runner so that every entry point behaves the same way.
 */

use App\Core\Config;
use App\Core\Env;
use App\Core\Logger;

define('APP_START', microtime(true));

$rootPath = dirname(__DIR__, 2);

require __DIR__ . '/Core/Env.php';
require __DIR__ . '/Core/Config.php';

Env::load($rootPath . '/.env');

/**
 * Minimal PSR-4 autoloader for the App\ namespace.
 */
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';

    if (is_file($file)) {
        require $file;
    }
});

// Never display PHP errors in the browser; they are logged instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

/**
 * Guard against recursion: a warning raised inside the handler must never be
 * handled by the handler again.
 */
$handlingError = false;

set_error_handler(static function (int $severity, string $message, string $file = '', int $line = 0) use (&$handlingError): bool {
    if ($handlingError || (error_reporting() & $severity) === 0) {
        return false;
    }

    $handlingError = true;

    try {
        Logger::log('php', $message, ['file' => $file, 'line' => $line]);
    } catch (Throwable) {
        // Never let logging failures break the response.
    }

    $handlingError = false;

    return true;
});

set_exception_handler(static function (Throwable $exception): void {
    try {
        Logger::error('Uncaught exception: ' . $exception->getMessage(), [
            'exception' => $exception::class,
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ]);
    } catch (Throwable) {
        // Ignore logging failures.
    }

    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, $exception->getMessage() . PHP_EOL);
        exit(1);
    }

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred',
        'data' => null,
        'errors' => null,
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

date_default_timezone_set((string) Config::get('app.timezone', 'Asia/Karachi'));
