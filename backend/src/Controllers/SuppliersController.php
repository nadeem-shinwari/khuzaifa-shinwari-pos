<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class SuppliersController
{
    public function index(Request $request, array $params = []): void
    {
        Auth::requireUser();
        $pdo = Database::connection();
        $page = $request->pagination();
        $search = trim((string) $request->input('search', ''));
        $onlyActive = $request->bool('active', true);
        $where = [];
        $bind = [];
        if ($onlyActive) { $where[] = 'is_active = 1'; }
        if ($search !== '') {
            $where[] = '(name LIKE :search OR code LIKE :search OR phone LIKE :search)';
            $bind[':search'] = '%' . $search . '%';
        }
        $whereSql = $where === [] ? '' : 'WHERE ' . implode(' AND ', $where);
        $countStatement = $pdo->prepare("SELECT COUNT(*) FROM suppliers {$whereSql}");
        $countStatement->execute($bind);
        $total = (int) $countStatement->fetchColumn();
        $statement = $pdo->prepare("SELECT id, code, name, phone, alternate_phone, address, opening_balance, opening_balance_type, notes, is_active, created_at, updated_at FROM suppliers {$whereSql} ORDER BY name ASC LIMIT :limit OFFSET :offset");
        foreach ($bind as $key => $value) { $statement->bindValue($key, $value); }
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

    public function store(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();
        $code = trim((string) $request->input('code', ''));
        $name = trim((string) $request->input('name', ''));
        $phone = trim((string) $request->input('phone', ''));
        $alternatePhone = trim((string) $request->input('alternate_phone', ''));
        $address = trim((string) $request->input('address', ''));
        $openingBalance = $request->float('opening_balance', 0.0);
        $openingBalanceType = trim((string) $request->input('opening_balance_type', 'payable'));
        $notes = trim((string) $request->input('notes', ''));
        $isActive = $request->bool('is_active', true);
        if ($code === '') { Response::validationError(['code' => ['The supplier code is required.']], 'Validation failed'); }
        if ($name === '') { Response::validationError(['name' => ['The supplier name is required.']], 'Validation failed'); }
        if (!in_array($openingBalanceType, ['receivable', 'payable'], true)) { Response::validationError(['opening_balance_type' => ['Must be "receivable" or "payable".']], 'Validation failed'); }
        $pdo = Database::connection();
        $duplicate = $pdo->prepare('SELECT id FROM suppliers WHERE code = :code LIMIT 1');
        $duplicate->execute([':code' => $code]);
        if ($duplicate->fetch() !== false) { Response::validationError(['code' => ['A supplier with this code already exists.']], 'Validation failed'); }
        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare('INSERT INTO suppliers (code, name, phone, alternate_phone, address, opening_balance, opening_balance_type, notes, is_active, created_at, updated_at) VALUES (:code, :name, :phone, :alternate_phone, :address, :opening_balance, :opening_balance_type, :notes, :is_active, :created_at, :updated_at)');
        $statement->execute([
            ':code' => $code, ':name' => $name,
            ':phone' => $phone === '' ? null : $phone,
            ':alternate_phone' => $alternatePhone === '' ? null : $alternatePhone,
            ':address' => $address === '' ? null : $address,
            ':opening_balance' => $openingBalance,
            ':opening_balance_type' => $openingBalanceType,
            ':notes' => $notes === '' ? null : $notes,
            ':is_active' => $isActive ? 1 : 0,
            ':created_at' => $now, ':updated_at' => $now,
        ]);
        $id = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare('SELECT id, code, name, phone, alternate_phone, address, opening_balance, opening_balance_type, notes, is_active, created_at, updated_at FROM suppliers WHERE id = :id');
        $statement->execute([':id' => $id]);
        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Supplier created.');
    }

    public function show(Request $request, array $params = []): void
    {
        Auth::requireUser();
        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) { Response::notFound('Supplier not found'); }
        $pdo = Database::connection();
        $statement = $pdo->prepare('SELECT id, code, name, phone, alternate_phone, address, opening_balance, opening_balance_type, notes, is_active, created_at, updated_at FROM suppliers WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $id]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        if ($row === false) { Response::notFound('Supplier not found'); }
        Response::ok($row);
    }

    public function update(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();
        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) { Response::notFound('Supplier not found'); }
        $code = trim((string) $request->input('code', ''));
        $name = trim((string) $request->input('name', ''));
        $phone = trim((string) $request->input('phone', ''));
        $alternatePhone = trim((string) $request->input('alternate_phone', ''));
        $address = trim((string) $request->input('address', ''));
        $openingBalance = $request->float('opening_balance', 0.0);
        $openingBalanceType = trim((string) $request->input('opening_balance_type', 'payable'));
        $notes = trim((string) $request->input('notes', ''));
        $isActive = $request->bool('is_active', true);
        if ($code === '') { Response::validationError(['code' => ['The supplier code is required.']], 'Validation failed'); }
        if ($name === '') { Response::validationError(['name' => ['The supplier name is required.']], 'Validation failed'); }
        if (!in_array($openingBalanceType, ['receivable', 'payable'], true)) { Response::validationError(['opening_balance_type' => ['Must be "receivable" or "payable".']], 'Validation failed'); }
        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM suppliers WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) { Response::notFound('Supplier not found'); }
        $duplicate = $pdo->prepare('SELECT id FROM suppliers WHERE code = :code AND id <> :id LIMIT 1');
        $duplicate->execute([':code' => $code, ':id' => $id]);
        if ($duplicate->fetch() !== false) { Response::validationError(['code' => ['A supplier with this code already exists.']], 'Validation failed'); }
        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare('UPDATE suppliers SET code = :code, name = :name, phone = :phone, alternate_phone = :alternate_phone, address = :address, opening_balance = :opening_balance, opening_balance_type = :opening_balance_type, notes = :notes, is_active = :is_active, updated_at = :updated_at WHERE id = :id');
        $statement->execute([
            ':code' => $code, ':name' => $name,
            ':phone' => $phone === '' ? null : $phone,
            ':alternate_phone' => $alternatePhone === '' ? null : $alternatePhone,
            ':address' => $address === '' ? null : $address,
            ':opening_balance' => $openingBalance,
            ':opening_balance_type' => $openingBalanceType,
            ':notes' => $notes === '' ? null : $notes,
            ':is_active' => $isActive ? 1 : 0,
            ':updated_at' => $now, ':id' => $id,
        ]);
        $statement = $pdo->prepare('SELECT id, code, name, phone, alternate_phone, address, opening_balance, opening_balance_type, notes, is_active, created_at, updated_at FROM suppliers WHERE id = :id');
        $statement->execute([':id' => $id]);
        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Supplier updated.');
    }

    public function destroy(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();
        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) { Response::notFound('Supplier not found'); }
        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM suppliers WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) { Response::notFound('Supplier not found'); }
        $pdo->prepare('UPDATE suppliers SET is_active = 0, updated_at = :updated_at WHERE id = :id')
            ->execute([':updated_at' => date('Y-m-d H:i:s'), ':id' => $id]);
        Response::ok(null, 'Supplier deactivated.');
    }
}
