const root = new URL('../../', import.meta.url);

export function mountHistory(host, project, getMetrics) {
  if (!host) return;
  const make = (tag, text) => {
    const el = document.createElement(tag);
    el.textContent = text;
    return el;
  };
  host.classList.add('local-history');
  const heading = make('strong', 'Save a demo run');
  const explainer = make('p', 'Only numbers are saved to SQLite in this browser. Raw data and text stay out of the history.');
  const save = make('button', 'Save run');
  save.type = 'button';
  const link = make('a', 'View run history');
  link.href = new URL(`workspace/?project=${project}`, root);
  const status = make('p', '');
  status.setAttribute('role', 'status');
  const actions = document.createElement('div');
  actions.append(save, link);
  host.append(heading, explainer, actions, status);
  save.addEventListener('click', async () => {
    const metrics = getMetrics();
    if (!metrics) {
      status.textContent = 'Run the demo first, then save its summary.';
      return;
    }
    save.disabled = true;
    try {
      const { saveRun } = await import('./db.mjs');
      await saveRun(project, metrics);
      status.textContent = 'Run saved in this browser.';
    } catch (error) {
      console.error(error);
      status.textContent = 'Could not save. Check that this browser allows site storage.';
    } finally {
      save.disabled = false;
    }
  });
}
