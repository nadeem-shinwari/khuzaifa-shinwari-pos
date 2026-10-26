<?php
declare(strict_types=1);

return new class {
    public function up(PDO $pdo, string $driver): void
    {
        if ($driver === 'mysql') {
            $pdo->exec('ALTER TABLE sales ADD COLUMN items LONGTEXT NULL');
        } else {
            $pdo->exec('ALTER TABLE sales ADD COLUMN items TEXT');
        }
    }

    public function down(PDO $pdo, string $driver): void
    {
    }
};