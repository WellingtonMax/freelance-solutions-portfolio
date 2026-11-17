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

test("stale file reads never reveal results navigation", async () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      hidden: id === "result" || id === "result-nav",
      disabled: false, value: "", textContent: "", files: [], listeners: {},
      addEventListener(event, handler) { this.listeners[event] = handler; },
      setAttribute() {}, focus() {}, select() {},
    });
    return elements.get(id);
  }
  let finishRead;
  const delayedRead = new Promise(resolve => { finishRead = resolve; });
  const file = { name: "old.csv", size: 20, text: () => delayedRead };
  const context = {
    document: { getElementById: element },
    ExcelRescueSample: "name,email,signup_date,city",
    CsvRescuePreview: {
      MAX_BYTES: 1048576,
      process() { throw new Error("Stale data must never be processed"); },
    },
    navigator: {},
  };
  vm.runInNewContext(js, context, { filename: "try-ui.js" });
  element("source").files = [file];
  element("source").listeners.change();
  const pending = element("run").listeners.click();
  element("source").files = [];
  element("source").listeners.change();
  finishRead("name,email,signup_date,city\\nOld,old@example.com,2026-01-01,Old City");
  await pending;
  assert.equal(element("result").hidden, true);
  assert.equal(element("result-nav").hidden, true);
  assert.equal(element("run").disabled, false);
});

test("reset moves keyboard focus away from disappearing results navigation", async () => {
  const elements = new Map();
  const document = {
    activeElement: null,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        hidden: id === "result" || id === "result-nav",
        disabled: false, value: "", textContent: "", files: [], listeners: {},
        addEventListener(event, handler) { this.listeners[event] = handler; },
        setAttribute() {},
        focus() { document.activeElement = this; },
        select() {},
      });
      return elements.get(id);
    },
  };
  const node = id => document.getElementById(id);
  vm.runInNewContext(js, {
    document,
    ExcelRescueSample: "name,email,signup_date,city\\nTest,test@example.com,2026-01-01,City",
    CsvRescuePreview: {
      MAX_BYTES: 1048576,
      process(text) {
        return { sourceRows: 1, accepted: [{}], rejected: [],
          cleanCsv: text, rejectCsv: "line,reason" };
      },
    },
    navigator: {},
  }, { filename: "try-ui.js" });
  node("sample").listeners.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(node("result-nav").hidden, false);
  node("result-nav").focus();
  node("source").files = [{ name: "next.csv", size: 10 }];
  node("source").listeners.change();
  assert.equal(node("result-nav").hidden, true);
  assert.equal(document.activeElement, node("source"));
});
