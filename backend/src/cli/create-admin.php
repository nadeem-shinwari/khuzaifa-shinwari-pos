<?php

declare(strict_types=1);

/**
 * Creates the first administrator account.
 *
 * Usage:
 *   php backend/src/cli/create-admin.php --name="Khuzaifa" --email=admin@example.com --password="Secret123"
 *
 * The values can also be passed as positional arguments or read from the
 * environment (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD).
 */

use App\Core\Auth;
use App\Core\Database;

require dirname(__DIR__) . '/bootstrap.php';

/**
 * Read a value from the command line options, the positional arguments or the
 * environment, in that order.
 *
 * The options are read from $argv, which has to be captured explicitly
 * because it is a global variable and not a superglobal.
 */
$argument = static function (string $name, int $position, string $fallback = '') use ($argv): string {
    foreach ($argv as $index => $value) {
        if ($index === 0) {
            continue;
        }

        if (str_starts_with($value, '--' . $name . '=')) {
            return trim(substr($value, strlen($name) + 3));
        }

        if ($value === '--' . $name && isset($argv[$index + 1])) {
            return trim((string) $argv[$index + 1]);
        }
    }

    if (isset($argv[$position]) && !str_starts_with((string) $argv[$position], '--')) {
        return trim((string) $argv[$position]);
    }

    $environment = getenv('ADMIN_' . strtoupper($name));

    return is_string($environment) && $environment !== '' ? trim($environment) : $fallback;
};

$name = $argument('name', 1, 'Administrator');
$email = $argument('email', 2);
$password = $argument('password', 3);
$role = $argument('role', 4, 'admin');

if ($email === '' || $password === '') {
    fwrite(STDERR, 'Usage: php backend/src/cli/create-admin.php --name="Name" --email="user@example.com" --password="Secret123"' . PHP_EOL);
    fwrite(STDERR, 'The email address and the password are required.' . PHP_EOL);
    exit(1);
}

try {
    $problems = Auth::validatePassword($password);
    if ($problems !== []) {
        fwrite(STDERR, 'The password is not valid:' . PHP_EOL);
        foreach ($problems as $problem) {
            fwrite(STDERR, '  - ' . $problem . PHP_EOL);
        }
        exit(1);
    }

    $user = Auth::createUser($name, $email, $password, $role);

    echo 'Administrator created.' . PHP_EOL;
    echo '  id:    ' . (int) $user['id'] . PHP_EOL;
    echo '  name:  ' . (string) $user['name'] . PHP_EOL;
    echo '  email: ' . (string) $user['email'] . PHP_EOL;
    echo '  role:  ' . (string) $user['role'] . PHP_EOL;
} catch (InvalidArgumentException $exception) {
    fwrite(STDERR, 'The administrator could not be created: ' . $exception->getMessage() . PHP_EOL);
    exit(1);
} catch (Throwable $exception) {
    fwrite(STDERR, 'The administrator could not be created: ' . $exception->getMessage() . PHP_EOL);
    exit(1);
} finally {
    Database::disconnect();
}
