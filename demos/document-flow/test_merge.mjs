import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateText, sampleValues, variablesIn, validateValues, mergeTemplate, apiDraft, mappingCsv} from './merge.mjs';
test('template matches source text',()=>assert.equal(templateText+'\n',readFileSync(new URL('template.txt', import.meta.url),'utf8')));
test('twelve unique fields match sample JSON',()=>{
  assert.equal(variablesIn(templateText).length,12);
  assert.deepEqual(sampleValues,JSON.parse(readFileSync(new URL('sample_values.json',import.meta.url),'utf8')));
  assert.ok(validateValues(templateText,sampleValues).valid);
});
test('merge replaces all tokens and preserves approved terms',()=>{
  const out=mergeTemplate(templateText,sampleValues);
  assert.ok(out.includes('Payment is due within 15 days'));
  assert.ok(out.includes('weekly email update'));
  assert.ok(!/\[[A-Za-z][A-Za-z0-9_.]*\]/.test(out));
});
test('invalid fields fail closed',()=>{
  const tests=[{'Client.Company':''},{'Client.Company':' '},{'Client.Company':'x'.repeat(401)}];
  for(const patch of tests) assert.throws(()=>mergeTemplate(templateText,{...sampleValues,...patch}));
  const missing={...sampleValues};delete missing['Client.Company'];assert.throws(()=>mergeTemplate(templateText,missing));
  assert.throws(()=>mergeTemplate(templateText,{...sampleValues,'Extra.Bad':'X'}));
});
test('markup is never evaluated by template engine',()=>{
  assert.ok(mergeTemplate(templateText,{...sampleValues,'Client.Company':'<script>alert(1)</script>'}).includes('<script>alert(1)</script>'));
});
test('request structure has twelve unbracketed tokens and fake UUID',()=>{
  const p=apiDraft(sampleValues);
  assert.equal(p.tokens.length,12);
  assert.ok(p.tokens.every(t=>!t.name.includes('[')));
  assert.equal(p.template_uuid,'REPLACE_WITH_REAL_PANDADOC_TEMPLATE_UUID');
});
test('CSV values escape quotes, commas and newlines',()=>{
  const csv=mappingCsv({...sampleValues,'Client.Company':'Acme," Inc\nLLC'});
  assert.ok(csv.includes('"Acme,"" Inc\nLLC"'));
});
