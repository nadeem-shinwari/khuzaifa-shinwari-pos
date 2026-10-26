<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management;charset=utf8mb4", 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$hash = password_hash('Admin1234', PASSWORD_DEFAULT);
$pdo->prepare("UPDATE users SET password_hash = :hash WHERE email = :email")->execute([':hash' => $hash, ':email' => 'admin@example.com']);
echo "Password set for admin@example.com\n";
?>