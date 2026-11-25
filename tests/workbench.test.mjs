import test from 'node:test';
import assert from 'node:assert/strict';
import { audit } from '../07-data-quality-auditor/catalog-audit.mjs';
import { diff } from '../08-site-change-monitor/line-diff.mjs';
import { metricLabels, projects } from '../assets/workbench/catalog.mjs';
import { saveRun, listRuns, removeRun } from '../assets/workbench/db.mjs';

test('catalog audit handles quoted commas, duplicate IDs, empty amounts and BOM', () => {
  const input = '\ufeffid,category,amount\r\n001,"Tools, large",1.25\r\n001,,\r\n003,"multi\nline",0';
  assert.deepEqual(audit(input), {
    rows: 3, flagged: 2, findings: [
      {row:1, rule:'Duplicate ID'}, {row:2, rule:'Duplicate ID'},
      {row:2, rule:'Missing category'}, {row:2, rule:'Invalid amount'},
    ],
  });
  for (const bad of ['id,amount,category\n1,2,x','id,category,amount\n001,"bad,100',
    'id,category,amount\n1,x,0,y', 'id,category,amount\n' + '1,x,0\n'.repeat(201)])
    assert.throws(() => audit(bad));
});
test('text diff accounts for duplicate lines and reports exact positions', () => {
  assert.deepEqual(diff('same\r\nrepeated\r\nrepeated\r\n', 'same\nnew\nrepeated\n'),{
    counts:{added:1,removed:1,unchanged:2}, changes:[
      {kind:'unchanged',old:1,new:1,text:'same'},
      {kind:'removed',old:2,text:'repeated'}, {kind:'added',new:2,text:'new'},
      {kind:'unchanged',old:3,new:3,text:'repeated'},
    ]
  });
  assert.deepEqual(diff('', 'one').counts, {added:1,removed:0,unchanged:0});
  assert.throws(() => diff('x\n'.repeat(201), ''));
});
test('only catalogued numeric summaries can reach storage', () => {
  assert.deepEqual(Object.keys(metricLabels),Object.keys(projects));
  assert.throws(() => saveRun('x',{}), /Unknown project/);
  assert.throws(() => saveRun('excel',{accepted:1,rejected:0,name:'private'}), /Invalid run summary/);
  assert.throws(() => saveRun('sales',{orders:1,revenue:-1}), /Invalid run summary/);
  assert.throws(() => saveRun('landing',{valid:Infinity}), /Invalid run summary/);
  assert.throws(() => listRuns('__proto__'), /Unknown project/);
  assert.throws(() => removeRun('1'), /Invalid history entry/);
});
