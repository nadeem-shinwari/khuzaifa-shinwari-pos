<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "customers" table.
 *
 * Opening balance type is either "receivable" (customer owes us) or
 * "payable" (we owe the customer). A debit increases the receivable balance
 * and a credit reduces it.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('customers', [
            Column::id(),
            Column::string('code', 32)->unique(),
            Column::string('name', 191),
            Column::string('phone', 32)->nullable(),
            Column::string('alternate_phone', 32)->nullable(),
            Column::text('address')->nullable(),
            Column::decimal('opening_balance', 15, 2),
            Column::string('opening_balance_type', 16),
            Column::text('notes')->nullable(),
            Column::boolean('is_active'),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('customers', ['code']);
        $schema->index('customers', ['name']);
        $schema->index('customers', ['is_active']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('customers');
    }
};