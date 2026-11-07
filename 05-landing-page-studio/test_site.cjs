const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {validateEnquiry} = require('./site.js');
test('accepts legitimate synthetic enquiry without sending', () => {
  assert.equal(validateEnquiry({name:'Test Person',email:'test@example.com',message:'A sample project request'}),null);
});
test('rejects missing, invalid and oversized fields', () => {
  assert.ok(validateEnquiry({name:'',email:'a@b.com',message:'A long message'}));
  assert.ok(validateEnquiry({name:'Test',email:'not-email',message:'A long message'}));
  assert.ok(validateEnquiry({name:'Test',email:'a@b.com',message:'x'}));
  assert.ok(validateEnquiry({name:'Test',email:'a@b.com',message:'x'.repeat(1001)}));
});
test('rejects non-text inputs and invisible email spoofing',()=>{
  assert.ok(validateEnquiry({name:{toString(){throw Error('unexpected')}},email:'a@b.com',message:'Hello world'}));
  assert.ok(validateEnquiry({name:'Test',email:'n\u200bame@example.com',message:'A sample project request'}));
});
test('no network submission, inline JS or unsafe HTML sinks', () => {
  const html=fs.readFileSync('index.html','utf8');
  const js=fs.readFileSync('site.js','utf8');
  assert.match(html,/form-action 'none'/);
  assert.match(html,/<main id="main">/);
  assert.match(html,/role="status"/);
  assert.doesNotMatch(html,/<script(?![^>]*src=)[^>]*>/);
  assert.doesNotMatch(html,/<[a-z][^>]*\s+on[a-z]+\s*=/i);
  assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|sendBeacon|innerHTML|eval)\b/);
});
