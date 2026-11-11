"use strict";
// Derived from 07-data-quality-auditor/sample.csv using audit.py; fictional data only.
const SAMPLE = Object.freeze({status:"prototype",rows:6,issue_count:4,
input_sha256:"239f0591e4b902c45ee829e57a03bf225998e319877fd585d29a4883f3dc8f45",
issues:[{row:6,code:"HIGH_AMOUNT_OUTLIER"},{row:7,code:"DUPLICATE_ID"},{row:7,code:"INVALID_AMOUNT"},{row:7,code:"INVALID_DATE"}]});
const COPY = Object.freeze({
SCHEMA_COLUMNS:["Column count mismatch","Check missing or extra values in this record"],
INVALID_ID:["Invalid record ID","Check the permitted ID format"],
DUPLICATE_ID:["Duplicate record ID","Check whether the record was imported twice"],
INVALID_CATEGORY:["Invalid category","Provide a nonempty category without control characters"],
INVALID_AMOUNT:["Invalid amount","Use a nonnegative amount with exactly two decimals"],
INVALID_DATE:["Invalid date","Use a real date in YYYY-MM-DD format"],
HIGH_AMOUNT_OUTLIER:["Unusually high amount","Review against the median-based heuristic; not proof of fraud"]
});
function parseAudit(data) {
 if(!data || typeof data!=="object" || Array.isArray(data) || data.status!=="prototype" ||
 !Number.isSafeInteger(data.rows) || data.rows<0 || data.rows>10000 ||
 !Array.isArray(data.issues) || data.issues.length>70000 ||
 !Number.isSafeInteger(data.issue_count) || data.issue_count!==data.issues.length ||
 typeof data.input_sha256!=="string" || !/^[a-f0-9]{64}$/.test(data.input_sha256)) throw new Error("Invalid audit result");
 const issues=data.issues.map(item=>{
 if(!item || typeof item!=="object" || !Number.isSafeInteger(item.row) || item.row<2 || item.row>data.rows+1 ||
 typeof item.code!=="string" || item.code.length>80 || !/^[A-Z0-9_]+$/.test(item.code)) throw new Error("Invalid finding");
 return {row:item.row,code:item.code};
 });
 return {rows:data.rows,issues,issue_count:issues.length,affected:new Set(issues.map(x=>x.row)).size,fingerprint:data.input_sha256};
}
function describe(code){return Object.prototype.hasOwnProperty.call(COPY,code)?COPY[code]:["Unrecognized finding","Review the auditor documentation for this issue code"];}
function init(doc,raw=SAMPLE){
 const records=doc.getElementById("records"),findings=doc.getElementById("findings"),affected=doc.getElementById("affected");
 const filter=doc.getElementById("filter"),status=doc.getElementById("status"),rows=doc.getElementById("rows");
 let result;
 try{result=parseAudit(raw);}catch(_error){status.textContent="Unable to display this audit result. Rerun the local auditor.";return false;}
 records.textContent=String(result.rows);findings.textContent=String(result.issue_count);affected.textContent=String(result.affected);
 doc.getElementById("fingerprint").textContent=result.fingerprint;
 const codes=[...new Set(result.issues.map(x=>x.code))].sort();
 for(const code of codes){const opt=doc.createElement("option");opt.value=code;opt.textContent=describe(code)[0]+" ("+code+")";filter.appendChild(opt);}
 function render(){
 const selected=filter.value;const visible=result.issues.filter(x=>selected==="ALL"||x.code===selected);
 rows.replaceChildren();
 for(const item of visible){const tr=doc.createElement("tr");const info=describe(item.code);
 for(const content of [String(item.row),info[0]+" ("+item.code+")",info[1]]){const td=doc.createElement("td");td.textContent=content;tr.appendChild(td);}rows.appendChild(tr);}
 if(!visible.length){const tr=doc.createElement("tr"),td=doc.createElement("td");td.colSpan=3;td.textContent=result.issue_count===0?"No issues detected by these checks.":"No findings match this filter.";tr.appendChild(td);rows.appendChild(tr);}
 status.textContent=visible.length+" of "+result.issue_count+" findings shown.";
 }
 filter.addEventListener("change",render);
 doc.getElementById("reset").addEventListener("click",()=>{filter.value="ALL";render();filter.focus();});
 render();return true;
}
if(typeof module!=="undefined"&&module.exports)module.exports={SAMPLE,parseAudit,describe,init};
if(typeof document!=="undefined")init(document);