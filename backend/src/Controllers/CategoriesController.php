<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

/**
 * Category endpoints.
 *
 * Categories group items. Read access is open to signed-in users; create,
 * update and deactivate require administrator authorization.
 */
final class CategoriesController
{
    /** GET /api/v1/categories */
    public function index(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $pdo = Database::connection();
        $page = $request->pagination();
        $search = trim((string) $request->input('search', ''));
        $onlyActive = $request->bool('active', true);

        $where = [];
        $bind = [];

        if ($onlyActive) {
            $where[] = 'is_active = 1';
        }

        if ($search !== '') {
            $where[] = '(name LIKE :search OR code LIKE :search)';
            $bind[':search'] = '%' . $search . '%';
        }

        $whereSql = $where === [] ? '' : 'WHERE ' . implode(' AND ', $where);

        $countStatement = $pdo->prepare(
            "SELECT COUNT(*) FROM categories {$whereSql}"
        );
        $countStatement->execute($bind);
        $total = (int) $countStatement->fetchColumn();

        $statement = $pdo->prepare(
            "SELECT id, code, name, description, is_active, created_at, updated_at
             FROM categories {$whereSql}
             ORDER BY name ASC
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

    /** POST /api/v1/categories */
    public function store(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $code = trim((string) $request->input('code', ''));
        $name = trim((string) $request->input('name', ''));
        $description = trim((string) $request->input('description', ''));
        $isActive = $request->bool('is_active', true);

        if ($code === '') {
            Response::validationError(['code' => ['The category code is required.']], 'Validation failed');
        }
        if ($name === '') {
            Response::validationError(['name' => ['The category name is required.']], 'Validation failed');
        }

        $pdo = Database::connection();

        $existing = $pdo->prepare('SELECT id FROM categories WHERE code = :code LIMIT 1');
        $existing->execute([':code' => $code]);
        if ($existing->fetch() !== false) {
            Response::validationError(['code' => ['A category with this code already exists.']], 'Validation failed');
        }

        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare(
            'INSERT INTO categories (code, name, description, is_active, created_at, updated_at)'
            . ' VALUES (:code, :name, :description, :is_active, :created_at, :updated_at)'
        );
        $statement->execute([
            ':code' => $code,
            ':name' => $name,
            ':description' => $description === '' ? null : $description,
            ':is_active' => $isActive ? 1 : 0,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare(
            'SELECT id, code, name, description, is_active, created_at, updated_at FROM categories WHERE id = :id'
        );
        $statement->execute([':id' => $id]);

        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Category created.', 201);
    }

    /** GET /api/v1/categories/{id} */
    public function show(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Category not found');
        }

        $pdo = Database::connection();
        $statement = $pdo->prepare(
            'SELECT id, code, name, description, is_active, created_at, updated_at FROM categories WHERE id = :id LIMIT 1'
        );
        $statement->execute([':id' => $id]);
        $category = $statement->fetch(\PDO::FETCH_ASSOC);

        if ($category === false) {
            Response::notFound('Category not found');
        }

        Response::ok($category);
    }

    /** PATCH /api/v1/categories/{id} */
    public function update(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Category not found');
        }

        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM categories WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Category not found');
        }

        $code = trim((string) $request->input('code', ''));
        $name = trim((string) $request->input('name', ''));
        $description = trim((string) $request->input('description', ''));
        $isActive = $request->bool('is_active', true);

        if ($code === '') {
            Response::validationError(['code' => ['The category code is required.']], 'Validation failed');
        }
        if ($name === '') {
            Response::validationError(['name' => ['The category name is required.']], 'Validation failed');
        }

        $duplicate = $pdo->prepare('SELECT id FROM categories WHERE code = :code AND id <> :id LIMIT 1');
        $duplicate->execute([':code' => $code, ':id' => $id]);
        if ($duplicate->fetch() !== false) {
            Response::validationError(['code' => ['A category with this code already exists.']], 'Validation failed');
        }

        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare(
            'UPDATE categories SET code = :code, name = :name, description = :description,'
            . ' is_active = :is_active, updated_at = :updated_at WHERE id = :id'
        );
        $statement->execute([
            ':code' => $code,
            ':name' => $name,
            ':description' => $description === '' ? null : $description,
            ':is_active' => $isActive ? 1 : 0,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        $statement = $pdo->prepare(
            'SELECT id, code, name, description, is_active, created_at, updated_at FROM categories WHERE id = :id'
        );
        $statement->execute([':id' => $id]);

        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Category updated.');
    }

    /** DELETE /api/v1/categories/{id} */
    public function destroy(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Category not found');
        }

        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM categories WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Category not found');
        }

        $inUse = $pdo->prepare('SELECT id FROM items WHERE category_id = :id LIMIT 1');
        $inUse->execute([':id' => $id]);
        if ($inUse->fetch() !== false) {
            Response::json(null, 'Cannot deactivate: items are assigned to this category.', 409);
        }

        $pdo->prepare('UPDATE categories SET is_active = 0, updated_at = :updated_at WHERE id = :id')
            ->execute([':updated_at' => date('Y-m-d H:i:s'), ':id' => $id]);

        Response::ok(null, 'Category deactivated.');
    }
}