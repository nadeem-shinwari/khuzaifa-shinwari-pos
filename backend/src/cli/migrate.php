<?php

declare(strict_types=1);

/**
 * Migration runner.
 *
 * Usage:
 *   php backend/src/cli/migrate.php            apply every pending migration
 *   php backend/src/cli/migrate.php status     list the applied and pending ones
 *   php backend/src/cli/migrate.php rollback   revert the newest batch
 *   php backend/src/cli/migrate.php fresh      revert everything and re-apply
 */

use App\Core\Config;
use App\Core\Database;
use App\Core\Migrator;

require dirname(__DIR__) . '/bootstrap.php';

$command = $argv[1] ?? 'migrate';
$directory = $argv[2] ?? (string) Config::get('paths.migrations', '');

try {
    $pdo = Database::make();
    $migrator = new Migrator($pdo);

    switch ($command) {
        case 'status':
            $applied = $migrator->applied();
            $available = $migrator->available($directory);
            $pending = 0;

            echo 'Connection: ' . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . PHP_EOL;
            echo 'Migrations: ' . $directory . PHP_EOL;
            echo PHP_EOL;

            foreach ($available as $migration) {
                $isApplied = in_array($migration['name'], $applied, true);
                $state = $isApplied ? 'applied' : 'pending';

                if (!$isApplied) {
                    $pending++;
                }

                echo sprintf('  [%s] %s%s', $state, $migration['name'], PHP_EOL);
            }

            echo PHP_EOL;
            echo count($applied) . ' applied, ' . $pending . ' pending.' . PHP_EOL;
            break;

        case 'rollback':
            $reverted = $migrator->rollback($directory);

            if ($reverted === []) {
                echo 'Nothing to roll back.' . PHP_EOL;
                break;
            }

            foreach ($reverted as $name) {
                echo 'Rolled back: ' . $name . PHP_EOL;
            }
            break;

        case 'fresh':
            $reverted = $migrator->rollback($directory, 0);

            foreach ($reverted as $name) {
                echo 'Rolled back: ' . $name . PHP_EOL;
            }

            echo PHP_EOL;

            foreach ($migrator->migrate($directory) as $name) {
                echo 'Applied: ' . $name . PHP_EOL;
            }
            break;

        case 'migrate':
        default:
            $applied = $migrator->migrate($directory);

            if ($applied === []) {
                echo 'The database is already up to date.' . PHP_EOL;
                break;
            }

            foreach ($applied as $name) {
                echo 'Applied: ' . $name . PHP_EOL;
            }

            echo PHP_EOL;
            echo count($applied) . ' migration(s) applied.' . PHP_EOL;
            break;
    }
} catch (Throwable $exception) {
    fwrite(STDERR, 'Migration failed: ' . $exception->getMessage() . PHP_EOL);
    exit(1);
}
