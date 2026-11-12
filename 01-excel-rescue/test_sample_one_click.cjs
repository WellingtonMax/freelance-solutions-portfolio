"use strict";
// Run with: node --test 01-excel-rescue/test_sample_one_click.cjs
// DOM stub: verifies the real UI script without a browser or external dependencies.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("fictional sample processes on one click and announces the result", async () => {
  const ids = ["source", "sample", "result-heading", "feedback", "result", "run",
    "clean", "reject", "totals", "copy-clean", "copy-reject", "copy-feedback"];
  const elements = Object.fromEntries(ids.map(id => [id, {
    value: "", textContent: "", hidden: id === "result", disabled: false,
    files: [], size: 0, listeners: {}, attributes: {}, focusCount: 0,
    addEventListener(event, handler) { this.listeners[event] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focusCount++; },
    click() { return this.listeners.click(); },
  }]));
  const calls = [];
  const context = {
    document: { getElementById(id) { return elements[id]; } },
    navigator: {},
    ExcelRescueSample: "fictional csv",
    CsvRescuePreview: {
      MAX_BYTES: 1048576,
      process(text) {
        calls.push(text);
        return { sourceRows: 4, accepted: [{}], rejected: [{}, {}, {}],
          cleanCsv: "name,email\\nBob,bob@example.com",
          rejectCsv: "line,reason\\n2,duplicate" };
      }
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), context);
  await elements.sample.click();
  assert.deepEqual(calls, ["fictional csv"]);
  assert.equal(elements.result.hidden, false);
  assert.match(elements.feedback.textContent, /1 accepted, 3 rejected/);
  assert.match(elements.totals.textContent, /4 input rows/);
  assert.equal(elements["result-heading"].focusCount, 1);
  assert.equal(elements.run.disabled, false);
  assert.equal(elements.feedback.attributes["aria-busy"], "false");
  assert.equal(elements["copy-clean"].disabled, false);
  assert.equal(elements["copy-reject"].disabled, false);
  assert.equal(elements.source.value, "");
});
