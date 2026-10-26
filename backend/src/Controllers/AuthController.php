<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Logger;
use App\Core\Request;
use App\Core\Response;

/**
 * Authentication endpoints.
 *
 * The session cookie is the only credential: there is no token in
 * localStorage and the password never travels back to the client.
 */
final class AuthController
{
    /**
     * POST /api/v1/auth/login
     *
     * Signs a user in with an email address and a password.
     */
    public function login(Request $request, array $params = []): void
    {
        if (!Csrf::validate()) {
            Response::json(null, 'Your session expired. Please reload the page and try again.', 419);
        }

        $email = $request->string('email');
        $password = (string) $request->input('password', '');

        if ($email === '') {
            Response::validationError(['email' => ['The email address is required.']], 'Validation failed');
        }

        if ($password === '') {
            Response::validationError(['password' => ['The password is required.']], 'Validation failed');
        }

        $result = Auth::attempt($email, $password);

        if (!$result['ok']) {
            // The failure is logged without the password so the log file never
            // contains a credential.
            Logger::log('warning', 'Failed sign-in attempt', ['email' => $email]);

            Response::json(null, $result['message'], 401);
        }

        // The session id changed, so the previous CSRF token is replaced.
        Csrf::expose();

        Response::ok([
            'user' => $result['user'],
            'csrf_token' => Csrf::token(),
        ], $result['message']);
    }

    /**
     * POST /api/v1/auth/logout
     *
     * Ends the session of the current user.
     */
    public function logout(Request $request, array $params = []): void
    {
        if (!Csrf::validate()) {
            Response::json(null, 'Your session expired. Please reload the page and try again.', 419);
        }

        Auth::logout();

        // A fresh token is issued for the new (anonymous) session.
        Csrf::expose();

        Response::ok(null, 'Signed out successfully.');
    }

    /**
     * GET /api/v1/auth/me
     *
     * Returns the signed in user, or null when nobody is signed in.
     *
     * The frontend calls this on every page load to restore the session.
     */
    public function me(Request $request, array $params = []): void
    {
        $user = Auth::user();

        // The token is returned in every case: the client needs one for its
        // state changing requests, no matter whether somebody is signed in.
        Response::ok([
            'user' => $user === null ? null : Auth::publicUser($user),
            'csrf_token' => Csrf::token(),
        ], $user === null ? 'No user is signed in' : 'Signed in');
    }

    /**
     * POST /api/v1/auth/change-password
     *
     * Changes the password of the signed in user.
     */
    public function changePassword(Request $request, array $params = []): void
    {
        if (!Csrf::validate()) {
            Response::json(null, 'Your session expired. Please reload the page and try again.', 419);
        }

        $user = Auth::requireUser();

        $currentPassword = (string) $request->input('current_password', '');
        $newPassword = (string) $request->input('new_password', '');

        if ($currentPassword === '' || $newPassword === '') {
            Response::validationError([
                'current_password' => $currentPassword === '' ? ['The current password is required.'] : [],
                'new_password' => $newPassword === '' ? ['The new password is required.'] : [],
            ], 'Validation failed');
        }

        $result = Auth::changePassword((int) $user['id'], $currentPassword, $newPassword);

        if (!$result['ok']) {
            Response::json(null, $result['message'], 422);
        }

        Response::ok(null, $result['message']);
    }
}
