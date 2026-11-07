"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sample = require("./sample-data.js");
const {process} = require("./try.js");
test("bundled sample is identical to checked-in fictional CSV", () => {
  assert.equal(sample, fs.readFileSync(path.join(__dirname,"sample.csv"),"utf8"));
  const output = process(sample);
  assert.deepEqual([output.sourceRows,output.accepted.length,output.rejected.length],[4,1,3]);
});
test("offline sample path is explicit and no remote fetch is introduced", () => {
  const html=fs.readFileSync(path.join(__dirname,"try.html"),"utf8");
  const ui=fs.readFileSync(path.join(__dirname,"try-ui.js"),"utf8");
  assert.match(html,/id="sample"/);
  assert.match(html,/sample-data\.js/);
  assert.match(html,/connect-src 'none'/);
  assert.match(ui,/selectionVersion/);
  assert.match(ui,/resultHeading\.focus\(\)/);
  assert.doesNotMatch(ui,/fetch\(|innerHTML|eval\(/);
});
