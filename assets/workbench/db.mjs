import { metricLabels, projects } from './catalog.mjs';

const NS = 'wellington-freelance-portfolio-workbench-v1';
const MAX_RUNS = 250;
const vendor = new URL('./vendor/', import.meta.url);
let enginePromise, storagePromise;
const openEngine = () => enginePromise ||= new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = new URL('sql-wasm-browser.js', vendor);
  script.onload = () => globalThis.initSqlJs({
    locateFile: file => new URL(file, vendor).href,
  }).then(resolve, reject);
  script.onerror = () => reject(new Error('SQLite could not load'));
  document.head.append(script);
});
const openStorage = () => storagePromise ||= new Promise((resolve, reject) => {
  const request = indexedDB.open(NS, 1);
  request.onupgradeneeded = () => request.result.createObjectStore('db');
  request.onsuccess = () => {
    request.result.onversionchange = () => { request.result.close(); storagePromise = undefined; };
    resolve(request.result);
  };
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error('Another tab is blocking storage'));
});

// Read, update, and write the SQLite snapshot inside one IndexedDB transaction.
// No await occurs while a write transaction is open; separate tabs cannot overwrite one another.
async function withDatabase(write, operation, key = "sqlite") {
  const [SQL, storage] = await Promise.all([openEngine(), openStorage()]);
  return new Promise((resolve, reject) => {
    const transaction = storage.transaction('db', write ? 'readwrite' : 'readonly');
    const store = transaction.objectStore('db');
    let result, failure;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure || transaction.error || new Error('Storage unavailable'));
    const request = store.get(key);
    request.onsuccess = () => {
      let db;
      try {
        db = new SQL.Database(request.result);
        if (key === "sqlite") db.run(`CREATE TABLE IF NOT EXISTS runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, project TEXT NOT NULL, created_at INTEGER NOT NULL, metrics TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS runs_by_project ON runs(project, id DESC);
        PRAGMA user_version = 1;`);
        result = operation(db);
        if (write) store.put(db.export(), key);
      } catch (error) {
        failure = error;
        transaction.abort();
      } finally {
        db?.close();
      }
    };
  });
}

function checkProject(project) {
  if (!Object.hasOwn(projects, project)) throw new TypeError('Unknown project');
}
export function saveRun(project, metrics) {
  checkProject(project);
  if (!metrics || typeof metrics !== 'object') throw new TypeError('Expected numeric metrics');
  const labels = Object.keys(metricLabels[project]);
  if (Object.keys(metrics).length !== labels.length || !labels.every(key =>
    Object.hasOwn(metrics, key) && Number.isFinite(metrics[key]) &&
    metrics[key] >= 0 && metrics[key] <= 1e10
  )) throw new TypeError('Invalid run summary');
  const clean = Object.fromEntries(labels.map(key => [key, metrics[key]]));
  return withDatabase(true, db => {
    db.run('INSERT INTO runs (project,created_at,metrics) VALUES (?,?,?)', [project, Date.now(), JSON.stringify(clean)]);
    db.run('DELETE FROM runs WHERE id IN (SELECT id FROM runs ORDER BY id DESC LIMIT -1 OFFSET ?)', [MAX_RUNS]);
  });
}
export function listRuns(project = '') {
  if (project) checkProject(project);
  return withDatabase(false, db => {
    const query = project ? 'WHERE project = ?' : '';
    const result = db.exec(`SELECT id,project,created_at,metrics FROM runs ${query} ORDER BY id DESC`, project ? [project] : []);
    return (result[0]?.values || []).map(([id, project, createdAt, raw]) => ({id, project, createdAt, metrics: JSON.parse(raw)}));
  });
}
export function removeRun(id) {
  if (!Number.isSafeInteger(id) || id < 1) throw new TypeError('Invalid history entry');
  return withDatabase(true, db => { db.run('DELETE FROM runs WHERE id = ?', [id]); });
}
export const clearRuns = () => withDatabase(true, db => {
  db.run('DELETE FROM runs; VACUUM;');
});
export const exportDatabase = () => withDatabase(false, db => db.export());

// PawLedger's checkpoint is deliberately separate from the downloadable run database.
const checkpointTable = "CREATE TABLE IF NOT EXISTS checkpoint (id INTEGER PRIMARY KEY CHECK(id=1), state TEXT NOT NULL)";
const checkpointKey = "paw-snapshot";
export function savePawCheckpoint(state) {
  const json = JSON.stringify(state);
  if (json.length > 150000) throw RangeError('Too many changes to save this demo.');
  return withDatabase(true, db => {
    db.run(checkpointTable);
    db.run('INSERT OR REPLACE INTO checkpoint VALUES (1, ?)', [json]);
  }, checkpointKey);
}
export const getPawCheckpoint = () => withDatabase(false, db => {
  db.run(checkpointTable);
  const json = db.exec('SELECT state FROM checkpoint WHERE id=1')[0]?.values[0][0];
  return json ? JSON.parse(json) : null;
}, checkpointKey);
export const clearPawCheckpoint = () => withDatabase(true, db => {
  db.run(checkpointTable);
  db.run('DELETE FROM checkpoint; VACUUM;');
}, checkpointKey);
