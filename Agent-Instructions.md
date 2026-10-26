<<<<<<< HEAD
`khuzaifa-shinwari/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── features/
│   │   ├── customers/
│   │   ├── items/
│   │   ├── ledger/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── expenses/
│   │   ├── banks/
│   │   └── settings/
│   ├── services/
│   └── utils/
├── backend/
│   ├── api/
│   ├── src/
│   ├── migrations/
│   ├── config/
│   └── tests/
├── database/
│   └── seeds/
├── public/
├── .env.example
├── vite.config.js
├── package.json
└── README.md


# Agent Instructions — Khuzaifa Shinwari Management App

## 1. Project objective

Build a simple, responsive office management application for **Khuzaifa Shinwari** using:

- Frontend: JavaScript, React, Vite
- UI: Tailwind CSS and reusable React components
- Routing: React Router with HashRouter for static hosting compatibility
- Forms: React Hook Form and Zod
- Icons: Lucide React
- Backend: PHP 8.x JSON API
- Local database: SQLite using PDO
- Production database: MySQL using PDO
- Hosting: InfinityFree shared PHP/MySQL hosting

The frontend must compile to static files. Do not require Node.js on the production server.

The application must work locally on Windows with SQLite and on InfinityFree with MySQL. Keep database access and business rules in the PHP backend, not in React.

## 2. Development principles

1. Inspect the existing project before creating or replacing files.
2. Use plain JavaScript and JSX, not TypeScript.
3. Create reusable form, table, modal, pagination, search, validation, loading and error components.
4. Keep modules separate and business logic organized.
5. Use prepared SQL statements, input validation, password hashing, session authentication and authorization.
6. Never expose database credentials, passwords, PHP source configuration or private database files to the browser.
7. Never put SQL queries or database credentials in frontend JavaScript.
8. Do not use localStorage as the main database.
9. Do not use mock data as a substitute for real database operations.
10. Do not leave unfinished buttons, fake save operations or nonfunctional navigation.
11. Implement and test one complete vertical feature at a time.
12. Keep the code lightweight and suitable for a Windows PC with 8 GB RAM.
13. Do not introduce Laravel, Next.js, Prisma, Node.js backend services or unnecessary dependencies.
14. Use comments and a README to explain setup, migrations, configuration and deployment.

## 3. Required modules

### A. Customers

Create customer create, list, view, edit and deactivate functions.

Fields:
- Customer code (unique)
- Customer name
- Phone and optional alternate phone
- Address
- Opening balance
- Opening balance type: receivable or payable
- Notes
- Active/inactive status
- Created and updated timestamps

Provide search by customer code, name and phone. Provide pagination and validation.

Prevent accidental deletion of customers with financial transactions.

### B. Items

Create item create, list, view, edit and deactivate functions.

Fields:
- Item code (unique)
- Item name
- Category
- Unit of measurement
- Purchase price
- Sale price
- Opening stock quantity
- Reorder level
- Optional barcode
- Description
- Active/inactive status

Support units such as piece, dozen, packet, box and carton. Store quantities and conversion rules consistently. Do not assume every packet or box contains the same number of pieces.

Provide search by item code, barcode, name and category. Show available stock, purchase price and sale price.

Prevent negative stock unless explicitly enabled in settings.

### C. Customers Ledger

Create a customer-wise ledger page.

Display:
- Date
- Reference number
- Transaction type
- Description
- Debit
- Credit
- Running balance

Include opening balances, credit sales, customer receipts and authorized adjustments.

Use a consistent convention: debit increases the customer's receivable balance and credit reduces it. Handle payable opening balances correctly.

Support customer selection, date range, opening balance, running balance, closing balance and print.

Ledger entries must come from actual saved transactions. Do not calculate a separate, manually editable ledger balance.

### D. Items Purchase

Create purchase entry and purchase listing pages.

Purchase header:
- Purchase number (unique, generated server-side)
- Date
- Optional supplier name/reference
- Invoice/reference number
- Notes
- Subtotal
- Discount
- Additional charges
- Grand total
- Payment status and amount paid

Purchase lines:
- Item
- Unit
- Quantity
- Unit cost
- Line discount
- Line total

Allow adding, editing and removing lines before posting. Calculate totals on the server and validate them again when saving.

A posted purchase must update stock and create the appropriate bank/cash or payable transactions.

Prevent duplicate posting. Editing, cancelling or reversing a posted purchase must reverse the original stock and financial effects safely.

### E. Items Sale

Create sale entry, sale listing, sale details and print views.

Sale header:
- Sale number (unique, generated server-side)
- Date
- Customer
- Notes
- Subtotal
- Discount
- Additional charges
- Grand total
- Amount received
- Remaining balance
- Payment status

Sale lines:
- Item
- Unit
- Quantity
- Unit sale price
- Line discount
- Line total

Support cash sales and customer credit sales. Use server-side calculations, validation and database transactions.

On posting a sale:
- Reduce stock.
- Record the customer receivable where applicable.
- Record cash/bank receipts when payment is received.
- Preserve the sale and line-item history.

### F. Expenses

Fields:
- Expense number
- Date
- Expense category
- Description
- Amount
- Payment method
- Bank/cash account
- Optional reference
- Notes

Provide create, list, edit draft, view, search, date filtering and print.

Posted expenses must generate corresponding bank/cash withdrawals. Do not allow deleting a posted expense without reversing its financial effect.

### G. Banks and Cash Accounts

Create a page for bank and cash accounts.

Fields:
- Account name
- Account type: cash or bank
- Bank name, if applicable
- Account reference, optional
- Opening balance
- Active/inactive status

Display account ledger entries, deposits, withdrawals, transfers and current balance.

Allow transfers between accounts. Each transfer must create matching debit and credit entries in one database transaction.

Do not allow ordinary users to directly edit a calculated account balance after transactions exist.

### H. General Settings

Provide a settings page for:
- Business name: Khuzaifa Shinwari
- Business address and contact details
- Default currency: PKR
- Date format
- Invoice title and footer
- Default sale and purchase units
- Stock negative-quantity policy
- Default pagination size

Store settings in the database. Only authorized administrators can change them.

### I. Sale Items Print

Create a print-friendly sale invoice/item list.

Include:
- Business name and contact information
- Sale number and date
- Customer details
- Item name/code
- Unit and quantity
- Unit rate
- Discount
- Line total
- Subtotal, additional charges and grand total
- Amount received and remaining balance, where applicable

Provide a Print button using `window.print()` and dedicated print CSS.

Hide navigation, buttons, modal controls and other application UI when printing. Ensure the item table and totals are legible on paper. Support A4 and a compact receipt layout.

Printing must use saved sale data, not unsaved form values.

## 4. Database architecture

Create versioned database migrations and seed scripts.

Use PDO with a shared database connection factory and environment-specific configuration.

Required database tables should include:
- users
- customers
- categories
- items
- item_units or equivalent unit conversion records
- purchases
- purchase_items
- sales
- sale_items
- stock_movements
- customer_ledger_entries
- bank_accounts
- bank_transactions
- expense_categories
- expenses
- settings
- schema_migrations

Add any necessary payment, receipt, adjustment or audit tables. Use foreign keys, indexes, unique constraints and appropriate decimal precision.

Use compatible SQL and explicit database types so migrations can run on both SQLite and MySQL. Handle auto-increment keys, dates, decimal values, indexes and foreign-key behavior appropriately for each database.

Avoid relying on SQLite-only SQL in shared application logic.

The database layer must support:
- `DB_CONNECTION=sqlite` locally.
- `DB_CONNECTION=mysql` in production.

For SQLite, use a configurable database file outside the publicly accessible web root. Create its directory and initialize schema migrations automatically through a development/setup command.

For MySQL, read credentials from protected server-side configuration. Never include production credentials in Vite environment variables or generated frontend assets.

Provide a database migration command or documented PHP CLI script that can initialize either database safely.

## 5. PHP API

Create a versioned JSON API under `/api`.

Provide endpoints for:
- Authentication and session
- Customers CRUD and listing
- Items and categories CRUD and listing
- Customer ledger
- Purchases and purchase details
- Sales and sale details
- Expenses
- Bank accounts and transactions
- Settings
- Sale invoice/print data

Use consistent JSON responses and appropriate HTTP status codes.

Implement:
- Server-side validation
- Prepared statements
- PDO exception handling
- Session authentication
- Administrator authorization
- CSRF protection for session-authenticated state-changing requests
- Secure session cookie settings
- Password hashing using PHP password functions
- Transaction-safe posting of sales and purchases
- Pagination and server-side search
- Safe error logging without exposing secrets

Never trust frontend-calculated prices, balances, totals, quantities or account IDs without validating permissions and business rules on the server.

Create a first-run setup script or documented CLI process for creating the initial administrator. Do not leave a publicly accessible setup endpoint that can create new administrators after installation.

## 6. Local and production environments

Create `.env.example` with placeholders only.

Local configuration should use SQLite and the local PHP server.

Configure Vite to proxy `/api` requests to the local PHP server during development, so React uses relative `/api/...` URLs rather than hardcoded localhost URLs.

Use separate configuration for:
- Local development
- Production hosting

The production frontend must use same-origin relative API URLs.

For InfinityFree:
- Build the frontend using `npm run build`.
- Upload the contents of the build output directory to `htdocs`.
- Upload the PHP API and required protected PHP files to the correct hosting directories.
- Keep SQLite database files, logs, secrets and configuration outside public access.
- Use the MySQL database supplied by InfinityFree.
- Do not attempt to connect to the hosting MySQL database directly from the browser or local computer.
- Document the exact deployment paths and API configuration.
- Use HTTPS and ensure the frontend and API share the intended origin.

Use HashRouter so page navigation works without requiring server rewrites for React routes.

## 7. UI and UX

Create a clean office dashboard with:
- Sidebar navigation
- Responsive header
- Dashboard summary cards
- Recent sales and purchases
- Low-stock items
- Customer receivables summary
- Consistent create/edit forms
- Searchable and paginated tables
- Confirmation before destructive actions
- Success and error messages
- Loading and empty states
- Keyboard-friendly controls

Use a consistent currency formatter for PKR and a consistent quantity formatter. Format monetary values for display without losing calculation precision.

Do not build a complicated analytics dashboard before the core forms and database operations work.

## 8. Development phases

Implement in the following order:

Phase 1: Inspect the project, confirm installed tools, set up React/Vite/Tailwind and create the PHP API skeleton.

Phase 2: Implement database configuration, SQLite/MySQL connection support, migrations, authentication and the initial administrator.

Phase 3: Implement customers, categories and items with working forms and listings.

Phase 4: Implement banks/cash accounts, bank transactions and expenses.

Phase 5: Implement purchase entry, purchase posting, stock movements and purchase listing.

Phase 6: Implement sale entry, sale posting, customer receipts and stock movements.

Phase 7: Implement customer ledger, payment reconciliation and balance validation.

Phase 8: Implement general settings and sale printing.

Phase 9: Add automated tests for database operations, transaction rollback, stock calculations, ledger balances and authorization.

Phase 10: Perform production build, verify the generated files, prepare InfinityFree deployment instructions and test the deployed APIs.

At the end of each phase:
1. Run relevant tests.
2. Run the frontend build when applicable.
3. Fix errors before proceeding.
4. Update README.md with completed features and commands.
5. Summarize changed files and any remaining limitations.

## 9. Completion criteria

The project is complete only when:
- All required pages and navigation work.
- CRUD forms save and retrieve real database records.
- Search and pagination work.
- Sales and purchases update stock correctly.
- Customer ledger balances reconcile with source transactions.
- Bank balances reconcile with bank transactions.
- Posted transactions cannot be duplicated accidentally.
- Printing produces a clean, readable document.
- SQLite works locally and MySQL works in production.
- The production frontend builds into static files.
- PHP source and secrets are not exposed publicly.
- Setup, migration, backup, restore and deployment instructions are documented.

=======
`khuzaifa-shinwari/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── features/
│   │   ├── customers/
│   │   ├── items/
│   │   ├── ledger/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── expenses/
│   │   ├── banks/
│   │   └── settings/
│   ├── services/
│   └── utils/
├── backend/
│   ├── api/
│   ├── src/
│   ├── migrations/
│   ├── config/
│   └── tests/
├── database/
│   └── seeds/
├── public/
├── .env.example
├── vite.config.js
├── package.json
└── README.md


# Agent Instructions — Khuzaifa Shinwari Management App

## 1. Project objective

Build a simple, responsive office management application for **Khuzaifa Shinwari** using:

- Frontend: JavaScript, React, Vite
- UI: Tailwind CSS and reusable React components
- Routing: React Router with HashRouter for static hosting compatibility
- Forms: React Hook Form and Zod
- Icons: Lucide React
- Backend: PHP 8.x JSON API
- Local database: SQLite using PDO
- Production database: MySQL using PDO
- Hosting: InfinityFree shared PHP/MySQL hosting

The frontend must compile to static files. Do not require Node.js on the production server.

The application must work locally on Windows with SQLite and on InfinityFree with MySQL. Keep database access and business rules in the PHP backend, not in React.

## 2. Development principles

1. Inspect the existing project before creating or replacing files.
2. Use plain JavaScript and JSX, not TypeScript.
3. Create reusable form, table, modal, pagination, search, validation, loading and error components.
4. Keep modules separate and business logic organized.
5. Use prepared SQL statements, input validation, password hashing, session authentication and authorization.
6. Never expose database credentials, passwords, PHP source configuration or private database files to the browser.
7. Never put SQL queries or database credentials in frontend JavaScript.
8. Do not use localStorage as the main database.
9. Do not use mock data as a substitute for real database operations.
10. Do not leave unfinished buttons, fake save operations or nonfunctional navigation.
11. Implement and test one complete vertical feature at a time.
12. Keep the code lightweight and suitable for a Windows PC with 8 GB RAM.
13. Do not introduce Laravel, Next.js, Prisma, Node.js backend services or unnecessary dependencies.
14. Use comments and a README to explain setup, migrations, configuration and deployment.

## 3. Required modules

### A. Customers

Create customer create, list, view, edit and deactivate functions.

Fields:
- Customer code (unique)
- Customer name
- Phone and optional alternate phone
- Address
- Opening balance
- Opening balance type: receivable or payable
- Notes
- Active/inactive status
- Created and updated timestamps

Provide search by customer code, name and phone. Provide pagination and validation.

Prevent accidental deletion of customers with financial transactions.

### B. Items

Create item create, list, view, edit and deactivate functions.

Fields:
- Item code (unique)
- Item name
- Category
- Unit of measurement
- Purchase price
- Sale price
- Opening stock quantity
- Reorder level
- Optional barcode
- Description
- Active/inactive status

Support units such as piece, dozen, packet, box and carton. Store quantities and conversion rules consistently. Do not assume every packet or box contains the same number of pieces.

Provide search by item code, barcode, name and category. Show available stock, purchase price and sale price.

Prevent negative stock unless explicitly enabled in settings.

### C. Customers Ledger

Create a customer-wise ledger page.

Display:
- Date
- Reference number
- Transaction type
- Description
- Debit
- Credit
- Running balance

Include opening balances, credit sales, customer receipts and authorized adjustments.

Use a consistent convention: debit increases the customer's receivable balance and credit reduces it. Handle payable opening balances correctly.

Support customer selection, date range, opening balance, running balance, closing balance and print.

Ledger entries must come from actual saved transactions. Do not calculate a separate, manually editable ledger balance.

### D. Items Purchase

Create purchase entry and purchase listing pages.

Purchase header:
- Purchase number (unique, generated server-side)
- Date
- Optional supplier name/reference
- Invoice/reference number
- Notes
- Subtotal
- Discount
- Additional charges
- Grand total
- Payment status and amount paid

Purchase lines:
- Item
- Unit
- Quantity
- Unit cost
- Line discount
- Line total

Allow adding, editing and removing lines before posting. Calculate totals on the server and validate them again when saving.

A posted purchase must update stock and create the appropriate bank/cash or payable transactions.

Prevent duplicate posting. Editing, cancelling or reversing a posted purchase must reverse the original stock and financial effects safely.

### E. Items Sale

Create sale entry, sale listing, sale details and print views.

Sale header:
- Sale number (unique, generated server-side)
- Date
- Customer
- Notes
- Subtotal
- Discount
- Additional charges
- Grand total
- Amount received
- Remaining balance
- Payment status

Sale lines:
- Item
- Unit
- Quantity
- Unit sale price
- Line discount
- Line total

Support cash sales and customer credit sales. Use server-side calculations, validation and database transactions.

On posting a sale:
- Reduce stock.
- Record the customer receivable where applicable.
- Record cash/bank receipts when payment is received.
- Preserve the sale and line-item history.

### F. Expenses

Fields:
- Expense number
- Date
- Expense category
- Description
- Amount
- Payment method
- Bank/cash account
- Optional reference
- Notes

Provide create, list, edit draft, view, search, date filtering and print.

Posted expenses must generate corresponding bank/cash withdrawals. Do not allow deleting a posted expense without reversing its financial effect.

### G. Banks and Cash Accounts

Create a page for bank and cash accounts.

Fields:
- Account name
- Account type: cash or bank
- Bank name, if applicable
- Account reference, optional
- Opening balance
- Active/inactive status

Display account ledger entries, deposits, withdrawals, transfers and current balance.

Allow transfers between accounts. Each transfer must create matching debit and credit entries in one database transaction.

Do not allow ordinary users to directly edit a calculated account balance after transactions exist.

### H. General Settings

Provide a settings page for:
- Business name: Khuzaifa Shinwari
- Business address and contact details
- Default currency: PKR
- Date format
- Invoice title and footer
- Default sale and purchase units
- Stock negative-quantity policy
- Default pagination size

Store settings in the database. Only authorized administrators can change them.

### I. Sale Items Print

Create a print-friendly sale invoice/item list.

Include:
- Business name and contact information
- Sale number and date
- Customer details
- Item name/code
- Unit and quantity
- Unit rate
- Discount
- Line total
- Subtotal, additional charges and grand total
- Amount received and remaining balance, where applicable

Provide a Print button using `window.print()` and dedicated print CSS.

Hide navigation, buttons, modal controls and other application UI when printing. Ensure the item table and totals are legible on paper. Support A4 and a compact receipt layout.

Printing must use saved sale data, not unsaved form values.

## 4. Database architecture

Create versioned database migrations and seed scripts.

Use PDO with a shared database connection factory and environment-specific configuration.

Required database tables should include:
- users
- customers
- categories
- items
- item_units or equivalent unit conversion records
- purchases
- purchase_items
- sales
- sale_items
- stock_movements
- customer_ledger_entries
- bank_accounts
- bank_transactions
- expense_categories
- expenses
- settings
- schema_migrations

Add any necessary payment, receipt, adjustment or audit tables. Use foreign keys, indexes, unique constraints and appropriate decimal precision.

Use compatible SQL and explicit database types so migrations can run on both SQLite and MySQL. Handle auto-increment keys, dates, decimal values, indexes and foreign-key behavior appropriately for each database.

Avoid relying on SQLite-only SQL in shared application logic.

The database layer must support:
- `DB_CONNECTION=sqlite` locally.
- `DB_CONNECTION=mysql` in production.

For SQLite, use a configurable database file outside the publicly accessible web root. Create its directory and initialize schema migrations automatically through a development/setup command.

For MySQL, read credentials from protected server-side configuration. Never include production credentials in Vite environment variables or generated frontend assets.

Provide a database migration command or documented PHP CLI script that can initialize either database safely.

## 5. PHP API

Create a versioned JSON API under `/api`.

Provide endpoints for:
- Authentication and session
- Customers CRUD and listing
- Items and categories CRUD and listing
- Customer ledger
- Purchases and purchase details
- Sales and sale details
- Expenses
- Bank accounts and transactions
- Settings
- Sale invoice/print data

Use consistent JSON responses and appropriate HTTP status codes.

Implement:
- Server-side validation
- Prepared statements
- PDO exception handling
- Session authentication
- Administrator authorization
- CSRF protection for session-authenticated state-changing requests
- Secure session cookie settings
- Password hashing using PHP password functions
- Transaction-safe posting of sales and purchases
- Pagination and server-side search
- Safe error logging without exposing secrets

Never trust frontend-calculated prices, balances, totals, quantities or account IDs without validating permissions and business rules on the server.

Create a first-run setup script or documented CLI process for creating the initial administrator. Do not leave a publicly accessible setup endpoint that can create new administrators after installation.

## 6. Local and production environments

Create `.env.example` with placeholders only.

Local configuration should use SQLite and the local PHP server.

Configure Vite to proxy `/api` requests to the local PHP server during development, so React uses relative `/api/...` URLs rather than hardcoded localhost URLs.

Use separate configuration for:
- Local development
- Production hosting

The production frontend must use same-origin relative API URLs.

For InfinityFree:
- Build the frontend using `npm run build`.
- Upload the contents of the build output directory to `htdocs`.
- Upload the PHP API and required protected PHP files to the correct hosting directories.
- Keep SQLite database files, logs, secrets and configuration outside public access.
- Use the MySQL database supplied by InfinityFree.
- Do not attempt to connect to the hosting MySQL database directly from the browser or local computer.
- Document the exact deployment paths and API configuration.
- Use HTTPS and ensure the frontend and API share the intended origin.

Use HashRouter so page navigation works without requiring server rewrites for React routes.

## 7. UI and UX

Create a clean office dashboard with:
- Sidebar navigation
- Responsive header
- Dashboard summary cards
- Recent sales and purchases
- Low-stock items
- Customer receivables summary
- Consistent create/edit forms
- Searchable and paginated tables
- Confirmation before destructive actions
- Success and error messages
- Loading and empty states
- Keyboard-friendly controls

Use a consistent currency formatter for PKR and a consistent quantity formatter. Format monetary values for display without losing calculation precision.

Do not build a complicated analytics dashboard before the core forms and database operations work.

## 8. Development phases

Implement in the following order:

Phase 1: Inspect the project, confirm installed tools, set up React/Vite/Tailwind and create the PHP API skeleton.

Phase 2: Implement database configuration, SQLite/MySQL connection support, migrations, authentication and the initial administrator.

Phase 3: Implement customers, categories and items with working forms and listings.

Phase 4: Implement banks/cash accounts, bank transactions and expenses.

Phase 5: Implement purchase entry, purchase posting, stock movements and purchase listing.

Phase 6: Implement sale entry, sale posting, customer receipts and stock movements.

Phase 7: Implement customer ledger, payment reconciliation and balance validation.

Phase 8: Implement general settings and sale printing.

Phase 9: Add automated tests for database operations, transaction rollback, stock calculations, ledger balances and authorization.

Phase 10: Perform production build, verify the generated files, prepare InfinityFree deployment instructions and test the deployed APIs.

At the end of each phase:
1. Run relevant tests.
2. Run the frontend build when applicable.
3. Fix errors before proceeding.
4. Update README.md with completed features and commands.
5. Summarize changed files and any remaining limitations.

## 9. Completion criteria

The project is complete only when:
- All required pages and navigation work.
- CRUD forms save and retrieve real database records.
- Search and pagination work.
- Sales and purchases update stock correctly.
- Customer ledger balances reconcile with source transactions.
- Bank balances reconcile with bank transactions.
- Posted transactions cannot be duplicated accidentally.
- Printing produces a clean, readable document.
- SQLite works locally and MySQL works in production.
- The production frontend builds into static files.
- PHP source and secrets are not exposed publicly.
- Setup, migration, backup, restore and deployment instructions are documented.

>>>>>>> e9379fc5bb59ce429f96f5c3aadadcb43818b476
Start by inspecting the current repository and installed environment. Then implement Phase 1 only. Do not generate all modules in one untested step.