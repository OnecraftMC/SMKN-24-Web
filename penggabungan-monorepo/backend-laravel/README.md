# Laravel API pilot

This is a separate Laravel API introduced beside `../backend` for a gradual
migration. The legacy PHP backend remains active; no database migration or
production frontend cutover has been performed by this pilot.

## Prerequisites

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`,
  `fileinfo`, `curl`, and `zip` (for DOCX validation)
- Composer 2
- MySQL/MariaDB and a copy of the current `smkn24` schema

## Local setup

1. Copy `.env.example` to `.env`.
2. Set database credentials to a dedicated disposable local/staging database
   (the example name is deliberately different from the legacy `smkn24`
   default) and set `JWT_SECRET` to the same value used by `../backend/.env`.
   Point
   `PRIVATE_UPLOAD_DIR` at the existing legacy private-upload directory if
   existing archive and achievement files must remain downloadable. Keep it
   outside the document root. Do not use a production database until staging
   parity and rollback have been verified.
   Local/staging environments refuse API write requests and schema/data
   mutation commands when the configured SQL host is remote. For an intentional
   staging test or migration only, set `ALLOW_REMOTE_DB_MUTATIONS=true`
   temporarily, verify the database target, then restore it to `false`;
   production deployments use `APP_ENV=production` and Laravel's normal
   production confirmation (`--force` only for approved deployments).
   Destructive remote commands (including fresh, reset, rollback, wipe, and
   seeding) are separately blocked unless
   `ALLOW_DESTRUCTIVE_REMOTE_DB_COMMANDS=true` is explicitly enabled.
3. Install dependencies with `composer install`.
4. Generate an application key with `php artisan key:generate`.
5. Point Laravel at a dedicated local or staging MySQL database. It may be
   empty or contain the existing legacy schema; the Laravel migration creates
   missing core/feature tables, adds compatibility columns, and derives
   category options from existing content. Run migrations only against that
   isolated database with `php artisan migrate --force`. Do not import
   `../backend/database.sql` into a populated database: its optional example
   inserts add sample content. The migration does not add demo records or
   drop schema/data on rollback. Never point this step at production before
   backup and staging verification.
6. Start with `php artisan serve --port=8001`.
7. Test `GET http://127.0.0.1:8001/api/berita/index.php`.

## Migration smoke test

The schema migration can be smoke-tested without a MySQL server using an
in-memory SQLite database. Enable the PHP `pdo_sqlite`, `sqlite3`, and
`mbstring` extensions, then run:

```powershell
php -d extension=pdo_sqlite -d extension=sqlite3 -d extension=mbstring tests/migration-smoke.php
```

This checks additive upgrades, existing-row preservation, category backfill,
foreign keys, and repeatability. It does not replace applying the migration
and verifying schema parity on MySQL staging.

## Production routing

Use an API subdomain with its document root set to `backend-laravel/public`.
The included `public/.htaccess` routes API requests to Laravel's front
controller and preserves bearer authorization headers. Keep the Laravel
project root and `.env` outside the web root.

On the Next.js host configure `LARAVEL_API_URL` and `NEXT_PUBLIC_API_URL` to
the Laravel API origin. Keep `BACKEND_URL` pointed at the existing PHP site
while records still contain legacy `/backend/uploads/...` paths, and set
`NEXT_PUBLIC_ASSET_URL` to that website origin. `NEXT_PUBLIC_*` values require
a frontend rebuild. Laravel CORS must allow only the website origin.

Production traffic has not been switched by repository changes. Before
cutover, back up production DB, point Laravel at that same DB, review/apply
the additive migration, validate staging parity, uploads, AI, Midtrans sandbox,
and rollback. Do not import `../backend/database.sql` into a populated DB; it
contains demo inserts. Keep PHP backend available until Laravel rollback is
verified.

All 30 legacy API file endpoints now have Laravel compatibility routes, covering
login/session, school content, AI/chat, BK, uploads, and canteen/payment. They
retain their legacy PHP paths, response shapes, and JWT formats. Controllers
read/write the existing tables without changing their schema. AI providers,
prompts, chatbot tools, analytics classification, and news sanitization reuse
helpers from `../backend/helpers` to keep behavior aligned.

The endpoint implementation is present, but production migration is not
complete until the routes are compared against the PHP backend on a staging
database, external AI and Midtrans flows are exercised with sandbox credentials,
uploads and rollback are verified, and deployment routing is switched in a
controlled rollout.

Run the read-only GET contract comparison from this directory after both APIs
point at the same staging database and fixture:

```powershell
$env:MIGRATION_ENV = "staging"
$env:STAGING_PARITY_CONFIRM = "1"
$env:LEGACY_API_BASE = "https://staging.example/backend"
$env:LARAVEL_API_BASE = "https://laravel-staging.example"
$env:STAGING_ADMIN_TOKEN = "<staging-only-admin-jwt>"
php tests/staging-api-parity.php
```

The command compares all selected responses and never issues a write request.
Set its environment values in a local shell only; do not commit staging secrets.
Before routing production traffic, also exercise AI with staging keys, Midtrans
with sandbox credentials, private/public uploads, write/update/delete flows,
and the documented rollback. Do not direct production writes to both backends.
