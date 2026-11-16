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

test("CSV preview clearly labels fictional offline processing and blocks network connections", () => {
  const html = read("try.html");
  assert.match(html, /Fictional demonstration/);
  assert.match(html, /No uploads or external connections/);
  assert.match(html, /Use fictional records only/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /Maximum 1 MB, 2,000 rows/);
});

function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((channel) => channel <= 0.04045
    ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a, b) {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}
test("critical preview action and disabled-state colors meet WCAG AA text contrast", () => {
  const css = read("preview-theme.css");
  const cases = [
    ["primary button", /main button\s*\{[^}]*background:\s*#1769e0;[^}]*color:\s*#fff;/s, "ffffff", "1769e0"],
    ["secondary button", /main #run\s*\{[^}]*background:\s*#e9f1fc;[^}]*color:\s*#142746;/s, "142746", "e9f1fc"],
    ["disabled action", /main #run:disabled\s*\{[^}]*background:\s*#e4eaf1;[^}]*color:\s*#405572;/s, "405572", "e4eaf1"],
    ["skip link", /\.skip-link\s*\{[^}]*background:\s*#142746;[^}]*color:\s*#ffffff;/s, "ffffff", "142746"],
  ];
  for (const [name, rule, foreground, background] of cases) {
    assert.match(css, rule, name + " palette changed: review contrast values");
    assert.ok(contrast(foreground, background) >= 4.5, name + " must meet 4.5:1");
  }
});
