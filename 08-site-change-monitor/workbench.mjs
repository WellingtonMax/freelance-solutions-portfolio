import { mountHistory } from '../assets/workbench/history-card.mjs';
import { download, element } from '../assets/workbench/dom.mjs';
import { renderStats } from '../assets/workbench/results.mjs';
import { diff } from './line-diff.mjs';
const id = value => document.getElementById(value);
const type = {added:'Added', removed:'Removed', unchanged:'Unchanged'};
let report;
function render() {
  const only = id('changes-only').checked;
  const entries = (report?.changes || []).filter(row => !only || row.kind !== 'unchanged');
  renderStats(id('stats'), report ? Object.entries(report.counts).map(([key, value]) => [type[key], value]) : []);
  id('download').disabled = !report;
  id('details').replaceChildren(...entries.map(row => {
    const item = element('li'), value = element('span', row.text || '(blank line)');
    const position = row.old && row.new ? `old ${row.old} / new ${row.new}` : row.old ? `old ${row.old}` : `new ${row.new}`;
    item.append(value, element('span', `${type[row.kind]} · ${position}`, row.kind === 'removed' ? 'tag warn' : 'tag'));
    return item;
  }));
  id('result').textContent = !report ? 'Compare both snapshots to see results.' : entries.length ? `${entries.length} lines shown.` : 'No lines to show with this filter.';
}
function run() {
  try { report = diff(id('before').value, id('after').value); render(); }
  catch (error) { report = undefined; render(); id('result').textContent = error.message; }
}
for (const field of ['before','after']) id(field).addEventListener('input', () => { report = undefined; render(); });
id('changes-only').addEventListener('change', render);
id('run').addEventListener('click', run);
function example() {
  id('before').value = 'Sample offer\nPrice $100\nAvailable today\nPickup included';
  id('after').value = 'Sample offer\nPrice $120\nAvailable tomorrow\nPickup included'; run();
}
id('reset').addEventListener('click', example);
id('download').addEventListener('click', () => {
  if (!report) return;
  const signs = {added:'+',removed:'-',unchanged:' '};
  const text = report.changes.map(row => signs[row.kind] + ' ' + row.text).join('\n');
  download(text, 'snapshot-diff.txt', 'text/plain;charset=utf-8');
});
mountHistory(id('run-history'), 'changes', () => report?.counts);
example();
