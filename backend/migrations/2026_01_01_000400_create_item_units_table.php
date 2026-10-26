<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "item_units" table for unit conversion records.
 *
 * Each row defines how many base units (pieces) one unit of a given type
 * contains. For example: 1 dozen = 12 pieces, 1 box = 10 packets, etc.
 * The conversion factor is always relative to the base unit (piece).
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('item_units', [
            Column::id(),
            Column::string('name', 32)->unique(),
            Column::string('abbreviation', 16)->unique(),
            Column::integer('pieces_per_unit'),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('item_units', ['pieces_per_unit']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('item_units');
    }
};