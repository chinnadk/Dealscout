# DealScout

A React + Node.js deals website, with PostgreSQL/Neon or local SQLite, daily price history, search, filters, saved deals, a history chart, and outbound click counts. A separate adapter deploys the same API and React interface to Sites using Cloudflare D1.

## Run with Node.js

Requires Node.js 22.13+ (Node 24 recommended). SQLite is built in; no separate database service is required.

```powershell
cd F:\MathDesk\dealscout
npm.cmd install
npm.cmd run build:node
npm.cmd run start:node
```

Open http://127.0.0.1:3000. Without `DATABASE_URL`, the server applies SQLite schema migrations on startup and stores records in `data/dealscout.sqlite`. Override `PORT`, `HOST`, or `DATABASE_PATH` with environment variables. Bind to a public interface only behind your chosen HTTPS proxy. Rebuild the frontend after editing it. Tests: `npm.cmd test`. Type check: `node node_modules/typescript/bin/tsc --noEmit`.

## Render Free with Neon PostgreSQL

1. In the Neon project, click **Connect**. Select the correct branch/database and enable **Connection pooling**. Copy the raw PostgreSQL connection string, not the surrounding `psql` command. Keep its TLS parameters.
2. In Render, open DealScout > Environment > Add Environment Variable. Set `DATABASE_URL` to the complete Neon connection string. Paste it only into Render's secret value field; never into source code, a GitHub file, a screenshot, or a chat message.
3. Keep `HOST=0.0.0.0`, `NODE_VERSION=24.13.0`, build command `npm ci --include=dev && npm run build:node`, and start command `npm run start:node`. `DATABASE_PATH` is ignored when `DATABASE_URL` exists and can be removed.
4. Save and deploy the latest GitHub commit. Startup applies the schema-only PostgreSQL migrations in `server/migrations/postgres/`. Initial demo data is inserted separately on the first catalog request if the catalog is empty.
5. Open `/api/health`. The expected body is `{"status":"ok","database":"postgresql"}`. If it says `sqlite`, `DATABASE_URL` was not supplied to that deployed service. No secret is included in this response.

A malformed, empty, or unreachable configured `DATABASE_URL` stops startup rather than falling back to a temporary SQLite file. Logs identify the selected database type but do not print credentials. Remote PostgreSQL connections verify TLS certificates and use at most five pooled client connections. Use a Neon region near your Render service.

Neon data remains in Neon when Render restarts or sleeps. This does not remove Render's cold-start delay or the providers' free usage limits. This connection starts a new PostgreSQL database; existing SQLite/D1 records are not automatically copied. Back up any real existing records before switching. The demonstration catalog can be reseeded safely. Never edit an applied PostgreSQL SQL file; append a new migration. Startup migrations are serialized using a transaction-scoped advisory lock and checked by checksum.

PostgreSQL integration tests run only when `TEST_DATABASE_URL` points to a dedicated **local** test PostgreSQL cluster. They create and drop a uniquely named test database and verify imports, bigint prices, duplicate handling, transaction rollback, migrations, and persistence after reconnecting. They never use the production `DATABASE_URL` or a remote Neon project.

## Data model and daily comparison

- `products`: one exact retailer listing and variant per ID, including retailer product ID, image, URL, MRP in integer paise, and demo flag.
- `daily_prices`: product ID, IST day, integer price in paise, UTC observation time, and source. Composite primary key: product/day/source.
- `clicks`: product ID and click time. This is a raw count, not validated attribution or affiliate earnings.

India's calendar date is calculated with `Asia/Kolkata`; yesterday is the preceding calendar date, including month/year boundaries. Latest observations win within the day, based on normalized UTC timestamps. Equal/older reimports cannot overwrite newer records. Demo and live prices never mix. The formula is `(yesterday - today) / yesterday * 100`; MRP percentage is separate. Missing yesterday means no comparison. Missing today shows the last recorded price with no daily-drop claim. Same-day changes can still occur until a day closes; these are latest daily observations, not a promise of final prices.

The demo consists of 8 listings and 50 observations dated 21–27 October 2026. Dates are fixed and never shifted forward. Product photos are illustrative. Demo outbound links open normal retailer search pages and have no affiliate tags. The site seeds demonstration data only when the products table is empty. To operate with a purely live catalog, initialize it with real products before the first `/api/deals` request, or remove the demo listings and their history using your database tooling.

## Import authorized live feed data

Set a strong `PRICE_INGEST_TOKEN` **on the server**, then restart it. The browser never receives this secret. Without it, catalog/price writes are disabled. Set the same variable in the importer process. Hosting secrets are configured through Sites runtime environment settings, never in tracked source.

`POST /api/products` requires `Authorization: Bearer <token>` and `{ "products": [...] }`. Each product needs `id`, `retailer` (`Amazon` or `Flipkart`), `retailerId`, `title`, `category`, `description`, `image` (HTTPS), `url` (an HTTPS URL on the selected retailer), and `mrpPaise` (positive integer). Use category names matching the UI. Use a separate immutable ID for each seller/variant/currency combination. Reimporting may update descriptions or links, but cannot change a listing's retailer identity or replace a demo listing.

`POST /api/prices` requires the same bearer token and a body like:

```json
{"observations":[{"productId":"your-real-listing-id","pricePaise":2199000,"observedAt":"2026-10-27T07:00:00Z"}]}
```

Both endpoints accept up to 100 entries per atomic batch. Prices must be positive integer paise; timestamps require a timezone and cannot be in the future. Product IDs must exist. Actual observation timestamps, not import times, determine the IST day. Never manufacture yesterday's prices. Demo IDs reject live price writes.

You can normalize your permitted feed into a JSON file with `products` and `observations` arrays, then run:

```powershell
node scripts/import-feed.mjs feed.json
```

The importer defaults to http://127.0.0.1:3000; override `DEALSCOUT_URL` for your server. Importer batches are separately committed. This project does not fetch retailer catalogs, scrape pages, run scheduled jobs, or post to Telegram. Those require your authorized provider credentials and explicit configuration. Large catalogs need server-side pagination, bounded history queries, feed-specific retention, and monitoring before scale-up; the first version serves the complete monitored catalog.

## Affiliate links and Telegram

No affiliate program is connected. Ordinary demo links earn no commission. Store the exact authorized affiliate link in a real product's `url`; update the disclosure when enabling monetization. Do not append invented affiliate IDs. Each merchant controls API eligibility, allowed price retention/display, traffic sources, and attribution. Verify the current terms for your actual account and intended workflow. In particular, sending Telegram visitors through a website should not be assumed to make otherwise prohibited promotion permissible. Telegram posting is intentionally not connected.

## Hosted preview

`npm.cmd run build` creates the Sites Worker. `.openai/hosting.json` declares the `DB` D1 binding. Drizzle SQL in `drizzle/` is schema-only; Sites applies migrations during publication. Demo seed insertion is a separate runtime step. The hosted database and Node SQLite database are independent. `npm.cmd run db:generate` appends migrations when the schema changes. The starter README documents local D1 migration commands. Hosted preview starts private and is not yet a public affiliate application website.

## Privacy and limits

Saved deal IDs use browser local storage. No newsletter, user account, checkout, or contact collection is implemented. Unsplash and Google Fonts load external assets. Outbound clicks record only product/time in the application database; infrastructure may keep request logs. Click counts are not commissions or purchase tracking. No personal information is embedded in the demo.
