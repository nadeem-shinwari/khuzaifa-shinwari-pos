<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "categories" table used by items and other modules.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('categories', [
            Column::id(),
            Column::string('code', 32)->unique(),
            Column::string('name', 191),
            Column::text('description')->nullable(),
            Column::boolean('is_active'),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('categories', ['code']);
        $schema->index('categories', ['is_active']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('categories');
    }
};