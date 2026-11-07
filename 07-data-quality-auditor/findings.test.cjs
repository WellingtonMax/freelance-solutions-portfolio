"use strict";
const {test}=require("node:test");const assert=require("node:assert/strict");
const {SAMPLE,parseAudit,describe}=require("./findings.js");
test("fixture matches auditor output counts, with multiple findings on one position",()=>{
 const result=parseAudit(SAMPLE);assert.equal(result.rows,6);assert.equal(result.issue_count,4);assert.equal(result.affected,2);
 assert.deepEqual(result.issues.map(x=>x.row),[6,7,7,7]);
});
test("zero findings are not misrepresented",()=>{const clean={...SAMPLE,rows:1,issues:[],issue_count:0};assert.equal(parseAudit(clean).affected,0);});
test("malformed results are rejected",()=>{
 for(const bad of [null,{}, {...SAMPLE,issues:null},{...SAMPLE,issue_count:3},{...SAMPLE,rows:-1},
 {...SAMPLE,issues:[{row:2,code:"<img>"}],issue_count:1},{...SAMPLE,input_sha256:"no"}]){
 assert.throws(()=>parseAudit(bad));}
});
test("unknown code uses inert fallback text",()=>{assert.equal(describe("FUTURE_CODE")[0],"Unrecognized finding");});
