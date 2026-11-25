import { mountHistory } from '../assets/workbench/history-card.mjs';
import { usd } from '../assets/workbench/dom.mjs';
import { renderStats } from '../assets/workbench/results.mjs';
const id = value => document.getElementById(value);
const form = id('quote-form');
const defaults = { audit:125, landing:180, dashboard:350 };
let metrics;
function render() {
  const valid = form.checkValidity();
  id('details').hidden = !valid;
  id('print').disabled = !valid;
  if (!valid) {
    metrics = undefined;
    id('result').textContent = 'Enter a valid quantity, unit price, and discount.';
    return;
  }
  const quantity = id('qty').valueAsNumber;
  const priceCents = Math.round(id('price').valueAsNumber * 100);
  const subtotal = priceCents * quantity;
  const discount = id('discount').valueAsNumber;
  const total = subtotal - Math.round(subtotal * discount / 100);
  metrics = {quantity, subtotal:subtotal/100, total:total/100};
  id('item').textContent = `${id('service').selectedOptions[0].textContent}: ${quantity} × ${usd.format(priceCents/100)}`;
  renderStats(id('stats'), [['Subtotal', usd.format(subtotal/100)], ['Discount', discount + '%'], ['Total', usd.format(total/100)]]);
  id('result').textContent = 'Quote updated locally.';
}
form.addEventListener('submit', event => { event.preventDefault(); render(); });
form.addEventListener('input', render);
form.addEventListener('reset', () => setTimeout(render, 0));
id('service').addEventListener('change', () => { id('price').value = defaults[id('service').value]; render(); });
id('print').addEventListener('click', () => { if (form.reportValidity()) window.print(); });
mountHistory(id('run-history'), 'quote', () => metrics);
render();
