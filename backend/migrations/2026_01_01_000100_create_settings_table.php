<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "settings" table.
 *
 * Settings are stored as key/value pairs so the general settings module (Phase 8)
 * can add entries without changing the schema.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('settings', [
            Column::id(),
            Column::string('setting_key', 191)->unique(),
            Column::text('setting_value')->nullable(),
            Column::string('setting_group', 64),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('settings', ['setting_group']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('settings');
    }
};
