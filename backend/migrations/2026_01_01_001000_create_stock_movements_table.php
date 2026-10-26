<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "stock_movements" table.
 * Tracks inventory changes (adjustments, transfers, losses, finds).
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('stock_movements', [
            Column::id(),
            Column::bigInteger('item_id')->nullable(),
            Column::string('movement_type', 32),   // 'in', 'out', 'adjustment', 'transfer', 'loss', 'find'
            Column::string('reference_type', 32)->nullable(), // 'purchase', 'sale', 'transfer', etc.
            Column::bigInteger('reference_id')->nullable(),
            Column::string('from_location', 64)->nullable(),
            Column::string('to_location', 64)->nullable(),
            Column::integer('quantity_change'),
            Column::decimal('quantity_before', 15, 4),
            Column::decimal('quantity_after', 15, 4),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
        ]);

        $schema->index('stock_movements', ['item_id']);
        $schema->index('stock_movements', ['movement_type']);
        $schema->index('stock_movements', 'created_at');
        $schema->foreignKey('stock_movements', 'item_id', 'items', 'id');
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('stock_movements');
    }
};