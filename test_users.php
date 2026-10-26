<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management;charset=utf8mb4", 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$rows = $pdo->query("SELECT id, name, email, role, is_active FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) print_r($r);
?>