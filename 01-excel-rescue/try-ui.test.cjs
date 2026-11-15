"use strict";
const assert = require("node:assert/strict");
// The portfolio CI invokes this entrypoint; include the one-click and stale-read regressions.
require("./test_sample_one_click.cjs");
// Include the existing clipboard, hostile filename, and async UI regression suite in CI.
require("./test_sample_ui.cjs");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const handlers = {};
function element(id) {
  return {
    id, hidden: id === "result", value: "", textContent: "", disabled: false, files: [], attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(type, callback) { handlers[id + ":" + type] = callback; },
    focus() { this.focused = true; }
  };
}
const nodes = Object.fromEntries(["source", "feedback", "result", "run", "clean", "reject", "totals", "sample", "result-heading", "copy-clean", "copy-reject", "copy-feedback"].map(id => [id, element(id)]));
const sandbox = {
  document: { getElementById(id) { return nodes[id]; } },
  ExcelRescueSample: require("./sample-data.js"),
  navigator: {},
  CsvRescuePreview: {
    MAX_BYTES: 1048576,
    process(text) {
      if (text === "invalid") throw new Error("Invalid headers");
      if (text === "empty") return { cleanCsv: "", rejectCsv: "bad", sourceRows: 1, accepted: [], rejected: [{}] };
      return { cleanCsv: "clean", rejectCsv: "", sourceRows: 1, accepted: [{}], rejected: [] };
    }
  }
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "try-ui.js"), "utf8"), sandbox);
const change = () => handlers["source:change"]();
const click = () => handlers["run:click"]();
(async () => {
  await click();
  assert.match(nodes.feedback.textContent, /Choose a CSV/);
  assert.equal(nodes.source.focused, true);
  const file = (name, text, size = 10) => ({ name, size, text: async () => text });
  nodes.source.files = [file("<img src=x>", "valid")];
  change();
  assert.doesNotMatch(nodes.feedback.textContent, /<img src=x>/);
  assert.equal(nodes.feedback.innerHTML, undefined, "filename must not be inserted as HTML");
  await click();
  assert.equal(nodes.result.hidden, false);
  assert.match(nodes.feedback.textContent, /1 accepted/);
  nodes.source.files = [file("bad.csv", "invalid")];
  change();
  assert.equal(nodes.result.hidden, true);
  await click();
  assert.match(nodes.feedback.textContent, /Check UTF-8 encoding and required headers/);
  assert.equal(nodes.run.disabled, false);
  nodes.source.files = [file("zero.csv", "empty")];
  change();
  await click();
  assert.match(nodes.feedback.textContent, /no records accepted/);
  nodes.source.files = [file("large.csv", "valid", 1048577)];
  change();
  await click();
  assert.match(nodes.feedback.textContent, /1 MB/);
  assert.equal(nodes.result.hidden, true);
  let resolveRead;
  nodes.source.files = [{ name: "old.csv", size: 10, text: () => new Promise(resolve => { resolveRead = resolve; }) }];
  change();
  const pending = click();
  assert.equal(nodes.feedback.attributes["aria-busy"], "true", "processing status must be busy");
  assert.equal(nodes.run.disabled, true);
  nodes.source.files = [file("new.csv", "valid")];
  change();
  resolveRead("valid");
  await pending;
  assert.equal(nodes.result.hidden, true, "stale selection must not reveal results");
  assert.equal(nodes.run.disabled, false);
  assert.equal(nodes.feedback.attributes["aria-busy"], "false", "processing status must clear busy after stale read");
  console.log("Excel Rescue local preview UI states: 7 checks passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
