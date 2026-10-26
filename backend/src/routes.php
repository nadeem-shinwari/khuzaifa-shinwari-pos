<?php
declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\CategoriesController;
use App\Controllers\CustomersController;
use App\Controllers\SuppliersController;
use App\Controllers\ItemsController;
use App\Controllers\ResourceController;
use App\Controllers\SystemController;
use App\Controllers\InvoicePrintController;
use App\Core\Router;

return static function (Router $router): void {
    $system = new SystemController();
    $auth = new AuthController();
    $categories = new CategoriesController();
    $customers = new CustomersController();
    $suppliers = new SuppliersController();
    $items = new ItemsController();

    $expenses = new ResourceController('expenses');
    $bankAccounts = new ResourceController('bank_accounts');
    $bankTransactions = new ResourceController('bank_transactions');
    $settings = new ResourceController('settings');
    $purchases = new ResourceController('purchases');
    $sales = new ResourceController('sales');
    $stockMovements = new ResourceController('stock_movements');

    // System / infrastructure
    $router->get("v1/system/health", [$system, "health"]);
    $router->get("v1/system/info", [$system, "info"]);
    $router->get("v1/system/csrf", [$system, "csrf"]);

    // Authentication
    $router->post("v1/auth/login", [$auth, "login"]);
    $router->post("v1/auth/logout", [$auth, "logout"]);
    $router->get("v1/auth/me", [$auth, "me"]);
    $router->post("v1/auth/change-password", [$auth, "changePassword"]);

    // Categories
    $router->get("v1/categories", [$categories, "index"]);
    $router->post("v1/categories", [$categories, "store"]);
    $router->get("v1/categories/{id}", [$categories, "show"]);
    $router->patch("v1/categories/{id}", [$categories, "update"]);
    $router->delete("v1/categories/{id}", [$categories, "destroy"]);

    // Customers
    $router->get("v1/customers", [$customers, "index"]);
    $router->post("v1/customers", [$customers, "store"]);
    $router->get("v1/customers/{id}", [$customers, "show"]);
    $router->patch("v1/customers/{id}", [$customers, "update"]);
    $router->delete("v1/customers/{id}", [$customers, "destroy"]);

    // Suppliers
    $router->get("v1/suppliers", [$suppliers, "index"]);
    $router->post("v1/suppliers", [$suppliers, "store"]);
    $router->get("v1/suppliers/{id}", [$suppliers, "show"]);
    $router->patch("v1/suppliers/{id}", [$suppliers, "update"]);
    $router->delete("v1/suppliers/{id}", [$suppliers, "destroy"]);

    // Items
    $router->get("v1/items", [$items, "index"]);
    $router->post("v1/items", [$items, "store"]);
    $router->get("v1/items/{id}", [$items, "show"]);
    $router->patch("v1/items/{id}", [$items, "update"]);
    $router->delete("v1/items/{id}", [$items, "destroy"]);

    // Expenses
    $router->get("v1/expenses", [$expenses, "index"]);
    $router->post("v1/expenses", [$expenses, "store"]);
    $router->get("v1/expenses/{id}", [$expenses, "show"]);
    $router->patch("v1/expenses/{id}", [$expenses, "update"]);
    $router->delete("v1/expenses/{id}", [$expenses, "destroy"]);

    // Bank accounts
    $router->get("v1/bank-accounts", [$bankAccounts, "index"]);
    $router->post("v1/bank-accounts", [$bankAccounts, "store"]);
    $router->get("v1/bank-accounts/{id}", [$bankAccounts, "show"]);
    $router->patch("v1/bank-accounts/{id}", [$bankAccounts, "update"]);
    $router->delete("v1/bank-accounts/{id}", [$bankAccounts, "destroy"]);

    // Bank transactions
    $router->get("v1/bank-transactions", [$bankTransactions, "index"]);
    $router->post("v1/bank-transactions", [$bankTransactions, "store"]);
    $router->get("v1/bank-transactions/{id}", [$bankTransactions, "show"]);
    $router->patch("v1/bank-transactions/{id}", [$bankTransactions, "update"]);
    $router->delete("v1/bank-transactions/{id}", [$bankTransactions, "destroy"]);

    // Settings
    $router->get("v1/settings", [$settings, "index"]);
    $router->post("v1/settings", [$settings, "store"]);
    $router->get("v1/settings/{id}", [$settings, "show"]);
    $router->patch("v1/settings/{id}", [$settings, "update"]);
    $router->delete("v1/settings/{id}", [$settings, "destroy"]);

    // Purchases
    $router->get("v1/purchases", [$purchases, "index"]);
    $router->post("v1/purchases", [$purchases, "store"]);
    $router->get("v1/purchases/{id}", [$purchases, "show"]);
    $router->patch("v1/purchases/{id}", [$purchases, "update"]);
    $router->delete("v1/purchases/{id}", [$purchases, "destroy"]);

    // Sales
    $router->get("v1/sales", [$sales, "index"]);
    $router->post("v1/sales", [$sales, "store"]);
    $router->get("v1/sales/{id}", [$sales, "show"]);
    $router->patch("v1/sales/{id}", [$sales, "update"]);

    // Invoice print (read-only, authenticated)
    $invoicePrint = new InvoicePrintController();
    $router->get("v1/sales/{id}/print", [$invoicePrint, "showSale"]);
    $router->get("v1/purchases/{id}/print", [$invoicePrint, "showPurchase"]);
    $router->delete("v1/sales/{id}", [$sales, "destroy"]);

    // Stock movements (ledger)
    $router->get("v1/stock-movements", [$stockMovements, "index"]);
    $router->post("v1/stock-movements", [$stockMovements, "store"]);
    $router->get("v1/stock-movements/{id}", [$stockMovements, "show"]);
    $router->patch("v1/stock-movements/{id}", [$stockMovements, "update"]);
    $router->delete("v1/stock-movements/{id}", [$stockMovements, "destroy"]);
};
