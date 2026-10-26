<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "bank_accounts" table.
 * Records of bank and cash accounts used for transactions.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('bank_accounts', [
            Column::id(),
            Column::string('code', 32)->unique(),
            Column::string('name', 191),
            Column::string('account_type', 32),   // 'bank', 'cash', 'credit_card'
            Column::string('bank_name', 191)->nullable(),
            Column::string('account_number', 32)->nullable(),
            Column::string('currency', 8)->default('PKR'),
            Column::decimal('balance', 15, 2)->default(0),
            Column::boolean('is_active')->default(true),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
            Column::dateTime('updated_at')->nullable(),
        ]);

        $schema->index('bank_accounts', ['code']);
        $schema->index('bank_accounts', ['account_type']);
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('bank_accounts');
    }
};