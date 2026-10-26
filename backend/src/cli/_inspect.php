<?php

declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

foreach ($argv as $index => $value) {
    echo $index . ' => [' . $value . ']' . PHP_EOL;
}

$rows = $pdo->query("SELECT type, name, sql FROM sqlite_master ORDER BY type, name")->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as $row) {
    echo sprintf("[%s] %s%s", $row['type'], $row['name'], PHP_EOL);
    echo '    ' . $row['sql'] . PHP_EOL;
}

echo PHP_EOL . '--- schema_migrations ---' . PHP_EOL;

foreach ($pdo->query('SELECT * FROM schema_migrations')->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo json_encode($row) . PHP_EOL;
}
