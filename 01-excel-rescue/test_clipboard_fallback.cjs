"use strict";
// Run: node --test 01-excel-rescue/test_clipboard_fallback.cjs
// Regression tests for browser-only copy failures; no external dependencies or real data.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness(clipboard) {
  const ids = ["source", "sample", "result-heading", "feedback", "result", "run",
    "clean", "reject", "totals", "copy-clean", "copy-reject", "copy-feedback"];
  const elements = Object.fromEntries(ids.map(id => [id, {
    value: "", textContent: "", hidden: id === "result", disabled: false,
    files: [], listeners: {}, attributes: {}, focusCount: 0, selectCount: 0,
    addEventListener(type, handler) { this.listeners[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focusCount++; },
    select() { this.selectCount++; },
    click() { return this.listeners.click(); },
  }]));
  const context = {
    document: { getElementById(id) { return elements[id]; } },
    navigator: clipboard === undefined ? {} : { clipboard },
    ExcelRescueSample: "fictional input",
    CsvRescuePreview: {
      MAX_BYTES: 1000000,
      process() {
        return { sourceRows: 2, accepted: [{}], rejected: [{}],
          cleanCsv: "name,email\\r\\nExample,example@example.invalid",
          rejectCsv: "row,reason\\r\\n2,invalid" };
      },
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), context);
  return elements;
}

test("clipboard API unavailable: no false success, manual selection remains available", async () => {
  const el = harness();
  await el.sample.click();
  assert.equal(el.result.hidden, false);
  await el["copy-clean"].click();
  assert.match(el["copy-feedback"].textContent, /Clipboard access is unavailable/);
  assert.doesNotMatch(el["copy-feedback"].textContent, /copied to clipboard/i);
  assert.equal(el.clean.selectCount, 1);
  assert.equal(el.clean.focusCount, 1);
  assert.equal(el["copy-clean"].disabled, false);
  assert.match(el.clean.value, /example@example.invalid/);
});

test("clipboard permission denied: manual rejected CSV remains selectable", async () => {
  const el = harness({ writeText: async () => { throw new Error("permission denied"); } });
  await el.sample.click();
  await el["copy-reject"].click();
  assert.match(el["copy-feedback"].textContent, /Clipboard permission denied/);
  assert.doesNotMatch(el["copy-feedback"].textContent, /copied to clipboard/i);
  assert.equal(el.reject.selectCount, 1);
  assert.equal(el.reject.focusCount, 1);
  assert.equal(el["copy-reject"].disabled, false);
  assert.match(el.reject.value, /invalid/);
});

test("pending clipboard permission cannot announce success after a new sample", async () => {
  let resolveWrite;
  const el = harness({ writeText: () => new Promise(resolve => { resolveWrite = resolve; }) });
  await el.sample.click();
  const pending = el["copy-clean"].click();
  assert.equal(el["copy-clean"].disabled, true);
  await el.sample.click();
  const latestStatus = el["copy-feedback"].textContent;
  resolveWrite();
  await pending;
  assert.equal(el["copy-feedback"].textContent, latestStatus);
  assert.doesNotMatch(el["copy-feedback"].textContent, /copied to clipboard/i);
  assert.equal(el["copy-clean"].disabled, false);
});
