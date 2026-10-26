<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "purchase_items" table.
 * Individual items within a purchase order.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('purchase_items', [
            Column::id(),
            Column::bigInteger('purchase_id')->nullable(),
            Column::bigInteger('item_id')->nullable(),
            Column::string('code', 32)->nullable(),
            Column::string('name', 191),
            Column::string('unit_of_measurement', 32),
            Column::integer('quantity'),
            Column::decimal('unit_price', 15, 2),
            Column::decimal('total_price', 15, 2),
            Column::integer('discount_percent')->default(0),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
        ]);

        $schema->index('purchase_items', ['purchase_id']);
        $schema->index('purchase_items', ['item_id']);
        $schema->foreignKey('purchase_items', 'purchase_id', 'purchases', 'id');
        $schema->foreignKey('purchase_items', 'item_id', 'items', 'id');
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('purchase_items');
    }
};