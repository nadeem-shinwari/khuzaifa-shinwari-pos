<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Session based authentication and authorization.
 *
 * Passwords are hashed with PHP's password_hash() and verified with
 * password_verify(). The plain password never leaves this class and is never
 * written to the log file.
 *
 * A successful login stores the user id in the session. Every protected
 * endpoint calls Auth::requireUser() (or Auth::requireAdmin()) which reads the
 * user from the database on each request, so a deactivated account loses
 * access immediately instead of at the end of the session.
 */
final class Auth
{
    /** The session key that holds the id of the logged in user. */
    private const SESSION_KEY = 'auth_user_id';

    /** The session key that holds the failed login counters. */
    private const ATTEMPTS_KEY = 'auth_login_attempts';

    /**
     * Find a user by email address.
     *
     * @return array<string, mixed>|null
     */
    public static function findByEmail(string $email): ?array
    {
        $email = strtolower(trim($email));

        if ($email === '') {
            return null;
        }

        $statement = Database::connection()->prepare(
            'SELECT id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at'
            . ' FROM users WHERE email = :email LIMIT 1',
        );
        $statement->execute(['email' => $email]);

        $user = $statement->fetch();

        return is_array($user) ? $user : null;
    }

    /**
     * Find a user by its primary key.
     *
     * @return array<string, mixed>|null
     */
    public static function findById(int $id): ?array
    {
        if ($id <= 0) {
            return null;
        }

        $statement = Database::connection()->prepare(
            'SELECT id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at'
            . ' FROM users WHERE id = :id LIMIT 1',
        );
        $statement->execute(['id' => $id]);

        $user = $statement->fetch();

        return is_array($user) ? $user : null;
    }

    /**
     * The user that owns the current session, if any.
     *
     * @return array<string, mixed>|null
     */
    public static function user(): ?array
    {
        $id = Session::get(self::SESSION_KEY);

        if (is_int($id)) {
            $userId = $id;
        } elseif (is_string($id) && ctype_digit($id)) {
            $userId = (int) $id;
        } else {
            return null;
        }

        $user = self::findById($userId);

        if ($user === null) {
            // The account was deleted while the session was still alive.
            self::logout();

            return null;
        }

        if ((int) $user['is_active'] !== 1) {
            self::logout();

            return null;
        }

        return $user;
    }

    /**
     * True when a user is signed in.
     */
    public static function check(): bool
    {
        return self::user() !== null;
    }

    /**
     * The id of the signed in user, or null.
     */
    public static function id(): ?int
    {
        $user = self::user();

        return $user === null ? null : (int) $user['id'];
    }

    /**
     * True when the signed in user has the "admin" role.
     */
    public static function isAdmin(): bool
    {
        $user = self::user();

        return $user !== null && strtolower((string) $user['role']) === 'admin';
    }

    /**
     * Return the signed in user or answer with 401.
     *
     * @return array<string, mixed>
     */
    public static function requireUser(): array
    {
        $user = self::user();

        if ($user === null) {
            Response::unauthorized('You must sign in to continue');
        }

        return $user;
    }

    /**
     * Return the signed in administrator or answer with 401/403.
     *
     * @return array<string, mixed>
     */
    public static function requireAdmin(): array
    {
        $user = self::requireUser();

        if (strtolower((string) $user['role']) !== 'admin') {
            Response::forbidden('Administrator access is required');
        }

        return $user;
    }


    /**
     * Attempt to sign a user in.
     *
     * @return array{ok: bool, message: string, user: array<string, mixed>|null}
     */
    public static function attempt(string $email, string $password): array
    {
        $email = strtolower(trim($email));

        if ($email === '' || $password === '') {
            return self::failure('Email and password are required.');
        }

        $lockout = self::lockoutRemaining($email);
        if ($lockout > 0) {
            return self::failure(
                "Too many failed attempts. Try again in {$lockout} seconds.",
            );
        }

        $user = self::findByEmail($email);

        if ($user === null) {
            self::recordFailure($email);

            // The same message is used for an unknown account and a wrong
            // password, so the endpoint does not reveal which accounts exist.
            return self::failure('The email address or password is incorrect.');
        }

        if (!password_verify($password, (string) $user['password_hash'])) {
            self::recordFailure($email);

            return self::failure('The email address or password is incorrect.');
        }

        if ((int) $user['is_active'] !== 1) {
            return self::failure('This account has been deactivated.');
        }

        self::clearFailures($email);
        self::login((int) $user['id']);

        return [
            'ok' => true,
            'message' => 'Signed in successfully.',
            'user' => self::publicUser(self::findById((int) $user['id']) ?? $user),
        ];
    }

    /**
     * Start an authenticated session for the given user id.
     */
    public static function login(int $userId): void
    {
        // A new session id prevents session fixation right after the login.
        Session::regenerate();

        Session::set(self::SESSION_KEY, $userId);

        // The session changed, so the old CSRF token is replaced. A token that
        // leaked together with the previous (anonymous) session id is useless.
        Csrf::rotate();

        self::touchLastLogin($userId);
    }

    /**
     * End the session and clear every stored value.
     */
    public static function logout(): void
    {
        Session::forget(self::SESSION_KEY);
        Session::forget(self::ATTEMPTS_KEY);

        Session::destroy();

        // The new anonymous session gets its own CSRF token, so the client can
        // keep making state changing requests without signing in again.
        Csrf::rotate();
    }

    /**
     * The representation of a user that is safe to send to the client.
     *
     * The password hash is never part of the returned array.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public static function publicUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => (string) $user['name'],
            'email' => (string) $user['email'],
            'role' => (string) $user['role'],
            'is_active' => (int) $user['is_active'] === 1,
            'last_login_at' => $user['last_login_at'] ?? null,
            'created_at' => $user['created_at'] ?? null,
        ];
    }

    /**
     * Change the password of the signed in user.
     *
     * @return array{ok: bool, message: string}
     */
    public static function changePassword(int $userId, string $currentPassword, string $newPassword): array
    {
        $user = self::findById($userId);

        if ($user === null) {
            return ['ok' => false, 'message' => 'User not found.'];
        }

        if (!password_verify($currentPassword, (string) $user['password_hash'])) {
            return ['ok' => false, 'message' => 'Current password is incorrect.'];
        }

        $problems = self::validatePassword($newPassword);
        if ($problems !== []) {
            return ['ok' => false, 'message' => implode(' ', $problems)];
        }

        $statement = Database::connection()->prepare(
            'UPDATE users SET password_hash = :password_hash, updated_at = :updated_at WHERE id = :id',
        );
        $statement->execute([
            'password_hash' => self::hashPassword($newPassword),
            'updated_at' => date('Y-m-d H:i:s'),
            'id' => $userId,
        ]);

        return ['ok' => true, 'message' => 'Password updated successfully.'];
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Validate a plain password against the configured rules.
     *
     * @return array<int, string> The list of problems; empty when the password is valid.
     */
    public static function validatePassword(string $password): array
    {
        $minimum = (int) Config::get('security.password_min_length', 8);
        $problems = [];

        if (strlen($password) < $minimum) {
            $problems[] = "The password must be at least {$minimum} characters long.";
        }

        if (preg_match('/[A-Za-z]/', $password) !== 1) {
            $problems[] = 'The password must contain at least one letter.';
        }

        if (preg_match('/\d/', $password) !== 1) {
            $problems[] = 'The password must contain at least one number.';
        }

        return $problems;
    }


    /**
     * Create a user account.
     *
     * @return array<string, mixed> The created user.
     */
    public static function createUser(string $name, string $email, string $password, string $role = 'admin'): array
    {
        $name = trim($name);
        $email = strtolower(trim($email));

        if ($name === '') {
            throw new \InvalidArgumentException('The name is required.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('A valid email address is required.');
        }

        $problems = self::validatePassword($password);
        if ($problems !== []) {
            throw new \InvalidArgumentException(implode(' ', $problems));
        }

        if (self::findByEmail($email) !== null) {
            throw new \InvalidArgumentException('A user with this email address already exists.');
        }

        $now = date('Y-m-d H:i:s');

        $statement = Database::connection()->prepare(
            'INSERT INTO users (name, email, password_hash, role, is_active, created_at)'
            . ' VALUES (:name, :email, :password_hash, :role, 1, :created_at)',
        );
        $statement->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => self::hashPassword($password),
            'role' => $role === '' ? 'admin' : $role,
            'created_at' => $now,
        ]);

        $user = self::findById((int) Database::connection()->lastInsertId());

        if ($user === null) {
            throw new \RuntimeException('The user could not be read back after it was created.');
        }

        return $user;
    }

    /**
     * Store the timestamp of the last successful login.
     */
    private static function touchLastLogin(int $userId): void
    {
        $statement = Database::connection()->prepare(
            'UPDATE users SET last_login_at = :last_login_at, updated_at = :updated_at WHERE id = :id',
        );
        $statement->execute([
            'last_login_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'id' => $userId,
        ]);
    }

    /**
     * Build a failed login result.
     *
     * @return array{ok: bool, message: string, user: null}
     */
    private static function failure(string $message): array
    {
        return [
            'ok' => false,
            'message' => $message,
            'user' => null,
        ];
    }

    /**
     * The number of seconds the given email address is locked out.
     */
    private static function lockoutRemaining(string $email): int
    {
        $attempts = self::attempts();
        $record = $attempts[strtolower($email)] ?? null;

        if (!is_array($record)) {
            return 0;
        }

        $lockedUntil = (int) ($record['locked_until'] ?? 0);
        if ($lockedUntil <= time()) {
            return 0;
        }

        return $lockedUntil - time();
    }

    /**
     * Record a failed login and lock the account when the limit is reached.
     */
    private static function recordFailure(string $email): void
    {
        $email = strtolower($email);
        $attempts = self::attempts();

        $count = (int) ($attempts[$email]['count'] ?? 0) + 1;
        $maximum = max(1, (int) Config::get('security.max_login_attempts', 5));
        $lockout = max(0, (int) Config::get('security.lockout_seconds', 300));

        $attempts[$email] = [
            'count' => $count,
            'locked_until' => $count >= $maximum ? time() + $lockout : 0,
        ];

        Session::set(self::ATTEMPTS_KEY, $attempts);
    }

    /**
     * Forget the failed login counter of an email address.
     */
    private static function clearFailures(string $email): void
    {
        $attempts = self::attempts();
        unset($attempts[strtolower($email)]);

        Session::set(self::ATTEMPTS_KEY, $attempts);
    }

    /**
     * The failed login counters stored in the session.
     *
     * @return array<string, array{count: int, locked_until: int}>
     */
    private static function attempts(): array
    {
        $attempts = Session::get(self::ATTEMPTS_KEY);

        return is_array($attempts) ? $attempts : [];
    }
}
