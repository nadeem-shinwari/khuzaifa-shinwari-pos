<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management;charset=utf8mb4", 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$sales = $pdo->query("SELECT * FROM sales")->fetchAll(PDO::FETCH_ASSOC);
echo "SALES:\n";
foreach ($sales as $s) {
    echo "ID: {$s['id']} | Date: {$s['sale_date']} | Customer: {$s['customer_name']} ({$s['customer_code']}) | Total: {$s['total_amount']} | Ref: {$s['reference']}\n";
    echo "  Items col: " . ($s['items'] ?? 'NULL') . "\n";
    echo "  item fields: id={$s['item_id']} name={$s['item_name']} unit={$s['item_unit']} qty={$s['quantity']} price={$s['unit_price']}\n";
    echo "  notes: " . var_export($s['notes'], true) . "\n";
}
$purchases = $pdo->query("SELECT * FROM purchases")->fetchAll(PDO::FETCH_ASSOC);
echo "PURCHASES:\n";
foreach ($purchases as $p) {
    echo "ID: {$p['id']} | Date: {$p['purchase_date']} | Supplier: {$p['supplier_name']} ({$p['supplier_code']}) | Total: {$p['total_amount']} | Ref: {$p['reference']}\n";
    echo "  Items col: " . ($p['items'] ?? 'NULL') . "\n";
    echo "  item fields: id={$p['item_id']} name={$p['item_name']} unit={$p['item_unit']} qty={$p['quantity']} price={$p['unit_price']}\n";
    echo "  notes: " . var_export($p['notes'], true) . "\n";
}
$customers = $pdo->query("SELECT * FROM customers")->fetchAll(PDO::FETCH_ASSOC);
echo "CUSTOMERS:\n";
foreach ($customers as $c) {
    echo " - {$c['code']} | {$c['name']} | {$c['phone']} | {$c['alternate_phone']} | " . substr($c['address'], 0, 40) . "\n";
}
$suppliers = $pdo->query("SELECT * FROM suppliers")->fetchAll(PDO::FETCH_ASSOC);
echo "SUPPLIERS:\n";
foreach ($suppliers as $s) {
    echo " - {$s['code']} | {$s['name']} | {$s['phone']} | {$s['alternate_phone']} | " . substr($s['address'], 0, 40) . "\n";
}
$schema = $pdo->query("SELECT * FROM schema_migrations ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
echo "MIGRATIONS:\n";
foreach ($schema as $m) echo " - {$m['migration']} @ {$m['migrated_at']}\n";
?>