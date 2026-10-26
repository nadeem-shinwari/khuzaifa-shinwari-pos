<?php
declare(strict_types=1);

return new class {
    public function up(PDO $pdo, string $driver): void
    {
        if ($driver === 'mysql') {
            $pdo->exec('ALTER TABLE sales ADD COLUMN item_id BIGINT NULL');
            $pdo->exec('ALTER TABLE sales ADD COLUMN item_name VARCHAR(191) NULL');
            $pdo->exec('ALTER TABLE sales ADD COLUMN item_unit VARCHAR(32) NULL');
            $pdo->exec('ALTER TABLE sales ADD COLUMN quantity INT NULL');
            $pdo->exec('ALTER TABLE sales ADD COLUMN unit_price DECIMAL(15,2) NULL');
        } else {
            $pdo->exec('ALTER TABLE sales ADD COLUMN item_id INTEGER');
            $pdo->exec('ALTER TABLE sales ADD COLUMN item_name TEXT');
            $pdo->exec('ALTER TABLE sales ADD COLUMN item_unit TEXT');
            $pdo->exec('ALTER TABLE sales ADD COLUMN quantity INTEGER');
            $pdo->exec('ALTER TABLE sales ADD COLUMN unit_price NUMERIC(15,2)');
        }
    }

    public function down(PDO $pdo, string $driver): void
    {
        // Column removal is not supported portably; leave as-is.
    }
};
