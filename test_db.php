<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$host = '127.0.0.1';
$port = 3306;
$db = 'khuzaifa_management';
$user = 'root';
$pass = '';
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to $db\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables:\n";
    foreach ($tables as $t) echo " - $t\n";
    $settings = $pdo->query("SELECT setting_key, setting_value, setting_group FROM settings ORDER BY setting_group, setting_key")->fetchAll(PDO::FETCH_ASSOC);
    echo "Settings count: " . count($settings) . "\n";
    foreach ($settings as $s) {
        echo "   [{$s['setting_group']}] {$s['setting_key']} = " . substr($s['setting_value'], 0, 60) . "\n";
    }
    $sales = $pdo->query("SELECT COUNT(*) as c FROM sales")->fetch(PDO::FETCH_ASSOC);
    echo "Sales: " . $sales['c'] . "\n";
    $purchases = $pdo->query("SELECT COUNT(*) as c FROM purchases")->fetch(PDO::FETCH_ASSOC);
    echo "Purchases: " . $purchases['c'] . "\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>