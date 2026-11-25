export function parseCsv(text) {
  if (typeof text !== 'string' || text.length > 50000) throw Error('Use no more than 50,000 characters.');
  text = text.replace(/^\uFEFF/, '');
  const table = [];
  let row = [], cell = '', mode = 'plain';
  const nextCell = () => { row.push(cell.trim()); cell = ''; mode = 'plain'; };
  const nextRow = () => {
    nextCell(); table.push(row); row = [];
    if (table.length > 201) throw Error('Use no more than 200 data rows.');
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (mode === 'quoted') {
      if (char !== '"') cell += char;
      else if (text[i+1] === '"') { cell += '"'; i++; }
      else mode = 'closed';
    } else if (char === ',') nextCell();
    else if (char === '\n' || char === '\r') {
      nextRow();
      if (char === '\r' && text[i+1] === '\n') i++;
    } else if (mode === 'closed') throw Error('Unexpected character after a quoted cell.');
    else if (char === '"') {
      if (cell.length) throw Error('Unexpected quote inside an unquoted cell.');
      mode = 'quoted';
    } else cell += char;
  }
  if (mode === 'quoted') throw Error('A CSV quote was left open.');
  if (row.length || cell || mode === 'closed') nextRow();
  if (!table.length || table[0].length !== 3 || table[0].join(',') !== 'id,category,amount') throw Error('The header must be exactly id,category,amount.');
  if (table.length < 2) throw Error('Add at least one catalog row.');
  return table.slice(1).map((row, dataIndex) => {
    if (row.length !== 3) throw Error(`Record ${dataIndex + 1} must contain exactly three columns.`);
    return row;
  });
}
export function audit(text) {
  const rows = parseCsv(text);
  const counts = new Map();
  for (const [id] of rows) if (id) counts.set(id, (counts.get(id) || 0) + 1);
  const findings = [];
  rows.forEach(([id, category, amount], i) => {
    const flag = rule => findings.push({ row: i+1, rule });
    if (!id) flag('Missing ID');
    else if (counts.get(id) > 1) flag('Duplicate ID');
    if (!category) flag('Missing category');
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount))) flag('Invalid amount');
  });
  return { rows: rows.length, flagged: new Set(findings.map(f => f.row)).size, findings };
}
