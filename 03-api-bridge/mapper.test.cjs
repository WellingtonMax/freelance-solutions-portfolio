"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const {inspect,toCsv,csvCell,formulaLike} = require("./mapper.js");

test("discovers safe fields from fictional records", () => {
  const result = inspect('[{"id":1,"name":"Sample"},{"id":2,"status":"active"}]');
  assert.deepEqual(result.fields, ["id","name","status"]);
  assert.equal(result.records.length, 2);
});
test("escapes CSV delimiters and spreadsheet formulas", () => {
  const csv = toCsv([{name:'A, "B"', note:"=1+1"},{name:"Demo",note:"\u200b+2"}],["name","note"]);
  assert.match(csv, /"A, ""B"""/);
  assert.match(csv, /'=1\+1/);
  assert.match(csv, /'\u200b\+2/);
  assert.equal(formulaLike(" ordinary"),false);
  assert.equal(csvCell("line\nnext"),"line next");
});
test("rejects hostile and invalid JSON input", () => {
  assert.throws(() => inspect("{bad"), /Invalid JSON/);
  assert.throws(() => inspect('{"a":1}'), /array/);
  assert.throws(() => inspect('[null]'), /array/);
  assert.throws(() => inspect("x".repeat(50001)), /limit/);
  assert.throws(() => inspect(JSON.stringify(Array.from({length:201},()=>({id:1})))), /200/);
  assert.throws(() => inspect('[{"<script>":"x"}]'), /safe column/);
  assert.throws(() => toCsv([{}],[]), /at least one/);
});
test("zero records cannot create a misleading preview", () => {
  assert.throws(() => inspect("[]"), /safe column/);
});
