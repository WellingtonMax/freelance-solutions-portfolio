export const projects = Object.freeze({
  excel: ['Excel Rescue', '01-excel-rescue/try.html'],
  sales: ['Sales Intelligence', '02-sales-intelligence/sample-explorer.html'],
  api: ['API Bridge', '03-api-bridge/mapper.html'],
  crm: ['CRM Lead Intelligence', '04-crm-lead-intelligence/demo-ui.html'],
  landing: ['Landing Page Studio', '05-landing-page-studio/index.html'],
  quote: ['Document Factory', '06-document-factory/demo-ui.html'],
  quality: ['Data Quality Auditor', '07-data-quality-auditor/demo-ui.html'],
  changes: ['Site Change Monitor', '08-site-change-monitor/demo-ui.html'],
  docflow: ['Document Flow', 'demos/document-flow/index.html'],
  paw: ['PawLedger', 'demos/vet-loyalty/index.html'],
});
export const metricLabels = Object.freeze({
  excel: { accepted: 'Accepted', rejected: 'Rejected' },
  sales: { orders: 'Orders', revenue: 'Revenue (USD)' },
  api: { records: 'Records', columns: 'Columns' },
  crm: { reviewed: 'Reviewable', visible: 'Visible', suppressed: 'Suppressed' },
  landing: { valid: 'Validated forms' },
  quote: { quantity: 'Quantity', subtotal: 'Subtotal (USD)', total: 'Total (USD)' },
  quality: { rows: 'Records', flagged: 'Flagged', findings: 'Findings' },
  changes: { added: 'Added', removed: 'Removed', unchanged: 'Unchanged' },
  docflow: { fields: 'Mapped fields' },
  paw: { members: 'Members', transactions: 'Transactions' },
});
