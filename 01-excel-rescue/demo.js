"use strict";
const buttons = [...document.querySelectorAll("button[data-view]")];
const rows = [...document.querySelectorAll("#audit tr")];
const status = document.getElementById("filter-status");

function applyFilter(button) {
  const view = button.dataset.view;
  for (const item of buttons) item.setAttribute("aria-pressed", String(item === button));
  let shown = 0;
  for (const row of rows) {
    row.hidden = view !== "all" && row.dataset.status !== view;
    if (!row.hidden) shown++;
  }
  status.textContent = "Showing " + shown + " " + (view === "all" ? "sample" : view) + " record" + (shown === 1 ? "" : "s") + ".";
}

for (const [index, button] of buttons.entries()) {
  button.addEventListener("click", () => applyFilter(button));
  button.addEventListener("keydown", (event) => {
    const next = event.key === "ArrowRight" || event.key === "ArrowDown"
      ? (index + 1) % buttons.length
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? (index - 1 + buttons.length) % buttons.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : -1;
    if (next === -1) return;
    event.preventDefault();
    buttons[next].focus();
    applyFilter(buttons[next]);
  });
}
