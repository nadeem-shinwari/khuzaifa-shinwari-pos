<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Session helper with hardened cookie settings.
 *
 * Sessions are only started for HTTP requests. The cookie is HttpOnly, uses
 * SameSite=Lax and is marked Secure when the app is served over HTTPS.
 */
final class Session
{
    private static bool $started = false;

    /**
     * Start the session if it has not been started yet.
     */
    public static function start(): void
    {
        if (self::$started || PHP_SAPI === 'cli') {
            self::$started = true;

            return;
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            self::$started = true;

            return;
        }

        $isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

        session_name((string) Config::get('session.name', 'ks_session'));
        session_set_cookie_params([
            'lifetime' => (int) Config::get('session.lifetime', 7200),
            'path' => '/',
            'domain' => '',
            'secure' => (bool) Config::get('session.secure', false) || $isHttps,
            'httponly' => true,
            'samesite' => (string) Config::get('session.samesite', 'Lax'),
        ]);

        session_start();
        self::$started = true;
    }

    /**
     * Read a session value.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Write a session value.
     */
    public static function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    /**
     * Remove a session value.
     */
    public static function forget(string $key): void
    {
        unset($_SESSION[$key]);
    }

    /**
     * Destroy the session and its cookie.
     *
     * A brand new anonymous session is started right afterwards so the
     * application can hand out a fresh CSRF token without keeping the old
     * (authenticated) session alive.
     */
    public static function destroy(): void
    {
        $_SESSION = [];

        if (PHP_SAPI === 'cli' || session_status() !== PHP_SESSION_ACTIVE) {
            self::$started = false;

            return;
        }

        // The old session data is removed from the server and a brand new
        // session id is issued in a single step. The previous id can never be
        // reused, even if it was captured before the sign-out, and the browser
        // only ever receives the new cookie.
        session_regenerate_id(true);
        $_SESSION = [];

        self::$started = true;
    }

    /**
     * Regenerate the session id (used right after a successful login).
     */
    public static function regenerate(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }
}
