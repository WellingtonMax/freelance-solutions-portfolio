/** Offline merge: no network, storage, or credentials. */
export const sampleValues = Object.freeze({
  'Agreement.Number': 'DEMO-2026-041',
  'Agreement.EffectiveDate': 'November 16, 2026',
  'Client.Company': 'Northstar Labs LLC',
  'Client.Address': '102 Example Avenue, Suite 4, Sample City',
  'Provider.Company': 'Evergreen Studio Co.',
  'Service.Description': 'Website content audit, structured recommendations, and a concise implementation checklist',
  'Service.Deliverables': 'A written audit, a prioritized recommendations table, and one review meeting',
  'Service.Fee': 'USD 1,200',
  'Service.PaymentDays': '15',
  'Service.DeliveryDays': '10',
  'Service.ProgressReporting': 'A weekly email update and a final handoff summary',
  'Agreement.ContactEmail': 'projects@example.com'
});
export const templateText = `SERVICE ENGAGEMENT — DOCUMENT AUTOMATION DEMO
Reference: [Agreement.Number] | Effective date: [Agreement.EffectiveDate]

PARTIES
This non-binding sample records a fictional service engagement between [Provider.Company] (the provider) and [Client.Company], located at [Client.Address] (the client).

SCOPE
[Service.Description]

DELIVERABLES
[Service.Deliverables]

FEES AND PAYMENT
The fictional fixed fee is [Service.Fee]. Payment is due within [Service.PaymentDays] days of invoice receipt, subject to approval of the agreed deliverables.

DELIVERY AND UPDATES
The estimated delivery window is [Service.DeliveryDays] business days after approved inputs are provided. Progress reporting: [Service.ProgressReporting].

COORDINATION
The demonstration contact address is [Agreement.ContactEmail].

SIGNATURES
A real PandaDoc implementation must add a native signature field assigned to an authorized recipient role. This line is an informational placeholder, not an interactive e-signature field.

DEMONSTRATION ONLY — SYNTHETIC DATA, NON-BINDING SAMPLE, NOT LEGAL ADVICE.`;

const TOKEN = /\[([A-Za-z][A-Za-z0-9_.]*)\]/g;
export function variablesIn(template) {
  return [...new Set([...template.matchAll(TOKEN)].map(match => match[1]))];
}
export function validateValues(template, values) {
  const names = variablesIn(template);
  const missing = names.filter(name => !Object.hasOwn(values, name) || typeof values[name] !== 'string' || !values[name].trim());
  const unexpected = Object.keys(values).filter(name => !names.includes(name));
  const tooLong = names.filter(name => Object.hasOwn(values,name) && String(values[name]).length > 400);
  return { names, missing, unexpected, tooLong, valid: !missing.length && !unexpected.length && !tooLong.length };
}
export function mergeTemplate(template, values) {
  const result = validateValues(template, values);
  if (!result.valid) throw new Error(`Invalid field set (missing: ${result.missing.join(', ') || 'none'}; unexpected: ${result.unexpected.join(', ') || 'none'}; too long: ${result.tooLong.join(', ') || 'none'})`);
  return template.replace(TOKEN, (_, name) => values[name]);
}
export function apiDraft(values, templateUUID='REPLACE_WITH_REAL_PANDADOC_TEMPLATE_UUID') {
  const {valid} = validateValues(templateText, values);
  if (!valid) throw new Error('Complete all mapped fields before generating a payload.');
  return {
    name: `Service Engagement — ${values['Client.Company']} — ${values['Agreement.Number']}`,
    template_uuid: templateUUID,
    recipients: [{email: 'signer@example.com', first_name: 'Alex', last_name: 'Rivera', role: 'Client Signer'}],
    tokens: variablesIn(templateText).map(name => ({name, value: values[name]})),
    metadata: {sample: 'fictional-demo'}
  };
}
export function mappingCsv(values) {
  const escapeCSV = value => `"${String(value).replaceAll('"','""')}"`;
  return [['Placeholder','API token name','Example value'], ...variablesIn(templateText).map(name => [`[${name}]`,name,values[name]])]
    .map(row => row.map(escapeCSV).join(',')).join('\r\n')+'\r\n';
}
