'use strict';

// Run: node --test tests/showcase.test.cjs
// Guards the eight-project client-facing discovery journey. No network or dependencies.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const work = html.match(/<section\b[^>]*\bid="work"(?=[\s>])[^>]*>[\s\S]*?<\/section>/i)?.[0];

test('the primary portfolio has exactly eight numbered cards in reading order', () => {
  assert.ok(work, 'missing #work section');
  const cards = [...work.matchAll(/<article\s+class="card[^"]*"[^>]*>[\s\S]*?<\/article>/gi)].map(m => m[0]);
  assert.equal(cards.length, 8, 'only the eight scoped projects belong in the main grid');
  const ids = cards.map(card => card.match(/<span>\s*(0[1-8])\s*\//)?.[1]);
  assert.deepEqual(ids, ['01','02','03','04','05','06','07','08']);
  const titles = cards.map(card => card.match(/<h3>([^<]+)<\/h3>/)?.[1]);
  assert.deepEqual(titles, [
    'Excel Rescue','Sales Intelligence','API Bridge','CRM Lead Intelligence',
    'Landing Page Studio','Document Factory','Data Quality Auditor','Site Change Monitor'
  ]);
});

test('every card offers a truthful destination, with no dead relative links', () => {
  assert.ok(work);
  const cards = [...work.matchAll(/<article\s+class="card[^"]*"[^>]*>[\s\S]*?<\/article>/gi)].map(m => m[0]);
  for (const card of cards) {
    const title = card.match(/<h3>([^<]+)<\/h3>/)?.[1] || 'unknown';
    const hrefs = [...card.matchAll(/<a\s+href="([^"]+)"/g)].map(m => m[1]);
    assert.ok(hrefs.length, title + ' needs at least one action');
    for (const href of hrefs) {
      assert.ok(!/^(?:javascript:|data:)/i.test(href), title + ': unsafe link scheme');
      if (/^https:\/\//.test(href)) {
        assert.ok(href.startsWith('https://github.com/WellingtonMax/freelance-solutions-portfolio/'),
          title + ': unexpected external destination');
      } else {
        assert.ok(!href.includes('..') && !href.startsWith('/'), title + ': unsafe relative path');
        const target = path.resolve(root, decodeURIComponent(href.split('#')[0]));
        assert.ok(target.startsWith(root + path.sep), title + ': path escapes repository');
        assert.ok(fs.existsSync(target), title + ': missing target ' + href);
      }
    }
  }
});

test('draft projects are not advertised as integrated browser demos', () => {
  assert.ok(work);
  const cards = [...work.matchAll(/<article\s+class="card[^"]*"[^>]*>[\s\S]*?<\/article>/gi)].map(m => m[0]);
  for (const card of cards.slice(3)) {
    assert.match(card, /Draft PR|Not merged|In development/i);
    assert.doesNotMatch(card, /Try in browser|Open interactive|Live demo/i);
  }
});

test('the discovery page exposes navigable sections and synthetic-data disclosure', () => {
  assert.match(html, /<html\s+lang="en"/i);
  assert.match(html, /<main\s+id="top"/i);
  assert.match(html, /href="#work"/i);
  assert.match(html, /id="available"/i);
  assert.match(html, /id="approach"/i);
  assert.match(html, /fictional|synthetic/i);
  assert.match(html, /:focus-visible/);
  assert.match(html, /@media\(max-width:560px\)/);
  assert.doesNotMatch(work, /09\s*\/|10\s*\/|Bug Fix Laboratory|Business Operations API/i);
});

test('in-page navigation resolves to real, unique targets', () => {
  const ids = [...html.matchAll(/\bid="([A-Za-z][\w:-]*)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate id attributes break anchor navigation');
  const known = new Set(ids);
  const anchors = [...html.matchAll(/<a\b[^>]*\bhref="#([A-Za-z][\w:-]*)"/gi)]
    .map(match => match[1]);
  assert.ok(anchors.length > 0, 'expected at least one in-page navigation link');
  for (const target of anchors) {
    assert.ok(known.has(target), 'broken in-page navigation target: #' + target);
  }
});
