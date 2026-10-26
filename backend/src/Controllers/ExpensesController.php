<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class ExpensesController
{
    public function index(Request $request, array $params = []): void
    {
        Auth::requireUser();

        $pdo = Database::connection();
        $page = $request->pagination();
        $search = trim((string) $request->input('search', ''));
        $category = trim((string) $request->input('category', ''));

        $where = [];
        $bind = [];

        if ($category !== '') {
            $where[] = 'category = :category';
            $bind[':category'] = $category;
        }

        if ($search !== '') {
            $where[] = '(description LIKE :search OR category LIKE :search OR reference LIKE :search)';
            $bind[':search'] = '%' . $search . '%';
        }

        $whereSql = $where === [] ? '' : 'WHERE ' . implode(' AND ', $where);

        $countStatement = $pdo->prepare("SELECT COUNT(*) FROM expenses {$whereSql}");
        $countStatement->execute($bind);
        $total = (int) $countStatement->fetchColumn();

        $statement = $pdo->prepare(
            "SELECT id, expense_date, category, description, amount, payment_method, reference, notes, created_at
             FROM expenses {$whereSql}
             ORDER BY expense_date DESC, id DESC
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

    public function store(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $expenseDate = trim((string) $request->input('expense_date', ''));
        $category = trim((string) $request->input('category', ''));
        $description = trim((string) $request->input('description', ''));
        $amount = $request->float('amount', 0.0);
        $paymentMethod = trim((string) $request->input('payment_method', ''));
        $reference = trim((string) $request->input('reference', ''));
        $notes = trim((string) $request->input('notes', ''));

        if ($expenseDate === '') {
            Response::validationError(['expense_date' => ['The expense date is required.']], 'Validation failed');
        }
        if ($category === '') {
            Response::validationError(['category' => ['The category is required.']], 'Validation failed');
        }
        if ($description === '') {
            Response::validationError(['description' => ['The description is required.']], 'Validation failed');
        }
        if ($amount <= 0) {
            Response::validationError(['amount' => ['The amount must be greater than zero.']], 'Validation failed');
        }

        $pdo = Database::connection();
        $now = date('Y-m-d H:i:s');
        $statement = $pdo->prepare(
            'INSERT INTO expenses (expense_date, category, description, amount, payment_method, reference, notes, created_at)
             VALUES (:expense_date, :category, :description, :amount, :payment_method, :reference, :notes, :created_at)'
        );
        $statement->execute([
            ':expense_date' => $expenseDate,
            ':category' => $category,
            ':description' => $description,
            ':amount' => $amount,
            ':payment_method' => $paymentMethod === '' ? null : $paymentMethod,
            ':reference' => $reference === '' ? null : $reference,
            ':notes' => $notes === '' ? null : $notes,
            ':created_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare('SELECT id, expense_date, category, description, amount, payment_method, reference, notes, created_at FROM expenses WHERE id = :id');
        $statement->execute([':id' => $id]);

        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Expense created.');
    }

    public function update(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Expense not found');
        }

        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM expenses WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Expense not found');
        }

        $expenseDate = trim((string) $request->input('expense_date', ''));
        $category = trim((string) $request->input('category', ''));
        $description = trim((string) $request->input('description', ''));
        $amount = $request->float('amount', 0.0);
        $paymentMethod = trim((string) $request->input('payment_method', ''));
        $reference = trim((string) $request->input('reference', ''));
        $notes = trim((string) $request->input('notes', ''));

        if ($expenseDate === '') {
            Response::validationError(['expense_date' => ['The expense date is required.']], 'Validation failed');
        }
        if ($category === '') {
            Response::validationError(['category' => ['The category is required.']], 'Validation failed');
        }
        if ($description === '') {
            Response::validationError(['description' => ['The description is required.']], 'Validation failed');
        }
        if ($amount <= 0) {
            Response::validationError(['amount' => ['The amount must be greater than zero.']], 'Validation failed');
        }

        $statement = $pdo->prepare(
            'UPDATE expenses SET expense_date = :expense_date, category = :category, description = :description,
             amount = :amount, payment_method = :payment_method, reference = :reference, notes = :notes
             WHERE id = :id'
        );
        $statement->execute([
            ':expense_date' => $expenseDate,
            ':category' => $category,
            ':description' => $description,
            ':amount' => $amount,
            ':payment_method' => $paymentMethod === '' ? null : $paymentMethod,
            ':reference' => $reference === '' ? null : $reference,
            ':notes' => $notes === '' ? null : $notes,
            ':id' => $id,
        ]);

        $statement = $pdo->prepare('SELECT id, expense_date, category, description, amount, payment_method, reference, notes, created_at FROM expenses WHERE id = :id');
        $statement->execute([':id' => $id]);

        Response::ok($statement->fetch(\PDO::FETCH_ASSOC), 'Expense updated.');
    }

    public function destroy(Request $request, array $params = []): void
    {
        Auth::requireAdmin();
        Csrf::validate();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            Response::notFound('Expense not found');
        }

        $pdo = Database::connection();
        $existing = $pdo->prepare('SELECT id FROM expenses WHERE id = :id LIMIT 1');
        $existing->execute([':id' => $id]);
        if ($existing->fetch() === false) {
            Response::notFound('Expense not found');
        }

        $pdo->prepare('DELETE FROM expenses WHERE id = :id')->execute([':id' => $id]);
        Response::ok(null, 'Expense deleted.');
    }
}
