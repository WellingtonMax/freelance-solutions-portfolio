"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "try.html"), "utf8");
const js = fs.readFileSync(path.join(root, "try-ui.js"), "utf8");
const css = fs.readFileSync(path.join(root, "workspace.css"), "utf8");

test("results navigation is initially hidden and CSS preserves hidden state", () => {
  assert.match(html, /id="result-nav"[^>]*hidden/);
  assert.match(html, /id="result" hidden/);
  assert.match(css, /\.csv-preview\s+\.sidebar\s+a\[hidden\]\s*\{\s*display:\s*none\s*\}/);
});

test("results navigation follows processing success and selection reset", async () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        hidden: id === "result" || id === "result-nav",
        disabled: false, value: "", textContent: "", files: [],
        listeners: {},
        addEventListener(event, handler) { this.listeners[event] = handler; },
        setAttribute() {}, focus() {}, select() {},
      });
    }
    return elements.get(id);
  }
  const sample = "name,email,signup_date,city\nTest,test@example.com,2026-01-01,City";
  const context = {
    document: { getElementById: element },
    ExcelRescueSample: sample,
    CsvRescuePreview: {
      MAX_BYTES: 1048576,
      process() {
        return {
          sourceRows: 1,
          accepted: [{ name: "Test" }],
          rejected: [],
          cleanCsv: sample,
          rejectCsv: "line,reason",
        };
      },
    },
    navigator: {},
  };
  vm.runInNewContext(js, context, { filename: "try-ui.js" });
  assert.equal(element("result-nav").hidden, true);
  element("sample").listeners.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(element("result").hidden, false);
  assert.equal(element("result-nav").hidden, false);
  element("source").files = [{ name: "other.csv", size: 10 }];
  element("source").listeners.change();
  assert.equal(element("result").hidden, true);
  assert.equal(element("result-nav").hidden, true);
});
