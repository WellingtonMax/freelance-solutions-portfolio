import { mountHistory } from '../assets/workbench/history-card.mjs';
import { download, element } from '../assets/workbench/dom.mjs';
import { renderStats } from '../assets/workbench/results.mjs';
import { audit } from './catalog-audit.mjs';
const id = value => document.getElementById(value);
const sample = 'id,category,amount\nA01,Parts,120\nA02,,75\nA01,Parts,130\nA04,Tools,-8\nA05,Tools,90';
let report;
function render() {
  const rule = id('filter').value;
  const findings = (report?.findings || []).filter(f => !rule || f.rule === rule);
  renderStats(id('stats'), report ? [['Records', report.rows], ['Flagged', report.flagged], ['Findings', report.findings.length]] : []);
  id('download').disabled = !report;
  id('details').replaceChildren(...findings.map(({row, rule}) => {
    const item = element('li');
    item.append(element('strong', `Record ${row}`), element('span', rule, 'tag warn'));
    return item;
  }));
  id('result').textContent = !report ? 'Run an audit to see findings.' : findings.length ?
    `Showing ${findings.length} of ${report.findings.length} findings.` : 'No findings match this filter.';
}
function run() {
  try { report = audit(id('csv').value); render(); }
  catch (error) { report = undefined; render(); id('result').textContent = error.message; }
}
id('csv').addEventListener('input', () => { report = undefined; render(); });
id('filter').addEventListener('change', render);
id('run').addEventListener('click', run);
function example() { id('csv').value = sample; id('filter').value = ''; run(); }
id('reset').addEventListener('click', example);
id('download').addEventListener('click', () => {
  if (!report) return;
  // Both columns are generated here; no source cells are written to the CSV.
  download('record,rule\r\n' + report.findings.map(f => `${f.row},${f.rule}\r\n`).join(''), 'catalog-audit-findings.csv', 'text/csv;charset=utf-8');
});
mountHistory(id('run-history'), 'quality', () => report && ({rows:report.rows, flagged:report.flagged, findings:report.findings.length}));
example();
