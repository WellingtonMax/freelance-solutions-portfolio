"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

test("fictional sample click renders actual accepted/rejected CSV outputs", async () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        value: "", textContent: "", hidden: id === "result",
        disabled: id === "copy-clean" || id === "copy-reject",
        files: [], handlers: {}, focus() { this.focused = true; },
        select() { this.selected = true; },
        addEventListener(name, fn) { this.handlers[name] = fn; }
      });
    }
    return elements.get(id);
  }
  const context = {
    document: { getElementById: element },
    CsvRescuePreview: require("./try.js"),
    ExcelRescueSample: require("./sample-data.js"),
    navigator: {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), context);
  element("sample").handlers.click();
  assert.match(element("feedback").textContent, /Fictional sample/);
  await element("run").handlers.click();
  assert.equal(element("result").hidden, false);
  assert.equal(element("totals").textContent, "4 input rows · 1 accepted · 3 rejected");
  assert.match(element("clean").value, /bob@example.com/);
  assert.match(element("reject").value, /(?:^|\r?\n)5,invalid email(?:\r?\n|$)/);
  assert.equal(element("copy-clean").disabled, false);
  assert.equal(element("copy-reject").disabled, false);
  assert.equal(element("result-heading").focused, true);
});
