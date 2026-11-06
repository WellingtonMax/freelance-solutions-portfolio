"use strict";
const buttons = [...document.querySelectorAll("button[data-view]")];
const rows = [...document.querySelectorAll("#audit tr")];
const status = document.getElementById("filter-status");
for (const button of buttons) {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    for (const item of buttons) item.setAttribute("aria-pressed", String(item === button));
    let shown = 0;
    for (const row of rows) {
      row.hidden = view !== "all" && row.dataset.status !== view;
      if (!row.hidden) shown++;
    }
    status.textContent = "Showing " + shown + " " + (view === "all" ? "sample" : view) + " record" + (shown === 1 ? "" : "s") + ".";
  });
}
