<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Consistent JSON response helper.
 *
 * Every API endpoint answers with the same envelope:
 *   { "success": bool, "message": string, "data": mixed, "errors": mixed }
 */
final class Response
{
    private static bool $sent = false;

    /**
     * Send a JSON response and stop the script.
     */
    public static function json(mixed $data = null, string $message = '', int $status = 200): void
    {
        if (self::$sent) {
            exit;
        }
        self::$sent = true;

        $payload = [
            'success' => $status < 400,
            'message' => $message,
            'data' => $data,
        ];

        // Apache/mod_php cannot emit non-standard status codes such as 419
        // through http_response_code(); fall back to a raw status line so the
        // CSRF "session expired" response keeps its intended status on XAMPP.
        if ($status === 419) {
            header('HTTP/1.1 419 Authentication Timeout', true);
        } else {
            http_response_code($status);
        }

        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        exit;
    }

    /**
     * 200 with data.
     */
    public static function ok(mixed $data = null, string $message = 'OK'): void
    {
        self::json($data, $message, 200);
    }

    /**
     * 201 with data.
     */
    public static function created(mixed $data = null, string $message = 'Created'): void
    {
        self::json($data, $message, 201);
    }

    /**
     * 400 validation error. $errors may be a field => messages map.
     */
    public static function validationError(array $errors = [], string $message = 'Validation failed'): void
    {
        http_response_code(422);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');

        $payload = [
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ];

        self::$sent = true;
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        exit;
    }

    /**
     * 401 unauthenticated.
     */
    public static function unauthorized(string $message = 'Authentication required'): void
    {
        self::json(null, $message, 401);
    }

    /**
     * 403 forbidden.
     */
    public static function forbidden(string $message = 'You do not have permission to perform this action'): void
    {
        self::json(null, $message, 403);
    }

    /**
     * 404 not found.
     */
    public static function notFound(string $message = 'Resource not found'): void
    {
        self::json(null, $message, 404);
    }

    /**
     * 409 conflict (e.g. duplicate code).
     */
    public static function conflict(string $message = 'Conflict'): void
    {
        self::json(null, $message, 409);
    }

    /**
     * 500 internal error. The real message is logged, never returned.
     */
    public static function serverError(string $message = 'An unexpected error occurred'): void
    {
        self::json(null, $message, 500);
    }
}
