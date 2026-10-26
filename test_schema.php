<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management;charset=utf8mb4", 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
echo "schema_migrations columns:\n";
$cols = $pdo->query("DESCRIBE schema_migrations")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) echo " - {$c['Field']} {$c['Type']}\n";
echo "rows:\n";
$rows = $pdo->query("SELECT * FROM schema_migrations")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) print_r($r);
echo "\nsuppliers count: " . $pdo->query("SELECT COUNT(*) FROM suppliers")->fetchColumn() . "\n";
echo "sale_items count: " . $pdo->query("SELECT COUNT(*) FROM sale_items")->fetchColumn() . "\n";
$si = $pdo->query("SELECT * FROM sale_items")->fetchAll(PDO::FETCH_ASSOC);
foreach ($si as $r) print_r($r);
?>