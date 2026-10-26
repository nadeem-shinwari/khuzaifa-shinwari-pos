<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

/**
 * System endpoints: health check, API metadata and CSRF token.
 *
 * These are the only endpoints that work before authentication exists.
 */
final class SystemController
{
    /**
     * GET /api/v1/system/health
     *
     * Reports whether the API and the database connection are reachable.
     */
    public function health(Request $request, array $params = []): void
    {
        $database = [
            'connection' => (string) Config::get('database.connection'),
            'driver' => null,
            'reachable' => false,
            'error' => null,
        ];

        try {
            $pdo = Database::connection();
            $pdo->query('SELECT 1');
            $database['driver'] = (string) $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
            $database['reachable'] = true;
        } catch (\Throwable $exception) {
            // The message is generic on purpose; details go to the log file.
            $database['error'] = 'Database connection failed';
        }

        $status = 'ok';
        $message = $database['reachable'] ? 'Service is healthy' : 'Service is degraded';

        Response::json(
            [
                'status' => $status,
                'app' => (string) Config::get('app.name'),
                'environment' => (string) Config::get('app.env'),
                'php_version' => PHP_VERSION,
                'database' => $database,
                'time' => date('c'),
            ],
            $message,
            200,
        );
    }

    /**
     * GET /api/v1/system/info
     *
     * Static metadata about the API (version, CSRF header name, limits).
     */
    public function info(Request $request, array $params = []): void
    {
        Response::ok([
            'name' => (string) Config::get('app.name'),
            'api_version' => 'v1',
            'csrf_header' => (string) Config::get('security.csrf_header', 'X-CSRF-Token'),
            'default_currency' => 'PKR',
            'max_page_size' => 200,
        ]);
    }

    /**
     * GET /api/v1/system/csrf
     *
     * Returns a CSRF token for session authenticated clients.
     */
    public function csrf(Request $request, array $params = []): void
    {
        $token = Csrf::token();
        Csrf::expose();

        Response::ok([
            'token' => $token,
            'header' => (string) Config::get('security.csrf_header', 'X-CSRF-Token'),
        ]);
    }
}
