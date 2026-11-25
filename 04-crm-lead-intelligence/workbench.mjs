import { mountHistory } from '../assets/workbench/history-card.mjs';
import { element } from '../assets/workbench/dom.mjs';
import { renderStats } from '../assets/workbench/results.mjs';
const id = value => document.getElementById(value);
const leads = [
  ['Atlas Workshop', 6, ''], ['Example Labs', 4, ''], ['Fictional Works', 2, ''],
  ['Orchid Tools', 1, ''], ['Sample Agency', 9, 'Agency'], ['Opted Out Ltd', 7, 'Opted out'],
];
let metrics;
function render() {
  const filter = id('filter').value;
  const search = id('search').value.trim().toLowerCase();
  const visible = leads.filter(([name, , stop]) => name.toLowerCase().includes(search)
    && (filter === 'All' || (filter === 'Suppressed' ? stop : !stop)));
  const eligible = leads.filter(([, , stop]) => !stop).length;
  metrics = { reviewed: eligible, visible: visible.length, suppressed: leads.length - eligible };
  renderStats(id('stats'), [['Reviewable', eligible], ['Suppressed', metrics.suppressed], ['Showing', visible.length]]);
  id('result').textContent = visible.length ? `Showing ${visible.length} fictional companies.` : 'No companies match these filters.';
  id('details').replaceChildren(...visible.map(([name, openings, stop]) => {
    const row = element('tr'), label = element('th', name), decision = element('td');
    label.scope = 'row';
    decision.append(element('span', stop || 'Human review', stop ? 'tag warn' : 'tag'));
    row.append(label, element('td', String(openings)), decision);
    return row;
  }));
}
id('filter').addEventListener('change', render); id('search').addEventListener('input', render);
id('reset').addEventListener('click', () => { id('filter').selectedIndex = 0; id('search').value = ''; render(); });
mountHistory(id('run-history'), 'crm', () => metrics);
render();
