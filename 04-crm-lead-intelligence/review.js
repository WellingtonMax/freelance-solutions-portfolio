"use strict";
// Precomputed output from triage.py against sample.csv; no browser-side scoring.
const SAMPLE = Object.freeze({
  status:"prototype_no_outreach",auto_send:false,
  verification:"email syntax only; not deliverability or consent",
  source_sha256:"9984e1201217461b202e3d6c8abd70679142378386c76bb24da39aaeab67429f",
  leads:[
    {company:"Northstar Components",role:"Security Engineer",openings:3,email:"hiring@northstar.example",score:45,status:"requires_human_review"},
    {company:"Summit Logistics",role:"Operations Manager",openings:2,email:"hr@summit.example",score:20,status:"requires_human_review"}
  ],
  rejected:[{row:3,reason:"agency excluded"},{row:5,reason:"duplicate company"},{row:6,reason:"opted out"}]
});
function validateResult(data){
  if(!data || typeof data!=="object" || Array.isArray(data) || data.status!=="prototype_no_outreach" || data.auto_send!==false)throw Error("Unsupported review-only result");
  if(typeof data.verification!=="string" || data.verification.length>200 || !/^[a-f0-9]{64}$/.test(data.source_sha256))throw Error("Invalid source metadata");
  if(!Array.isArray(data.leads)||!Array.isArray(data.rejected)||data.leads.length>5000||data.rejected.length>5000)throw Error("Invalid record count");
  const str=(x,n=160)=>typeof x==="string"&&x.length>0&&x.length<=n;
  for(const lead of data.leads){
    if(!lead||!str(lead.company)||!str(lead.role)||!str(lead.email,254)||!Number.isInteger(lead.openings)||lead.openings<0||lead.openings>1000||!Number.isInteger(lead.score)||lead.score<0||lead.score>100||lead.status!=="requires_human_review")throw Error("Invalid candidate");
  }
  for(const item of data.rejected){
    if(!item||!Number.isInteger(item.row)||item.row<2||item.row>5001||!str(item.reason,200))throw Error("Invalid excluded row");
  }
  return data;
}
function element(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
}
function addLine(parent,label,value){
  const p=element("p");p.append(element("strong",null,label+": "),document.createTextNode(String(value)));parent.append(p);
}
function reasonLabel(reason){
  return ({"opted out":"Source flags opt-out; do not contact","agency excluded":"Source marks agency","company suppressed by another row":"Company-level suppression","duplicate company":"Duplicate candidate"})[reason]||"Input validation issue";
}
function render(data){
  validateResult(data);
  const queue=document.getElementById("queue"),rejections=document.getElementById("rejections"),source=document.getElementById("source");
  queue.replaceChildren();rejections.replaceChildren();source.replaceChildren();
  document.getElementById("candidate-count").textContent=String(data.leads.length);
  document.getElementById("rejected-count").textContent=String(data.rejected.length);
  if(!data.leads.length)queue.append(element("p",null,"No candidates available for review. Check rejected rows and source flags."));
  for(const lead of data.leads){
    const card=element("article","item");card.append(element("h3",null,lead.company),element("span","pill","Human review required"));
    addLine(card,"Role",lead.role);addLine(card,"Openings",lead.openings);addLine(card,"Heuristic score",lead.score+" / 75");
    queue.append(card);
  }
  if(!data.rejected.length)rejections.append(element("p",null,"No input rows were rejected."));
  for(const item of data.rejected){
    const card=element("article","item");card.append(element("h3",null,"Input row "+item.row));
    addLine(card,"Explanation",reasonLabel(item.reason));addLine(card,"Reported reason",item.reason);rejections.append(card);
  }
  for(const [label,value] of [["Mode",data.status],["Automatic sending",String(data.auto_send)],["Verification",data.verification],["Source SHA-256",data.source_sha256]]){
    const div=element("div");div.append(element("dt",null,label),element("dd",null,value));source.append(div);
  }
  document.getElementById("summary").hidden=false;
  document.getElementById("inspect").disabled=false;
  document.getElementById("feedback").textContent="Fictional sample loaded: "+data.leads.length+" candidates and "+data.rejected.length+" rejected input rows.";
}
if(typeof document!=="undefined"){
  document.getElementById("sample").addEventListener("click",()=>{
    try{render(SAMPLE)}catch(_){
      document.getElementById("summary").hidden=true;document.getElementById("inspect").disabled=true;
      document.getElementById("queue").replaceChildren(element("p",null,"Unable to display this sample."));
      document.getElementById("rejections").replaceChildren();
      document.getElementById("feedback").textContent="The sample is invalid or unsupported. Please reload the page.";
    }
  });
  document.getElementById("inspect").addEventListener("click",()=>document.getElementById("queue-heading").focus());
}
if(typeof module!=="undefined")module.exports={validateResult,reasonLabel,SAMPLE};