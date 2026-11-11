"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const html = fs.readFileSync(path.join(__dirname, "sample-explorer.html"), "utf8");
const rows = [...html.matchAll(/<tr data-category="(Office|Home|Travel)" data-cents="(\d+)" data-units="(\d+)">/g)]
  .map(([, category, cents, units]) => ({ category, cents: Number(cents), units: Number(units) }));
test("six synthetic rows reconcile with source sample and displayed totals", () => {
  assert.equal(rows.length, 6);
  assert.equal(rows.reduce((sum, row) => sum + row.cents, 0), 20950);
  assert.equal(rows.reduce((sum, row) => sum + row.units, 0), 19);
  const byCategory = Object.fromEntries(["Office", "Home", "Travel"].map(category =>
    [category, rows.filter(row => row.category === category).reduce((sum, row) => sum + row.cents, 0)]));
  assert.deepEqual(byCategory, { Office: 7050, Home: 4900, Travel: 9000 });
  assert.match(html, /id="revenue">\$209\.50/);
});
test("offline, semantic and disclosure safeguards are present", () => {
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /<th scope="col">/);
  assert.match(html, /Fictional data, AI-assisted development/);
  assert.doesNotMatch(html, /<script\s+src=|<iframe\b|https?:\/\//i);
  assert.match(html, /category\.addEventListener\("change",render\)/);
  assert.match(html, /bars\.replaceChildren\(\)/);
  assert.doesNotMatch(html, /innerHTML/);
});
