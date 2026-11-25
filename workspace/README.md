# Local SQLite workbench

Ten demos can save an explicit numeric summary; they do not save their source files, form contents, raw CSV, raw JSON, text or document fields. Nothing is submitted to a server. The optional PawLedger checkpoint is separate, uses synthetic aliases for newly added members, and is not included in the history download.

The database uses SQLite compiled to WebAssembly by [sql.js](https://sql.js.org/), with a same-origin, vendored runtime under `assets/workbench/vendor/`. The SQLite files are stored as bytes under separate IndexedDB keys. Each operation opens a short database connection; the read-modify-write is done in one IndexedDB transaction to serialize writes across tabs. The runtime is loaded on demand. GitHub Pages hosts the files, not a database server.

```sql
SELECT project, datetime(created_at / 1000, 'unixepoch') AS created_utc, metrics
FROM runs
ORDER BY id DESC;
```

Schema version 1: `runs(id, project, created_at, metrics)`, with an index on project and ID. Workspace metrics are bounded and validated per project. There are at most 250 entries; oldest runs are pruned first. A different browser/profile has a separate database; clearing this site's storage removes it. Keep the exported file if you need a backup or want to inspect it with SQLite tooling. The demo does not import a replacement database.

## Reproduce checks

- `node --test tests/workbench.test.mjs`
- With Playwright available: `node scripts/check-workbench.cjs`. Set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` if those installations are not in their standard places.
- Source of vendored runtime: npm package `sql.js@1.17.0`, `dist/sql-wasm-browser.js` and `dist/sql-wasm-browser.wasm`. The adjacent license is included unmodified.
