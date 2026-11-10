"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const { join } = require("node:path");

// In-memory DOM fixture: no browser, network, customer records or dependencies.
function fixture() {
  const buttons = ["all", "accepted", "rejected"].map(view => ({
    dataset: { view },
    attributes: { "aria-pressed": String(view === "all") },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) {
      assert.equal(name, "click");
      this.click = handler;
    },
  }));
  const rows = ["rejected", "accepted", "rejected", "rejected"].map(status => ({
    dataset: { status }, hidden: false,
  }));
  const status = { textContent: "Showing all 4 records." };
  const document = {
    querySelectorAll(selector) {
      if (selector === "button[data-view]") return buttons;
      if (selector === "#audit tr") return rows;
      throw new Error("Unexpected selector: " + selector);
    },
    getElementById(id) {
      assert.equal(id, "filter-status");
      return status;
    },
  };
  const script = readFileSync(join(__dirname, "demo.js"), "utf8");
  runInNewContext(script, { document }, { timeout: 1000 });
  return { buttons, rows, status };
}

test("all, accepted, rejected and back to all update rows, selection and status", () => {
  const { buttons, rows, status } = fixture();
  const expectations = [
    { index: 1, visible: [1], text: "Showing 1 accepted record." },
    { index: 2, visible: [0, 2, 3], text: "Showing 3 rejected records." },
    { index: 0, visible: [0, 1, 2, 3], text: "Showing 4 sample records." },
  ];
  for (const { index, visible, text } of expectations) {
    buttons[index].click();
    assert.deepEqual(rows.flatMap((row, i) => row.hidden ? [] : [i]), visible);
    assert.deepEqual(buttons.map(b => b.attributes["aria-pressed"]),
      buttons.map((_, i) => String(i === index)));
    assert.equal(status.textContent, text);
  }
});

test("filtering does not mutate source statuses or create extra rows", () => {
  const { buttons, rows } = fixture();
  const original = rows.map(row => row.dataset.status);
  for (const button of buttons) button.click();
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(row => row.dataset.status), original);
});
