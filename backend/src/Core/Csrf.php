<?php

declare(strict_types=1);

namespace App\Core;

/**
 * CSRF protection for session authenticated, state changing requests.
 *
 * A random token is stored in the session and sent to the client in the
 * "X-CSRF-Token" response header and as a readable cookie, so the frontend can
 * echo it back in the "X-CSRF-Token" request header.
 */
final class Csrf
{
    /**
     * Return (and create when missing) the current CSRF token.
     */
    public static function token(): string
    {
        $token = Session::get('csrf_token');

        if (!is_string($token) || $token === '') {
            $token = bin2hex(random_bytes(32));
            Session::set('csrf_token', $token);
        }

        return $token;
    }

    /**
     * Issue a brand new CSRF token.
     *
     * The token is replaced whenever the session changes (sign in / sign out),
     * so a token that leaked together with an old session id is useless.
     */
    public static function rotate(): string
    {
        $token = bin2hex(random_bytes(32));
        Session::set('csrf_token', $token);

        return $token;
    }

    /**
     * Send the token to the browser (header + readable cookie).
     */
    public static function expose(): void
    {
        $token = self::token();

        if (PHP_SAPI === 'cli') {
            return;
        }

        header((string) Config::get('security.csrf_header', 'X-CSRF-Token') . ': ' . $token);

        $isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

        setcookie('csrf_token', $token, [
            'expires' => 0,
            'path' => '/',
            'secure' => $isHttps || (bool) Config::get('session.secure', false),
            'httponly' => false, // Readable by JavaScript so the SPA can send it back.
            'samesite' => (string) Config::get('session.samesite', 'Lax'),
        ]);
    }

    /**
     * Validate the token sent with the current request.
     */
    public static function validate(): bool
    {
        $expected = Session::get('csrf_token');
        if (!is_string($expected) || $expected === '') {
            return false;
        }

        $header = (string) Config::get('security.csrf_header', 'X-CSRF-Token');
        $provided = $_SERVER['HTTP_' . strtoupper(str_replace('-', '_', $header))] ?? '';
        $provided = is_string($provided) ? $provided : '';

        // Only the header or the form field are accepted as the proof of the
        // request. The cookie is deliberately NOT read here: it is only a
        // convenient way for the single page application to obtain a token.
        // Accepting the cookie would let any script that can write cookies
        // forge a request, which is exactly what the header prevents.
        if ($provided === '') {
            $provided = (string) ($_POST['csrf_token'] ?? '');
        }

        return $provided !== '' && hash_equals($expected, $provided);
    }
}
