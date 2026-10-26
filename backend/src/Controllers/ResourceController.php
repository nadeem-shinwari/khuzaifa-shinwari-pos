<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class ResourceController
{
    private array $config;

    public function __construct(string $resource)
    {
        $definitions = self::definitions();
        if (!isset($definitions[$resource])) {
            throw new \RuntimeException("Unknown resource: {$resource}");
        }
        $this->config = $definitions[$resource];
        $this->config['resource'] = $resource;
    }

    public static function definitions(): array
    {
        return [
            'expenses' => [
                'table' => 'expenses',
                'columns' => ['expense_date', 'category', 'description', 'amount', 'payment_method', 'reference', 'notes'],
                'types' => ['expense_date' => 'string', 'category' => 'string', 'description' => 'string', 'amount' => 'float', 'payment_method' => 'string', 'reference' => 'string', 'notes' => 'string'],
                'required' => ['expense_date', 'category', 'description', 'amount'],
                'unique' => null,
                'search' => ['description', 'category', 'reference'],
                'filters' => ['category'],
                'order' => 'expense_date DESC, id DESC',
                'softDelete' => false,
                'timestamps' => ['created_at'],
            ],
            'bank_accounts' => [
                'table' => 'bank_accounts',
                'columns' => ['code', 'name', 'account_type', 'bank_name', 'account_number', 'currency', 'balance', 'is_active', 'notes'],
                'types' => ['code' => 'string', 'name' => 'string', 'account_type' => 'string', 'bank_name' => 'string', 'account_number' => 'string', 'currency' => 'string', 'balance' => 'float', 'is_active' => 'bool', 'notes' => 'string'],
                'required' => ['code', 'name', 'account_type'],
                'unique' => 'code',
                'search' => ['name', 'code', 'bank_name'],
                'filters' => ['account_type'],
                'order' => 'name ASC',
                'softDelete' => true,
                'timestamps' => ['created_at', 'updated_at'],
            ],
            'bank_transactions' => [
                'table' => 'bank_transactions',
                'columns' => ['bank_account_id', 'transaction_date', 'transaction_type', 'description', 'amount', 'currency', 'reference', 'counterparty', 'notes'],
                'types' => ['bank_account_id' => 'int', 'transaction_date' => 'string', 'transaction_type' => 'string', 'description' => 'string', 'amount' => 'float', 'currency' => 'string', 'reference' => 'string', 'counterparty' => 'string', 'notes' => 'string'],
                'required' => ['bank_account_id', 'transaction_date', 'transaction_type', 'description', 'amount'],
                'unique' => null,
                'search' => ['description', 'reference', 'counterparty'],
                'filters' => ['bank_account_id', 'transaction_type'],
                'order' => 'transaction_date DESC, id DESC',
                'softDelete' => false,
                'timestamps' => ['created_at'],
            ],
            'settings' => [
                'table' => 'settings',
                'columns' => ['setting_key', 'setting_value', 'setting_group'],
                'types' => ['setting_key' => 'string', 'setting_value' => 'string', 'setting_group' => 'string'],
                'required' => ['setting_key', 'setting_group'],
                'unique' => 'setting_key',
                'search' => ['setting_key', 'setting_group'],
                'filters' => ['setting_group'],
                'order' => 'setting_group ASC, setting_key ASC',
                'softDelete' => false,
                'timestamps' => ['updated_at'],
            ],
            'purchases' => [
                'table' => 'purchases',
                'columns' => ['purchase_date', 'supplier_code', 'supplier_name', 'items', 'total_amount', 'payment_method', 'reference', 'notes'],
                'types' => ['purchase_date' => 'string', 'supplier_code' => 'string', 'supplier_name' => 'string', 'items' => 'json', 'total_amount' => 'float', 'payment_method' => 'string', 'reference' => 'string', 'notes' => 'string'],
                'required' => ['purchase_date', 'supplier_code', 'supplier_name', 'total_amount'],
                'unique' => null,
                'search' => ['supplier_name', 'supplier_code', 'reference'],
                'filters' => ['supplier_code'],
                'order' => 'purchase_date DESC, id DESC',
                'softDelete' => false,
                'timestamps' => ['created_at', 'updated_at'],
            ],
            'sales' => [
                'table' => 'sales',
                'columns' => ['sale_date', 'customer_code', 'customer_name', 'items', 'total_amount', 'payment_method', 'reference', 'notes'],
                'types' => ['sale_date' => 'string', 'customer_code' => 'string', 'customer_name' => 'string', 'items' => 'json', 'total_amount' => 'float', 'payment_method' => 'string', 'reference' => 'string', 'notes' => 'string'],
                'required' => ['sale_date', 'customer_code', 'customer_name', 'total_amount'],
                'unique' => null,
                'search' => ['customer_name', 'customer_code', 'reference'],
                'filters' => ['customer_code'],
                'order' => 'sale_date DESC, id DESC',
                'softDelete' => false,
                'timestamps' => ['created_at', 'updated_at'],
            ],
            'stock_movements' => [
                'table' => 'stock_movements',
                'columns' => ['item_id', 'movement_type', 'reference_type', 'reference_id', 'from_location', 'to_location', 'quantity_change', 'quantity_before', 'quantity_after', 'notes'],
                'types' => ['item_id' => 'int', 'movement_type' => 'string', 'reference_type' => 'string', 'reference_id' => 'int', 'from_location' => 'string', 'to_location' => 'string', 'quantity_change' => 'int', 'quantity_before' => 'float', 'quantity_after' => 'float', 'notes' => 'string'],
                'required' => ['movement_type', 'quantity_change', 'quantity_before', 'quantity_after'],
                'unique' => null,
                'search' => ['movement_type', 'reference_type', 'from_location', 'to_location'],
                'filters' => ['movement_type', 'item_id'],
                'order' => 'created_at DESC, id DESC',
                'softDelete' => false,
                'timestamps' => ['created_at'],
            ],
        ];
    }

    private function table(): string { return $this->config['table']; }
    private function columns(): array { return $this->config['columns']; }
    private function types(): array { return $this->config['types']; }

    private function value(Request $request, string $column)
    {
        $type = $this->types()[$column] ?? 'string';
        if ($type === 'int') return $request->int($column, 0);
        if ($type === 'float') return $request->float($column, 0.0);
        if ($type === 'bool') return $request->bool($column, false);
        if ($type === 'json') return $request->array($column);
        return trim((string) $request->input($column, ''));
    }

    private function bindValue(\PDOStatement $statement, string $placeholder, string $column, $value): void
    {
        $type = $this->types()[$column] ?? 'string';
        if (in_array($type, ['int'], true)) {
            $statement->bindValue($placeholder, (int) $value, \PDO::PARAM_INT);
        } elseif ($type === 'float') {
            $statement->bindValue($placeholder, (float) $value);
        } elseif ($type === 'bool') {
            $statement->bindValue($placeholder, $value ? 1 : 0, \PDO::PARAM_INT);
        } else {
            $statement->bindValue($placeholder, $value === '' ? null : $value);
        }
    }

    private function normalizeForStorage(string $column, $value)
    {
        $type = $this->types()[$column] ?? 'string';
        if ($type === 'json') {
            if (!is_array($value) || $value === []) {
                return null;
            }
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        }
        if ($type === 'string') {
            return $value === '' ? null : $value;
        }
        return $value;
    }

    public function index(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $pdo = Database::connection();
        $page = $request->pagination();
        $search = trim((string) $request->input('search', ''));

        $where = [];
        $bind = [];

        foreach ($this->config['filters'] as $filter) {
            $value = $request->input($filter, null);
            if ($value !== null && $value !== '') {
                $where[] = "{$filter} = :{$filter}";
                $bind[":{$filter}"] = $value;
            }
        }

        if ($search !== '') {
            $clauses = [];
            foreach ($this->config['search'] as $field) {
                $clauses[] = "{$field} LIKE :search";
            }
            if ($clauses !== []) {
                $where[] = '(' . implode(' OR ', $clauses) . ')';
                $bind[':search'] = '%' . $search . '%';
            }
        }

        $whereSql = $where === [] ? '' : 'WHERE ' . implode(' AND ', $where);
        $table = $this->table();

        $countStatement = $pdo->prepare("SELECT COUNT(*) FROM {$table} {$whereSql}");
        $countStatement->execute($bind);
        $total = (int) $countStatement->fetchColumn();

        $statement = $pdo->prepare(
            "SELECT * FROM {$table} {$whereSql} ORDER BY {$this->config['order']} LIMIT :limit OFFSET :offset"
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

    public function show(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Record not found');
            return;
        }

        $pdo = Database::connection();
        $table = $this->table();
        $statement = $pdo->prepare("SELECT * FROM {$table} WHERE id = :id LIMIT 1");
        $statement->execute([':id' => $id]);
        $record = $statement->fetch(\PDO::FETCH_ASSOC);

        if ($record === false) {
            Response::notFound('Record not found');
            return;
        }

        Response::ok($record);
    }

    public function store(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $errors = [];
        $values = [];

        foreach ($this->columns() as $column) {
            $value = $this->value($request, $column);
            if (in_array($column, $this->config['required'], true)) {
                if ($value === '' || $value === null) {
                    $errors[$column] = ["The {$column} field is required."];
                }
            }
            $values[$column] = $value;
        }

        if ($errors !== []) {
            Response::validationError($errors, 'Validation failed');
            return;
        }

        $pdo = Database::connection();
        $table = $this->table();

        if ($this->config['unique'] !== null) {
            $uniqueColumn = $this->config['unique'];
            $statement = $pdo->prepare("SELECT id FROM {$table} WHERE {$uniqueColumn} = :value LIMIT 1");
            $statement->execute([':value' => $values[$uniqueColumn]]);
            if ($statement->fetch() !== false) {
                Response::validationError([$uniqueColumn => ["A record with this {$uniqueColumn} already exists."]], 'Validation failed');
                return;
            }
        }

        $insertColumns = $this->columns();
        $timestampColumns = [];
        foreach ($this->config['timestamps'] as $timestampColumn) {
            if (in_array($timestampColumn, ['created_at', 'updated_at'], true)) {
                $timestampColumns[$timestampColumn] = date('Y-m-d H:i:s');
            }
        }

        $allColumns = array_merge($insertColumns, array_keys($timestampColumns));
        $placeholders = [];
        foreach ($allColumns as $column) {
            $placeholders[] = ":{$column}";
        }

        $sql = "INSERT INTO {$table} (" . implode(', ', $allColumns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $statement = $pdo->prepare($sql);

        foreach ($insertColumns as $column) {
            $this->bindValue($statement, ":{$column}", $column, $this->normalizeForStorage($column, $values[$column]));
        }
        foreach ($timestampColumns as $column => $value) {
            $statement->bindValue(":{$column}", $value);
        }
        $statement->execute();

        $id = (int) $pdo->lastInsertId();
        $fetch = $pdo->prepare("SELECT * FROM {$table} WHERE id = :id");
        $fetch->execute([':id' => $id]);

        Response::ok($fetch->fetch(\PDO::FETCH_ASSOC), 'Record created.');
    }

    public function update(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Record not found');
            return;
        }

        $pdo = Database::connection();
        $table = $this->table();
        $existing = $pdo->prepare("SELECT id FROM {$table} WHERE id = :id LIMIT 1");
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Record not found');
            return;
        }

        $errors = [];
        $values = [];
        foreach ($this->columns() as $column) {
            $value = $this->value($request, $column);
            if (in_array($column, $this->config['required'], true)) {
                if ($value === '' || $value === null) {
                    $errors[$column] = ["The {$column} field is required."];
                }
            }
            $values[$column] = $value;
        }

        if ($errors !== []) {
            Response::validationError($errors, 'Validation failed');
            return;
        }

        if ($this->config['unique'] !== null) {
            $uniqueColumn = $this->config['unique'];
            $statement = $pdo->prepare("SELECT id FROM {$table} WHERE {$uniqueColumn} = :value AND id <> :id LIMIT 1");
            $statement->execute([':value' => $values[$uniqueColumn], ':id' => $id]);
            if ($statement->fetch() !== false) {
                Response::validationError([$uniqueColumn => ["A record with this {$uniqueColumn} already exists."]], 'Validation failed');
                return;
            }
        }

        $setClauses = [];
        foreach ($this->columns() as $column) {
            $setClauses[] = "{$column} = :{$column}";
        }
        if (in_array('updated_at', $this->config['timestamps'], true)) {
            $setClauses[] = 'updated_at = :updated_at';
        }

        $sql = "UPDATE {$table} SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $statement = $pdo->prepare($sql);
        foreach ($this->columns() as $column) {
            $this->bindValue($statement, ":{$column}", $column, $this->normalizeForStorage($column, $values[$column]));
        }
        if (in_array('updated_at', $this->config['timestamps'], true)) {
            $statement->bindValue(':updated_at', date('Y-m-d H:i:s'));
        }
        $statement->bindValue(':id', $id, \PDO::PARAM_INT);
        $statement->execute();

        $fetch = $pdo->prepare("SELECT * FROM {$table} WHERE id = :id");
        $fetch->execute([':id' => $id]);

        Response::ok($fetch->fetch(\PDO::FETCH_ASSOC), 'Record updated.');
    }

    public function destroy(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Record not found');
            return;
        }

        $pdo = Database::connection();
        $table = $this->table();
        $existing = $pdo->prepare("SELECT id FROM {$table} WHERE id = :id LIMIT 1");
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Record not found');
            return;
        }

        if ($this->config['softDelete']) {
            $statement = $pdo->prepare("UPDATE {$table} SET is_active = 0, updated_at = :updated_at WHERE id = :id");
            $statement->execute([':updated_at' => date('Y-m-d H:i:s'), ':id' => $id]);
            Response::ok(null, 'Record deactivated.');
            return;
        }

        $pdo->prepare("DELETE FROM {$table} WHERE id = :id")->execute([':id' => $id]);
        Response::ok(null, 'Record deleted.');
    }
}
