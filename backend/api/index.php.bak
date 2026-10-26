<?php

declare(strict_types=1);

/**
 * HTTP front controller for the JSON API.
 *
 * Deploy this file as "api/index.php" (or point the host at it) and route
 * every /api/* request to it. All responses are JSON.
 */

use App\Core\Csrf;
use App\Core\Logger;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Core\Session;

require dirname(__DIR__) . '/src/bootstrap.php';

Session::start();

$request = new Request();
$router = new Router();

$routesFile = dirname(__DIR__) . '/src/routes.php';
if (!is_file($routesFile)) {
    Response::serverError('API routes are not available');
}

/** @var callable(Router): void $registerRoutes */
$registerRoutes = require $routesFile;
$registerRoutes($router);

try {
    [$pathMatched, $methodMatched] = $router->dispatch($request->method(), $request->path(), $request);
} catch (Throwable $exception) {
    Logger::error('API request failed: ' . $exception->getMessage(), [
        'path' => $request->path(),
        'method' => $request->method(),
    ]);

    Response::serverError();
}

if (!$pathMatched) {
    Response::notFound('Endpoint not found');
}

// The path exists but the verb does not: let the client know it may retry.
header('Allow: GET, POST, PUT, PATCH, DELETE');

Response::json(null, 'Method not allowed', 405);
