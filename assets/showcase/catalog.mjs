const controls = document.querySelector('.catalog-filter');
const category = document.querySelector('#catalog-theme');
const status = document.querySelector('#catalog-status');
const cards = [...document.querySelectorAll('.grid .card')];
function render() {
  let selected = 0;
  for (const card of cards) {
    card.hidden = Boolean(category.value && card.querySelector('[data-category]').dataset.category !== category.value);
    if (!card.hidden) selected++;
  }
  status.textContent = `Showing ${selected} of ${cards.length} projects.`;
}
controls.hidden = false;
category.addEventListener('change', render);
render();
