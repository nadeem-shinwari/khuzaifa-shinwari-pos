<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "expenses" table.
 * Records of business expenses and overhead costs.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('expenses', [
            Column::id(),
            Column::dateTime('expense_date'),
            Column::string('category', 64),   // 'utilities', 'salaries', 'rent', 'transport', etc.
            Column::string('description', 191),
            Column::decimal('amount', 15, 2),
            Column::string('payment_method', 32)->nullable(),
            Column::string('reference', 64)->nullable(),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
        ]);

        $schema->index('expenses', ['expense_date']);
        $schema->index('expenses', ['category']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('expenses');
    }
};