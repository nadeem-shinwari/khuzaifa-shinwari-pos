<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "items" table.
 *
 * Stock quantities and prices are stored as fixed-precision decimals. The
 * category_id foreign key references the categories table; a category can be
 * deactivated but not deleted while items still reference it.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('items', [
            Column::id(),
            Column::string('code', 32)->unique(),
            Column::string('name', 191),
            Column::bigInteger('category_id')->nullable(),
            Column::string('unit_of_measurement', 32),
            Column::decimal('purchase_price', 15, 2),
            Column::decimal('sale_price', 15, 2),
            Column::decimal('opening_stock_quantity', 15, 4),
            Column::decimal('reorder_level', 15, 4),
            Column::string('barcode', 64)->nullable(),
            Column::text('description')->nullable(),
            Column::boolean('is_active'),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ], [
            'FOREIGN KEY (category_id) REFERENCES categories(id)',
        ]);

        $schema->index('items', ['code']);
        $schema->index('items', ['name']);
        $schema->index('items', ['category_id']);
        $schema->index('items', ['barcode']);
        $schema->index('items', ['is_active']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('items');
    }
};