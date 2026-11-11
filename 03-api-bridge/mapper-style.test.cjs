"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("offline mapper stylesheet is compatible with its strict CSP", () => {
  const html = fs.readFileSync(path.join(__dirname, "mapper.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "mapper.css"), "utf8");
  assert.match(html, /style-src 'self'/);
  assert.match(html, /<link rel="stylesheet" href="mapper\.css">/);
  assert.doesNotMatch(html, /<style\b|\sstyle\s*=/i);
  assert.doesNotMatch(html, /https?:\/\//i, "offline page must not depend on remote resources");
  assert.match(html, /<script src="mapper\.js" defer><\/script>/);
  assert.match(css, /\.layout\s*\{/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /:focus-visible/);
});
