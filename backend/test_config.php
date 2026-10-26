<?php
// Test script to verify configuration
$rootPath = 'D:/xampp/htdocs/khuzaifa-shinwari';
require $rootPath . '/backend/src/bootstrap.php';

echo "=== Configuration Test ===\n";
echo "App Name: " . App\Core\Config::get('app.name') . "\n";
echo "App Env: " . App\Core\Config::get('app.env') . "\n";
echo "App Debug: " . (App\Core\Config::get('app.debug') ? 'true' : 'false') . "\n";
echo "App URL: " . App\Core\Config::get('app.url') . "\n";
echo "DB Connection: " . App\Core\Config::get('database.connection') . "\n";

$databaseConfig = App\Core\Config::get('database.sqlite');
echo "SQLite Path: " . $databaseConfig['path'] . "\n";

$mysqlConfig = App\Core\Config::get('database.mysql');
echo "MySQL Host: " . $mysqlConfig['host'] . "\n";
echo "MySQL Database: " . $mysqlConfig['database'] . "\n";

echo "\n=== Testing Database Connection ===\n";
try {
    $pdo = App\Core\Database::connection();
    echo "Database connected successfully!\n";
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Driver: " . $driver . "\n";
    
    // Test query
    $stmt = $pdo->query('SELECT 1 AS test');
    $result = $stmt->fetch();
    echo "Query result: " . json_encode($result) . "\n";
    
    // Check tables
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "\n";
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== PHP Version ===\n";
echo PHP_VERSION . "\n";

echo "\n=== Test Complete ===\n";