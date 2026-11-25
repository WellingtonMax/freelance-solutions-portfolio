import { projects, metricLabels } from '../assets/workbench/catalog.mjs';
import { listRuns, exportDatabase, removeRun, clearRuns } from '../assets/workbench/db.mjs';
import { download } from '../assets/workbench/dom.mjs';

const id = value => document.getElementById(value);
const project = id('project'), status = id('status'), runs = id('runs'), empty = id('empty');
const exp = id('export'), clear = id('clear'), confirmation = id('confirm');
const date = new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' });
const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits:2 });
for (const [key, [name]] of Object.entries(projects)) project.add(new Option(name, key));
const selected = new URLSearchParams(location.search).get('project');
if (Object.hasOwn(projects, selected || '')) project.value = selected;
let version = 0;
function el(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}
function card({ id, project, createdAt, metrics }) {
  const [name, route] = projects[project];
  const row = el('li', '');
  const details = el('div', '');
  const link = el('a', name);
  link.href = new URL('../' + route, import.meta.url);
  const when = el('time', date.format(createdAt));
  when.dateTime = new Date(createdAt).toISOString();
  const summary = el('p', Object.entries(metrics).map(([key, count]) => `${metricLabels[project][key]}: ${decimal.format(count)}`).join(' · '));
  const del = el('button', 'Delete');
  del.type = 'button'; del.className = 'quiet';
  del.setAttribute('aria-label', `Delete ${name} run from ${when.textContent}`);
  del.addEventListener('click', async () => {
    del.disabled = true;
    try { await removeRun(id); projectElement().focus(); await render('Run deleted. '); }
    catch { status.textContent = 'Could not delete this run.'; del.disabled = false; }
  });
  details.append(link, when, summary); row.append(details, del);
  return row;
}
const projectElement = () => id('project');
async function render(prefix = '') {
  const call = ++version;
  try {
    const all = await listRuns();
    if (call !== version) return;
    const visible = project.value ? all.filter(row => row.project === project.value) : all;
    runs.replaceChildren(...visible.map(card)); empty.hidden = !!visible.length;
    status.textContent = `${prefix}${visible.length} of ${all.length} saved ${all.length === 1 ? 'run' : 'runs'}.`;
    clear.disabled = !all.length;
    exp.disabled = !all.length;
  } catch (error) {
    console.error(error);
    if (call === version) status.textContent = 'Could not open SQLite. Check that this browser allows site storage.';
  }
}
project.addEventListener('change', () => render());
window.addEventListener('pageshow', event => { if(event.persisted) render(); });
exp.addEventListener('click', async () => {
  exp.disabled = true;
  try { download(await exportDatabase(), 'portfolio-runs.sqlite3', 'application/vnd.sqlite3'); }
  catch { status.textContent = 'Could not export SQLite.'; }
  finally { exp.disabled = false; }
});
clear.addEventListener('click', () => { confirmation.hidden = false; id('cancel-clear').focus(); });
id('cancel-clear').addEventListener('click', () => { confirmation.hidden = true; clear.focus(); });
id('confirm-clear').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  try { await clearRuns(); confirmation.hidden = true; project.focus(); await render('History cleared. '); }
  catch { status.textContent = 'Could not clear history.'; }
  finally { id('confirm-clear').disabled = false; }
});
render();
