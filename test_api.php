<?php
// Minimal API health check
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$result = $pdo->query('SELECT 1');
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'app' => 'Khuzaifa Shinwari',
    'environment' => 'local',
    'php_version' => PHP_VERSION,
    'database' => [
        'connection' => 'mysql',
        'driver' => $driver,
        'reachable' => true,
    ],
    'time' => date('c'),
]);