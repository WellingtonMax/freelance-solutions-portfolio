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

test("stale file read cannot unlock a newer validation", async () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: "", textContent: "", hidden: id === "result", disabled: false,
      files: [], handlers: {}, focus() {}, select() {},
      addEventListener(name, fn) { this.handlers[name] = fn; }
    });
    return elements.get(id);
  };
  const context = {
    document: { getElementById: element },
    CsvRescuePreview: require("./try.js"),
    ExcelRescueSample: require("./sample-data.js"),
    navigator: {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), context);
  const pending = [];
  const file = () => ({
    size: 100,
    text: () => new Promise(resolve => pending.push(resolve))
  });
  element("source").files = [file()];
  element("source").handlers.change();
  const first = element("run").handlers.click();
  assert.equal(element("run").disabled, true);
  element("source").files = [file()];
  element("source").handlers.change();
  assert.equal(element("run").disabled, false, "new selection restores the action");
  const second = element("run").handlers.click();
  assert.equal(element("run").disabled, true);
  pending[0](require("./sample-data.js"));
  await first;
  assert.equal(element("run").disabled, true, "stale completion cannot unlock current read");
  assert.equal(element("result").hidden, true, "stale results remain hidden");
  pending[1](require("./sample-data.js"));
  await second;
  assert.equal(element("run").disabled, false);
  assert.equal(element("result").hidden, false);
  assert.match(element("totals").textContent, /4 input rows/);
});


test("file read failures show actionable feedback without exposing exception details", async () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: "", textContent: "", hidden: id === "result", disabled: false,
      files: [], handlers: {}, focus() {}, select() {},
      addEventListener(name, fn) { this.handlers[name] = fn; }
    });
    return elements.get(id);
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), {
    document: { getElementById: element },
    CsvRescuePreview: require("./try.js"),
    ExcelRescueSample: require("./sample-data.js"),
    navigator: {}
  });
  element("source").files = [{ size: 10, text: async () => { throw new Error("private/path/customer.csv"); } }];
  element("source").handlers.change();
  await element("run").handlers.click();
  assert.match(element("feedback").textContent, /Check UTF-8 encoding and required headers/);
  assert.equal(element("feedback").textContent.includes("private/path/customer.csv"), false);
  assert.equal(element("result").hidden, true);
  assert.equal(element("run").disabled, false);
});

test("clipboard denial offers manual copy without leaking errors or claiming success", async () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: "", textContent: "", hidden: id === "result",
      disabled: id.startsWith("copy-"), files: [], handlers: {},
      focus() { this.focused = true; },
      select() { this.selected = true; },
      addEventListener(name, fn) { this.handlers[name] = fn; }
    });
    return elements.get(id);
  }
  const context = {
    document: { getElementById: element },
    CsvRescuePreview: require("./try.js"),
    ExcelRescueSample: require("./sample-data.js"),
    navigator: { clipboard: { writeText: async () => {
      throw new Error("private/path/customer.csv");
    } } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), context);
  element("sample").handlers.click();
  await element("run").handlers.click();
  await element("copy-clean").handlers.click();
  assert.match(element("copy-feedback").textContent, /Clipboard permission denied/);
  assert.doesNotMatch(element("copy-feedback").textContent, /private\/path|copied to clipboard/);
  assert.equal(element("clean").focused, true);
  assert.equal(element("clean").selected, true);
  element("source").files = [{ name: "new.csv", size: 0 }];
  element("source").handlers.change();
  assert.equal(element("copy-clean").disabled, true);
  assert.equal(element("result").hidden, true);
});


test("late clipboard completion cannot announce success after changing CSV", async () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: "", textContent: "", hidden: id === "result",
      disabled: id.startsWith("copy-"), files: [], handlers: {},
      focus() { this.focused = true; },
      select() { this.selected = true; },
      addEventListener(name, fn) { this.handlers[name] = fn; }
    });
    return elements.get(id);
  }
  let completeCopy;
  const context = {
    document: { getElementById: element },
    CsvRescuePreview: require("./try.js"),
    ExcelRescueSample: require("./sample-data.js"),
    navigator: { clipboard: { writeText: () => new Promise(resolve => {
      completeCopy = resolve;
    }) } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), context);
  element("sample").handlers.click();
  await element("run").handlers.click();
  const pendingCopy = element("copy-clean").handlers.click();
  element("source").files = [{ name: "next.csv", size: 0 }];
  element("source").handlers.change();
  const expectedFeedback = element("copy-feedback").textContent;
  completeCopy();
  await pendingCopy;
  assert.equal(element("copy-feedback").textContent, expectedFeedback);
  assert.doesNotMatch(element("copy-feedback").textContent, /copied to clipboard/i);
  assert.equal(element("copy-clean").disabled, true);
  assert.equal(element("result").hidden, true);
});
