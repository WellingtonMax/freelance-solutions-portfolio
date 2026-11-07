"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {process,csvParse,formula,MAX_BYTES} = require("./try.js");
const fs = require("node:fs");
const path = require("node:path");
const sample = fs.readFileSync(path.join(__dirname,"sample.csv"),"utf8");
test("synthetic sample reconciles with Python example",()=>{
 const x=process(sample);
 assert.equal(x.sourceRows,4); assert.equal(x.accepted.length,1); assert.equal(x.rejected.length,3);
 assert.equal(x.accepted[0].email,"bob@example.com");
 assert.deepEqual(x.rejected.map(r=>r.line),[2,4,5]);
});
test("RFC-style quoted commas and doubled quotes",()=>{
 const rows=csvParse('name,email,signup_date,city\r\n"A, ""B""",a@b.com,2026-11-05,"City, X"\r\n');
 assert.equal(rows[1][0],'A, "B"');assert.equal(rows[1][3],"City, X");
});
test("reject malformed quote, duplicate headers and surplus fields",()=>{
 for(const csv of ['name,email,signup_date,city\n"bad,x@y.com,2026-01-01,Z',
 'name,email,email,city\nA,a@b.com,b@c.com,X',
 'name,email,signup_date,city\nA,a@b.com,2026-01-01,X,extra']) assert.throws(()=>process(csv));
});
test("reject oversized and excessive rows",()=>{
 assert.throws(()=>process("x".repeat(MAX_BYTES+1)));
 assert.throws(()=>process("name,email,signup_date,city\n"+"A,a@b.com,,X\n".repeat(2001)));
});
test("reject formula email with invisible prefix; escape name",()=>{
 assert.equal(formula("\u200b\t=HYPERLINK(1)"),true);
 const x=process("name,email,signup_date,city\n=1+1,a@b.com,2026-11-05,X\nA,\u200b =bad@x.com,2026-11-05,X");
 assert.equal(x.accepted[0].name,"'=1+1"); assert.equal(x.rejected.length,1);
});
test("reject impossible calendar date and non-ISO ambiguous format",()=>{
 const x=process("name,email,signup_date,city\nA,a@b.com,2026-02-30,X\nB,b@b.com,11/05/2026,X\nC,c@b.com,05-11-2026,X");
 assert.equal(x.accepted.length,1);assert.equal(x.accepted[0].signup_date,"2026-05-11");assert.equal(x.rejected.length,2);
});
test("do not interpret untrusted content as HTML",()=>{
 const x=process('name,email,signup_date,city\n"<img src=x onerror=alert(1)>",a@b.com,2026-11-05,X');
 assert.match(x.cleanCsv,/<img/);
 const html=fs.readFileSync(path.join(__dirname,"try.html"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"try-ui.js"),"utf8");
 assert.match(html,/connect-src 'none'/);assert.doesNotMatch(ui,/innerHTML|eval\(|fetch\(|document\.write/);
 assert.match(ui,/\.value = output\.cleanCsv/);
});

test("audit filter keyboard navigation updates rows, focus and accessible status",()=>{
 const vm=require("node:vm");
 const buttons=["all","accepted","rejected"].map(view=>{
  const handlers={};
  return {dataset:{view},handlers,attributes:{},addEventListener(type,fn){handlers[type]=fn;},
   setAttribute(name,value){this.attributes[name]=value;},focus(){this.focused=true;}};
 });
 const rows=["rejected","accepted","rejected","rejected"].map(status=>({dataset:{status},hidden:false}));
 const status={textContent:"Showing all 4 records."};
 const document={querySelectorAll(selector){
  if(selector==="button[data-view]")return buttons;
  if(selector==="#audit tr")return rows;
  throw new Error("Unexpected selector");
 },getElementById(id){assert.equal(id,"filter-status");return status;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,"demo.js"),"utf8"),{document});
 function key(index,name){
  let prevented=false;
  buttons[index].handlers.keydown({key:name,preventDefault(){prevented=true;}});
  return prevented;
 }
 assert.equal(key(0,"ArrowRight"),true);
 assert.equal(buttons[1].focused,true);
 assert.equal(buttons[1].attributes["aria-pressed"],"true");
 assert.deepEqual(rows.map(row=>row.hidden),[true,false,true,true]);
 assert.equal(status.textContent,"Showing 1 accepted record.");
 assert.equal(key(1,"End"),true);
 assert.equal(status.textContent,"Showing 3 rejected records.");
 assert.equal(key(2,"ArrowRight"),true);
 assert.equal(status.textContent,"Showing 4 sample records.");
 assert.equal(key(0,"Tab"),false);
 buttons[2].handlers.click();
 assert.equal(status.textContent,"Showing 3 rejected records.");
});
