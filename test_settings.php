<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management;charset=utf8mb4", 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$rows = $pdo->query("SELECT setting_key, setting_value, setting_group FROM settings WHERE setting_group IN ('general','terms') ORDER BY setting_group, setting_key")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "[" . $r['setting_group'] . "] " . $r['setting_key'] . " = " . $r['setting_value'] . "\n";
}
?>