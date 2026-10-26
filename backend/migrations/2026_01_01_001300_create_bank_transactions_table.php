<?php

declare(strict_types=1);

use App\Core\Column;
use App\Core\Schema;

/**
 * Creates the "bank_transactions" table.
 * Records of bank deposits, withdrawals, and transfers.
 */
return new class {
    public function up(PDO $pdo, string $driver): void
    {
        $schema = new Schema($pdo);

        $schema->create('bank_transactions', [
            Column::id(),
            Column::bigInteger('bank_account_id')->nullable(),
            Column::dateTime('transaction_date'),
            Column::string('transaction_type', 32),   // 'deposit', 'withdrawal', 'transfer', 'payment', 'receipt'
            Column::string('description', 191),
            Column::decimal('amount', 15, 2),
            Column::string('currency', 8)->default('PKR'),
            Column::string('reference', 64)->nullable(),
            Column::string('counterparty', 191)->nullable(),
            Column::text('notes')->nullable(),
            Column::dateTime('created_at'),
        ]);

        $schema->index('bank_transactions', ['bank_account_id']);
        $schema->index('bank_transactions', ['transaction_date']);
        $schema->index('bank_transactions', 'reference');
        $schema->foreignKey('bank_transactions', 'bank_account_id', 'bank_accounts', 'id');
    }

    public function down(PDO $pdo, string $driver): void
    {
        (new Schema($pdo))->drop('bank_transactions');
    }
};