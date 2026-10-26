<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

/**
 * Item endpoints.
 *
 * Items represent sellable/purchasable products with stock tracking. Read
 * access is open to signed-in users; create, update and deactivate require
 * administrator authorization.
 */
final class ItemsController
{
    /** GET /api/v1/items */
    public function index(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $pdo = Database::connection();
        $page = $request->pagination();
        $search = trim((string) $request->input('search', ''));
        $categoryId = $request->int('category_id', 0);
        $onlyActive = $request->bool('active', true);

        $where = [];
        $bind = [];

        if ($onlyActive) {
            $where[] = 'i.is_active = 1';
        }

        if ($categoryId > 0) {
            $where[] = 'i.category_id = :category_id';
            $bind[':category_id'] = $categoryId;
        }

        if ($search !== '') {
            $where[] = '(i.name LIKE :search OR i.code LIKE :search OR i.barcode LIKE :search)';
            $bind[':search'] = '%' . $search . '%';
        }

        $whereSql = $where === [] ? '' : 'WHERE ' . implode(' AND ', $where);
        $joinSql = 'LEFT JOIN categories c ON i.category_id = c.id';

        $countStatement = $pdo->prepare(
            "SELECT COUNT(*) FROM items i {$joinSql} {$whereSql}"
        );
        $countStatement->execute($bind);
        $total = (int) $countStatement->fetchColumn();

        $statement = $pdo->prepare(
            "SELECT i.id, i.code, i.name, i.category_id, c.name AS category_name,
                    i.unit_of_measurement, i.purchase_price, i.sale_price,
                    i.opening_stock_quantity, i.reorder_level, i.barcode,
                    i.description, i.is_active, i.created_at, i.updated_at
             FROM items i {$joinSql} {$whereSql}
             ORDER BY i.name ASC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($bind as $key => $value) {
            $statement->bindValue($key, $value);
        }
        $statement->bindValue(':limit', $page['per_page'], \PDO::PARAM_INT);
        $statement->bindValue(':offset', $page['offset'], \PDO::PARAM_INT);
        $statement->execute();

        Response::ok([
            'data' => $statement->fetchAll(\PDO::FETCH_ASSOC),
            'pagination' => [
                'page' => $page['page'],
                'per_page' => $page['per_page'],
                'total' => $total,
                'pages' => (int) ceil($total / $page['per_page']),
            ],
        ]);
    }

    /** POST /api/v1/items */
    public function store(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $code = trim((string) $request->input('code', ''));
        $name = trim((string) $request->input('name', ''));
        $categoryId = $request->int('category_id', 0);
        $unitOfMeasurement = trim((string) $request->input('unit_of_measurement', ''));
        $purchasePrice = $request->float('purchase_price', 0.0);
        $salePrice = $request->float('sale_price', 0.0);
        $openingStock = $request->float('opening_stock_quantity', 0.0);
        $reorderLevel = $request->float('reorder_level', 0.0);
        $barcode = trim((string) $request->input('barcode', ''));
        $description = trim((string) $request->input('description', ''));
        $isActive = $request->bool('is_active', true);

        if ($code === '') {
            Response::validationError(['code' => ['The item code is required.']], 'Validation failed');
        }
        if ($name === '') {
            Response::validationError(['name' => ['The item name is required.']], 'Validation failed');
        }
        if ($unitOfMeasurement === '') {
            Response::validationError(['unit_of_measurement' => ['The unit of measurement is required.']], 'Validation failed');
        }

        $pdo = Database::connection();

        $existing = $pdo->prepare('SELECT id FROM items WHERE code = :code LIMIT 1');
        $existing->execute([':code' => $code]);
        if ($existing->fetch() !== false) {
            Response::validationError(['code' => ['An item with this code already exists.']], 'Validation failed');
        }

        if ($categoryId > 0) {
            $cat = $pdo->prepare('SELECT id FROM categories WHERE id = :id AND is_active = 1 LIMIT 1');
            $cat->execute([':id' => $categoryId]);
            if ($cat->fetch() === false) {
                Response::validationError(['category_id' => ['The selected category does not exist or is inactive.']], 'Validation failed');
            }
        }

        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare(
            'INSERT INTO items (code, name, category_id, unit_of_measurement, purchase_price, sale_price,'
            . ' opening_stock_quantity, reorder_level, barcode, description, is_active, created_at, updated_at)'
            . ' VALUES (:code, :name, :category_id, :unit_of_measurement, :purchase_price, :sale_price,'
            . ' :opening_stock_quantity, :reorder_level, :barcode, :description, :is_active, :created_at, :updated_at)'
        );
        $statement->execute([
            ':code' => $code,
            ':name' => $name,
            ':category_id' => $categoryId > 0 ? $categoryId : null,
            ':unit_of_measurement' => $unitOfMeasurement,
            ':purchase_price' => $purchasePrice,
            ':sale_price' => $salePrice,
            ':opening_stock_quantity' => $openingStock,
            ':reorder_level' => $reorderLevel,
            ':barcode' => $barcode === '' ? null : $barcode,
            ':description' => $description === '' ? null : $description,
            ':is_active' => $isActive ? 1 : 0,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare(
            'SELECT i.id, i.code, i.name, i.category_id, c.name AS category_name,'
            . ' i.unit_of_measurement, i.purchase_price, i.sale_price, i.opening_stock_quantity,'
            . ' i.reorder_level, i.barcode, i.description, i.is_active, i.created_at, i.updated_at'
            . ' FROM items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = :id'
        );
        $statement->execute([':id' => $id]);

        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Item created.', 201);
    }

    /** GET /api/v1/items/{id} */
    public function show(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Item not found');
        }

        $pdo = Database::connection();
        $statement = $pdo->prepare(
            'SELECT i.id, i.code, i.name, i.category_id, c.name AS category_name,'
            . ' i.unit_of_measurement, i.purchase_price, i.sale_price, i.opening_stock_quantity,'
            . ' i.reorder_level, i.barcode, i.description, i.is_active, i.created_at, i.updated_at'
            . ' FROM items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = :id LIMIT 1'
        );
        $statement->execute([':id' => $id]);
        $item = $statement->fetch(\PDO::FETCH_ASSOC);

        if ($item === false) {
            Response::notFound('Item not found');
        }

        Response::ok($item);
    }

    /** PATCH /api/v1/items/{id} */
    public function update(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Item not found');
        }

        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM items WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Item not found');
        }

        $code = trim((string) $request->input('code', ''));
        $name = trim((string) $request->input('name', ''));
        $categoryId = $request->int('category_id', 0);
        $unitOfMeasurement = trim((string) $request->input('unit_of_measurement', ''));
        $purchasePrice = $request->float('purchase_price', 0.0);
        $salePrice = $request->float('sale_price', 0.0);
        $openingStock = $request->float('opening_stock_quantity', 0.0);
        $reorderLevel = $request->float('reorder_level', 0.0);
        $barcode = trim((string) $request->input('barcode', ''));
        $description = trim((string) $request->input('description', ''));
        $isActive = $request->bool('is_active', true);

        if ($code === '') {
            Response::validationError(['code' => ['The item code is required.']], 'Validation failed');
        }
        if ($name === '') {
            Response::validationError(['name' => ['The item name is required.']], 'Validation failed');
        }
        if ($unitOfMeasurement === '') {
            Response::validationError(['unit_of_measurement' => ['The unit of measurement is required.']], 'Validation failed');
        }

        $duplicate = $pdo->prepare('SELECT id FROM items WHERE code = :code AND id <> :id LIMIT 1');
        $duplicate->execute([':code' => $code, ':id' => $id]);
        if ($duplicate->fetch() !== false) {
            Response::validationError(['code' => ['An item with this code already exists.']], 'Validation failed');
        }

        if ($categoryId > 0) {
            $cat = $pdo->prepare('SELECT id FROM categories WHERE id = :id AND is_active = 1 LIMIT 1');
            $cat->execute([':id' => $categoryId]);
            if ($cat->fetch() === false) {
                Response::validationError(['category_id' => ['The selected category does not exist or is inactive.']], 'Validation failed');
            }
        }

        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare(
            'UPDATE items SET code = :code, name = :name, category_id = :category_id,'
            . ' unit_of_measurement = :unit_of_measurement, purchase_price = :purchase_price,'
            . ' sale_price = :sale_price, opening_stock_quantity = :opening_stock_quantity,'
            . ' reorder_level = :reorder_level, barcode = :barcode, description = :description,'
            . ' is_active = :is_active, updated_at = :updated_at WHERE id = :id'
        );
        $statement->execute([
            ':code' => $code,
            ':name' => $name,
            ':category_id' => $categoryId > 0 ? $categoryId : null,
            ':unit_of_measurement' => $unitOfMeasurement,
            ':purchase_price' => $purchasePrice,
            ':sale_price' => $salePrice,
            ':opening_stock_quantity' => $openingStock,
            ':reorder_level' => $reorderLevel,
            ':barcode' => $barcode === '' ? null : $barcode,
            ':description' => $description === '' ? null : $description,
            ':is_active' => $isActive ? 1 : 0,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        $statement = $pdo->prepare(
            'SELECT i.id, i.code, i.name, i.category_id, c.name AS category_name,'
            . ' i.unit_of_measurement, i.purchase_price, i.sale_price, i.opening_stock_quantity,'
            . ' i.reorder_level, i.barcode, i.description, i.is_active, i.created_at, i.updated_at'
            . ' FROM items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = :id'
        );
        $statement->execute([':id' => $id]);

        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Item updated.');
    }

    /** DELETE /api/v1/items/{id} */
    public function destroy(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Item not found');
        }

        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM items WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Item not found');
        }

        $pdo->prepare('UPDATE items SET is_active = 0, updated_at = :updated_at WHERE id = :id')
            ->execute([':updated_at' => date('Y-m-d H:i:s'), ':id' => $id]);

        Response::ok(null, 'Item deactivated.');
    }
}