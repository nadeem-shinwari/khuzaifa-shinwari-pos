<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "purchases" table.
 * Records of goods purchased from suppliers.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('purchases', [
            Column::id(),
            Column::dateTime('purchase_date'),
            Column::string('supplier_code', 32),
            Column::string('supplier_name', 191),
            Column::decimal('total_amount', 15, 2),
            Column::string('payment_method', 32),
            Column::string('reference', 64)->nullable(),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('purchases', ['supplier_code']);
        $schema->index('purchases', ['purchase_date']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('purchases');
    }
};