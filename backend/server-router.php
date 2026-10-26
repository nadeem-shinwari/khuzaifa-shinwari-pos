<?php

declare(strict_types=1);

/**
 * Router script for the PHP built-in web server (development only).
 *
 * Start it with:
 *   php -S 127.0.0.1:8000 backend/server-router.php
 *
 * It reproduces the production URL layout:
 *   /api/v1/system/health  ->  backend/api/index.php  (PATH_INFO = /v1/system/health)
 *
 * On InfinityFree the hosting web server maps /api/* to api/index.php itself,
 * so this file is never deployed.
 *
 * SECURITY: the built-in server would happily hand out every file in the
 * project root (.env, the SQLite database, the log files, the PHP sources)
 * because its document root is the directory the server was started in.
 * This router therefore serves ONLY the files under "public/" and refuses
 * everything else with a JSON 404, so a development server can never leak a
 * secret that the production web server keeps out of the web root.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$root = dirname(__DIR__);

/**
 * Refuse the request with the same JSON envelope the API uses.
 */
$deny = static function (): void {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode([
        'success' => false,
        'message' => 'Not found',
        'data' => null,
        'errors' => null,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    return;
};

// Everything under /api goes to the API front controller.
if (str_starts_with($uri, '/api')) {
    $path = substr($uri, strlen('/api'));

    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    $_SERVER['SCRIPT_FILENAME'] = $root . '/backend/api/index.php';
    $_SERVER['PHP_SELF'] = '/api/index.php';
    $_SERVER['PATH_INFO'] = $path;

    require $root . '/backend/api/index.php';

    return true;
}

// Static assets are served from "public/" only. The path is normalised first so
// that "..", encoded separators and Windows drive letters cannot escape the
// directory.
$publicRoot = realpath($root . '/public');

if ($publicRoot !== false && $uri !== '/') {
    $relative = rawurldecode(substr($uri, 1));
    $relative = str_replace('\\', '/', $relative);

    // Reject any path that tries to climb out of the public directory.
    if ($relative === '' || str_contains($relative, "\0") || preg_match('#(^|/)\.\.(/|$)#', $relative) === 1) {
        $deny();

        return true;
    }

    $candidate = realpath($publicRoot . DIRECTORY_SEPARATOR . $relative);

    // The resolved file must still live inside "public/".
    if ($candidate !== false
        && is_file($candidate)
        && str_starts_with(str_replace('\\', '/', $candidate), str_replace('\\', '/', $publicRoot) . '/')
        && !str_ends_with(strtolower($candidate), '.php')
    ) {
            $mime = mime_content_type($candidate) ?: 'application/octet-stream';
            http_response_code(200);
            header('Content-Type: ' . $mime);
            header('X-Content-Type-Options: nosniff');
            readfile($candidate);

            return true;
    }
}

// Anything else is handled by the front controller as well so that unknown
// paths return the JSON 404 envelope instead of a blank page.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = $root . '/backend/api/index.php';

require $root . '/backend/api/index.php';

return true;
