# Connect DealScout to Neon on Render

The backend selects PostgreSQL whenever the server's `DATABASE_URL` variable is present. Your database password never goes into the browser or GitHub.

1. Open your Neon project and click **Connect**.
2. Select the intended branch and database, and enable **Connection pooling**.
3. Copy the connection string starting with `postgresql://`. If the panel shows a command such as `psql 'postgresql://…'`, copy only the URL inside the quotes.
4. Open Render > DealScout > **Environment** > **Add Environment Variable**.
5. Enter key **DATABASE_URL** and paste the complete URL into the secret value field.
6. Keep **HOST=0.0.0.0** and **NODE_VERSION=24.13.0**. `DATABASE_PATH` is no longer needed in PostgreSQL mode.
7. Save and deploy the latest commit. Keep build command `npm ci --include=dev && npm run build:node` and start command `npm run start:node`.
8. Open **https://dealscout-pjkc.onrender.com/api/health**. It should show:

```json
{"status":"ok","database":"postgresql"}
```

Then open the website. Tables are created on startup, and an empty catalog is populated with the clearly labeled demonstration data. Connecting Neon does not connect retailer feeds or replace the demo with real offers.

If health reports `sqlite`, the environment variable is missing from the deployed service. If deployment fails after adding the URL, check the selected Neon branch, full URL, password, and Render logs. Share only error codes or redacted logs; keep credentials private. PostgreSQL startup does not silently fall back to SQLite.

Data from the old SQLite/D1 database is not automatically moved. If you have imported real data, export it before switching. Render's free service may still take time to wake up, but its restarts no longer delete records stored in Neon. Watch both providers' usage limits and maintain separate backups of important records.
