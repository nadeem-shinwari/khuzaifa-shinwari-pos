# Configure Local MySQL, phpMyAdmin and PHP API

## Project location

Project root:

`D:\xampp\htdocs\khuzaifa-shinwari`

Use the existing React + Vite frontend and PHP API. Do not recreate the project.

## 1. Objective

Configure the application to use:

- XAMPP Apache for serving the PHP API.
- XAMPP MySQL/MariaDB for the local database.
- phpMyAdmin for database management.
- PHP PDO with the MySQL driver.
- React + Vite for frontend development.
- Environment-based database configuration.
- A database architecture that remains compatible with MySQL hosting on InfinityFree.

The local API must connect to MySQL rather than SQLite.

## 2. Start and verify XAMPP

Verify that these XAMPP services are running:

- Apache
- MySQL

Open phpMyAdmin at:

`http://localhost/phpmyadmin/`

Check the active PHP configuration and confirm that `pdo_mysql` is enabled.

Use this command to inspect the XAMPP PHP installation:

`D:\xampp\php\php.exe -m`

If required, enable `extension=pdo_mysql` in:

`D:\xampp\php\php.ini`

Restart Apache after changing PHP configuration.

## 3. Create the local database

Create a database using phpMyAdmin with the name:

`khuzaifa_management`

Use the `utf8mb4` character set and an appropriate Unicode collation supported by the installed MySQL/MariaDB version.

Do not drop or recreate an existing database without first checking whether it contains application data.

Create a dedicated database user if practical, with permissions limited to this database. For a local-only development environment, use the appropriate local credentials configured in XAMPP.

Do not assume that a database password is set or unset; inspect the existing configuration.

## 4. Configure the PHP database connection

Inspect the existing database connection class and configuration files before editing them.

Use environment variables such as:

`DB_CONNECTION=mysql`

`DB_HOST=127.0.0.1`

`DB_PORT=3306`

`DB_DATABASE=khuzaifa_management`

`DB_USERNAME=your_local_database_user`

`DB_PASSWORD=your_local_database_password`

These are configuration examples. Replace the username and password with the actual local MySQL credentials.

Create or update `.env.example` with placeholders only. Ensure that the actual `.env` file is ignored by Git and is never exposed through the public web server.

Use PDO with a MySQL DSN similar to:

`mysql:host=127.0.0.1;port=3306;dbname=khuzaifa_management;charset=utf8mb4`

Enable PDO exception mode and use prepared statements for all variable SQL inputs.

Resolve the environment configuration consistently, regardless of the PHP working directory.

Do not put database credentials in React code or Vite environment variables.

## 5. Database schema and migrations

Inspect the current migrations, database schema and seed scripts.

Create or adapt migrations for the existing application modules, including:

- Users and authentication
- Customers
- Items and categories
- Customer ledger
- Purchases and purchase items
- Sales and sale items
- Stock movements
- Expenses
- Bank and cash accounts
- Bank transactions
- General settings
- Schema migration tracking

Only implement tables required by the current project; do not invent a second, incompatible schema.

Use MySQL-compatible data types, indexes, unique constraints and foreign keys.

Ensure migrations are safe to run more than once. Do not delete existing records or run destructive schema resets.

If the project has an existing SQLite database with useful data, inspect it and provide an explicit migration/import procedure rather than silently switching to an empty MySQL database.

Provide a documented command or setup script to initialize the MySQL schema.

## 6. Configure the API under Apache

Use the project at:

`D:\xampp\htdocs\khuzaifa-shinwari`

Inspect the existing PHP router, API entry point and Apache configuration.

Determine the correct URL for the existing PHP API. Do not assume that a URL maps directly to a physical directory.

The API must be served through Apache, not through a second PHP server on port 8000.

Preserve the existing versioned health endpoint if registered:

`/api/v1/system/health`

Verify that this URL is reachable through the actual local Apache API URL.

If the current router requires the PHP built-in server, adapt it for Apache or provide a compatible Apache entry point. Keep routing changes minimal.

Do not expose `.env`, SQL dumps, logs, source configuration, or database files through public HTTP requests.

## 7. Health endpoint

Ensure the health endpoint reports API and database status separately.

It should identify:
- API availability
- Database connection status
- Database driver
- Application version
- PHP version

Do not return passwords, database connection strings or detailed internal errors in public responses.

Use server logs to diagnose database failures.

## 8. Frontend and Vite proxy

Keep Vite as the frontend development server.

From PowerShell:

`cd D:\xampp\htdocs\khuzaifa-shinwari`

Run:

`npm install`

only if dependencies are missing.

Start the frontend:

`npm run dev`

Inspect `vite.config.js` and configure `/api` requests to reach the verified Apache API URL.

Do not hardcode port 8000 unless the project explicitly requires it.

The frontend should use relative `/api/...` paths through the Vite proxy in development and same-origin API paths in production.

## 9. Verify the complete connection

Perform the following tests:

1. MySQL starts successfully in XAMPP.
2. The database exists and is visible in phpMyAdmin.
3. PHP PDO connects successfully to MySQL.
4. The health endpoint returns valid JSON.
5. The dashboard shows API status as reachable.
6. The dashboard shows the database as online and identifies MySQL.
7. Existing login/session endpoints continue to work.
8. A test record can be created, retrieved, updated and deleted through the API using a safe test entity.
9. The record appears in phpMyAdmin.
10. Existing application data is preserved.
11. No database credentials or private files are exposed over HTTP.
12. The React production build succeeds.

If any test fails, inspect Apache and PHP error logs and fix the actual root cause.

## 10. Documentation

Update README.md with:
- XAMPP startup instructions
- phpMyAdmin URL
- Database creation instructions
- Local database credentials configuration
- Migration/import procedure
- API base URL
- Vite startup command
- Backup and restore instructions
- Troubleshooting steps
- Production MySQL deployment notes for InfinityFree

## Constraints

- Preserve all existing project files and data.
- Do not rewrite the entire application.
- Do not disable authentication or security checks.
- Do not use SQLite for the active local connection once MySQL configuration is enabled.
- Do not assume the API is working until it has been tested through Apache.
- Keep the implementation compatible with the MySQL version provided by InfinityFree.

Start by inspecting the current project and reporting the required changes. Then implement the configuration, migrations and verification steps carefully.