import { element } from './dom.mjs';
export function renderStats(container, pairs) {
  container.replaceChildren(...pairs.map(([label, value]) => {
    const stat = element('div', undefined, 'stat');
    stat.append(element('span', label), element('strong', String(value)));
    return stat;
  }));
}
