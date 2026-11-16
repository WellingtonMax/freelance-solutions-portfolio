"use strict";
// P01-F01: independent, dependency-free UX integration contract.
// Run: node --test design/tests/excel-preview-theme.test.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const read = (name) => fs.readFileSync(path.join(root, "01-excel-rescue", name), "utf8");

test("CSV preview loads the scoped light theme after the shared stylesheet", () => {
  const html = read("try.html");
  assert.match(html, /<body\s+class="csv-preview"/);
  const shared = html.indexOf('href="demo.css"');
  const scoped = html.indexOf('href="preview-theme.css"');
  assert.ok(shared >= 0 && scoped > shared, "scoped CSS must override shared CSS");
  assert.match(html, /href="#preview-heading"/);
  assert.match(html, /id="preview-heading"\s+tabindex="-1"/);
});

test("audit demo does not load the preview-only stylesheet", () => {
  assert.doesNotMatch(read("demo.html"), /preview-theme\.css/);
});

test("preview theme includes visible focus, disabled and mobile reflow rules", () => {
  const css = read("preview-theme.css");
  assert.match(css, /body\.csv-preview\s*\{/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /main\s+button:disabled/);
  assert.match(css, /forced-colors:\s*active/);
  assert.match(css, /max-width:\s*420px/);
  assert.match(css, /min-height:\s*44px/);
  assert.doesNotMatch(css, /@import\b|url\s*\(/i, "no external CSS resources");
});

test("disabled primary actions cannot inherit enabled blue styles", () => {
  const css = read("preview-theme.css");
  assert.match(css, /#sample:disabled\s*,\s*body\.csv-preview main #run:disabled\s*\{/);
  assert.match(css, /#sample:disabled\s*,\s*body\.csv-preview main #run:disabled\s*\{[^}]*background:\s*#e4eaf1;/s);
  assert.match(css, /#sample:disabled\s*,\s*body\.csv-preview main #run:disabled\s*\{[^}]*cursor:\s*not-allowed;/s);
});

test("keyboard skip link has an explicit visible surface and focus ring", () => {
  const css = read("preview-theme.css");
  assert.match(css, /body\.csv-preview \.skip-link\s*\{[^}]*background:\s*#142746;[^}]*color:\s*#ffffff;/s);
  assert.match(css, /body\.csv-preview \.skip-link:focus-visible\s*\{[^}]*outline:\s*3px solid/s);
  assert.match(css, /@media \(forced-colors:\s*active\)\s*\{[\s\S]*body\.csv-preview \.skip-link:focus-visible/);
});
