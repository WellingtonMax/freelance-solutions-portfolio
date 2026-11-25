import { mountHistory } from './history-card.mjs';
const id = value => document.getElementById(value);
const n = (el, attr) => Number(el.getAttribute(attr));
const readers = {
  excel: () => !id('result').hidden && ({accepted:n(id('totals'),'data-accepted'),rejected:n(id('totals'),'data-rejected')}),
  sales: () => ({orders:n(id('orders'),'data-count'),revenue:n(id('revenue'),'data-cents')/100}),
  api: () => !id('download').disabled && ({records:n(id('summary'),'data-records'),columns:n(id('summary'),'data-columns')}),
  landing: () => id('feedback').getAttribute('data-valid') === 'yes' && ({valid:1}),
};
const host = document.querySelector('[data-run-project]');
mountHistory(host, host.dataset.runProject, readers[host.dataset.runProject]);
