import {templateText, sampleValues, mergeTemplate, validateValues, apiDraft, mappingCsv, variablesIn} from './merge.mjs';
// Browser-only demonstration. Never upload, persist or fetch user data.
const fields = document.querySelector('#fields');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const count = document.querySelector('#field-count');
const payload = document.querySelector('#payload');
const labels = {
  'Agreement.Number':'Agreement reference','Agreement.EffectiveDate':'Effective date',
  'Client.Company':'Client organization','Client.Address':'Client address',
  'Provider.Company':'Provider organization','Service.Description':'Service description',
  'Service.Deliverables':'Deliverables','Service.Fee':'Fee',
  'Service.PaymentDays':'Payment period (days)','Service.DeliveryDays':'Delivery period (business days)',
  'Service.ProgressReporting':'Progress reporting','Agreement.ContactEmail':'Sample contact email'
};
const entries = Object.entries(sampleValues);
const values = {...sampleValues};
for(const [key, example] of entries){
  const item = document.createElement('div'); item.className = 'field';
  const label = document.createElement('label'); label.htmlFor = 'fld_'+key; label.textContent = labels[key] || key;
  const hint = document.createElement('span'); hint.className = 'variable'; hint.textContent = `[${key}]`;
  const input = document.createElement('input'); input.id = 'fld_'+key; input.type = 'text';
  input.value = example; input.maxLength = 400; input.autocomplete = 'off';
  input.addEventListener('input', () => {values[key]=input.value; update();});
  item.append(label,hint,input); fields.appendChild(item);
}
count.textContent = `${variablesIn(templateText).length} mapped variables`;
function update(){
  const state = validateValues(templateText, values);
  status.textContent = state.valid ? 'Ready: all custom fields mapped.' : `Missing or invalid values: ${[...state.missing,...state.tooLong,...state.unexpected].join(', ')}`;
  status.className = state.valid ? 'status ok' : 'status alert';
  preview.textContent = state.valid ? mergeTemplate(templateText, values) : 'Complete all fields to generate a preview.';
  payload.textContent = state.valid ? JSON.stringify(apiDraft(values), null, 2) : 'Complete all fields to view sample API JSON.';
  for(const id of ['btn-json','btn-csv','btn-print']) document.getElementById(id).disabled=!state.valid;
}
function saveFile(name,content,type){
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a'); link.href=url; link.download=name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.querySelector('#btn-json').addEventListener('click',()=>saveFile('pandadoc_payload_SAMPLE.json',JSON.stringify(apiDraft(values),null,2),'application/json'));
document.querySelector('#btn-csv').addEventListener('click',()=>saveFile('variable_mapping_SAMPLE.csv',mappingCsv(values),'text/csv;charset=utf-8'));
document.querySelector('#btn-print').addEventListener('click',()=>window.print());
document.querySelector('#btn-reset').addEventListener('click',()=>{for(const [key,value] of entries){values[key]=value;document.getElementById('fld_'+key).value=value;}update();});
update();
