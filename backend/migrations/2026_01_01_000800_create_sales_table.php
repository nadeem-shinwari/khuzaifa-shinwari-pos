<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "sales" table.
 * Records of goods sold to customers.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('sales', [
            Column::id(),
            Column::dateTime('sale_date'),
            Column::string('customer_code', 32),
            Column::string('customer_name', 191),
            Column::decimal('total_amount', 15, 2),
            Column::string('payment_method', 32),
            Column::string('reference', 64)->nullable(),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('sales', ['customer_code']);
        $schema->index('sales', ['sale_date']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('sales');
    }
};