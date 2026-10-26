# Khuzaifa Shinwari Management Suite

## Configuration Summary

- **Database**: MySQL (configured in `.env`)
- **PHP**: XAMPP PHP 8.2 with pdo_mysql extension
- **Frontend**: React + Vite
- **API**: XAMPP Apache

## Phase 1 status

Completed: the React + Vite app shell, the static dashboard layout and the PHP API skeleton are in place.

Local development commands:

```bash
npm install
npm run dev
php -S 127.0.0.1:8000 backend/server-router.php
```

The API is available under `/api/v1` while the built-in PHP server is running. The initial contract endpoints are:

- `GET /api/v1/system/health`
- `GET /api/v1/system/info`
- `GET /api/v1/system/csrf`

## Phase 2 status

Completed: database configuration, cross-driver schema building, migration runner, authentication and the first admin user are working.

Local SQLite setup:

```bash
cp .env.example .env
php backend/src/cli/migrate.php
php backend/src/cli/create-admin.php --name="Khuzaifa Admin" --email="admin@example.com" --password="Admin1234"
```

The default local database file is `backend/storage/sqlite/app.sqlite`, and the authentication layer uses PHP session storage with password hashing and CSRF protection.

## XAMPP Setup

### Start Services
- Start Apache in XAMPP Control Panel
- Start MySQL/MariaDB in XAMPP Control Panel

### phpMyAdmin
- URL: `http://localhost/phpmyadmin/`
- Database: `khuzaifa_management` (utf8mb4_unicode_ci)
- User: root (no password for local XAMPP)

## Environment Configuration

Update `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=khuzaifa_management
DB_USERNAME=root
DB_PASSWORD=
DB_CHARSET=utf8mb4
```

## Database Schema

14 tables created via migrations:
- users, categories, customers, items, item_units
- purchases, purchase_items, sales, sale_items
- stock_movements, expenses, bank_accounts, bank_transactions
- settings

## API Base URL
- Development (through Vite): `http://localhost:5173/api/v1/...` (proxied to Apache)
- Direct (Apache): `http://localhost/khuzaifa-shinwari/api/v1/...`
- Vite proxy: `/api` → `http://127.0.0.1/khuzaifa-shinwari`

## Health Endpoint
`GET /api/v1/system/health` returns JSON with API and database status.

## Frontend
- `npm run dev` starts Vite on port 5173
- Vite proxies `/api` requests to the XAMPP Apache project URL
- `npm run build` builds the static frontend into `dist/`

## Verification commands
```bash
# PHP lint
D:\xampp\php\php.exe -l backend/src/Core/Request.php

# API contract check (against Apache)
$env:API_BASE='http://127.0.0.1/khuzaifa-shinwari/api/v1'; node scripts/api-contract-check.mjs

# Client check (built-in server, root layout)
$env:API_ORIGIN='http://127.0.0.1:8000'; node scripts/client-check.mjs

# Render check
npm run check:render

# CSS coverage check
npm run build; npm run check:css
```

## Troubleshooting
- If `/api/v1/system/health` returns 404, confirm Apache mod_rewrite is enabled and `.htaccess` is readable (`AllowOverride All`).
- If the database is unreachable, verify MySQL is running and `.env` has `DB_CONNECTION=mysql`.
- Never expose `.env`, `backend/src`, `backend/storage` or `backend/migrations` over HTTP (blocked by `.htaccess`).
