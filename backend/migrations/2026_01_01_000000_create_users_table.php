<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "users" table used for authentication and authorization.
 *
 * The role column is a plain string so new roles can be added without a
 * migration; "admin" is the only role that may manage other users.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('users', [
            Column::id(),
            Column::string('name'),
            Column::string('email', 191)->unique(),
            Column::string('password_hash', 255),
            Column::string('role', 32),
            Column::boolean('is_active'),
            Column::dateTime('last_login_at')->nullable(),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('users', ['role']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('users');
    }
};
