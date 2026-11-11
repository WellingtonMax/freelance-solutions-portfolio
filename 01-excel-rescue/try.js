"use strict";
/* Offline, bounded CSV preview. Synthetic demonstration, not a Python-equivalent engine. */
(function (root) {
  const FIELDS = ["name", "email", "signup_date", "city"];
  const MAX_BYTES = 1000000, MAX_ROWS = 2000, MAX_CELL = 2048;
  function csvParse(text) {
    if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_BYTES) throw Error("CSV exceeds 1 MB");
    text = text.replace(/^\uFEFF/, "");
    const rows = []; let row = [], cell = "", quoted = false, afterQuote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i+1] === '"') { cell += '"'; i++; }
          else { quoted = false; afterQuote = true; }
        } else cell += c;
      } else if (afterQuote) {
        if (c === ",") { row.push(cell); cell = ""; afterQuote = false; }
        else if (c === "\r" || c === "\n") {
          row.push(cell); rows.push(row); row = []; cell = ""; afterQuote = false;
          if (c === "\r" && text[i+1] === "\n") i++;
        } else throw Error("Unexpected characters after closing quote");
      } else if (c === '"') {
        if (cell) throw Error("Unexpected quote inside unquoted cell");
        quoted = true;
      } else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\r" || c === "\n") {
        row.push(cell); rows.push(row); row = []; cell = "";
        if (c === "\r" && text[i+1] === "\n") i++;
      } else cell += c;
      if (cell.length > MAX_CELL) throw Error("Cell exceeds 2,048 characters");
      if (rows.length > MAX_ROWS + 1) throw Error("Too many CSV rows");
    }
    if (quoted) throw Error("Unclosed CSV quote");
    if (cell || row.length || afterQuote) { row.push(cell); rows.push(row); }
    if (!rows.length) throw Error("Empty CSV");
    if (rows.some(r => r.length !== 4 || r.some(v => v.length > MAX_CELL))) throw Error("Malformed row or wrong column count");
    if (rows.length - 1 > MAX_ROWS) throw Error("Too many CSV rows");
    if (new Set(rows[0]).size !== 4 || FIELDS.some(f => !rows[0].includes(f))) throw Error("CSV must have exactly four unique expected headers");
    return rows;
  }
  function formula(s) {
    for (const c of s) {
      if (/\s/u.test(c) || /[\u0000-\u001F\u007F\u200B-\u200F\u2060\uFEFF]/u.test(c)) continue;
      return "=+-@".includes(c);
    }
    return false;
  }
  // Match Python str.split() whitespace rules: do not strip Unicode format chars (Cf).
  const PY_SPACE = /[\u0009-\u000D\u001C-\u001F\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/gu;
  function safeText(s) {
    s = s.split(PY_SPACE).filter(Boolean).join(" ");
    return formula(s) ? "'" + s : s;
  }
  function date(s) {
    if (!s.trim()) return "";
    let y, m, d;
    let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if (match) [, y, m, d] = match;
    else {
      match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
      if (!match) throw Error("invalid date (requires ISO or DD/MM/YYYY)");
      [, d, m, y] = match;
    }
    const n = [Number(y), Number(m), Number(d)];
    const dt = new Date(Date.UTC(n[0], n[1]-1, n[2]));
    if (n[0] < 100 || dt.getUTCFullYear() !== n[0] || dt.getUTCMonth()+1 !== n[1] || dt.getUTCDate() !== n[2]) throw Error("invalid date (requires ISO or DD/MM/YYYY)");
    return [y,m,d].join("-");
  }
  function csvEscape(s) {
    s = String(s);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvOutput(rows, headers) {
    return [headers, ...rows.map(r => headers.map(h => r[h]))].map(r => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";
  }
  function process(text) {
    const [header, ...rows] = csvParse(text);
    const valid = [], rejected = [];
    rows.forEach((cells, index) => {
      const input = Object.fromEntries(header.map((h,i) => [h,cells[i]]));
      try {
        const email = input.email.trim().toLowerCase();
        if (formula(email)) throw Error("unsafe email prefix for spreadsheet export");
        if (email.length > 320 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw Error("invalid email");
        const name = safeText(input.name);
        if (!name) throw Error("missing name");
        valid.push({line:index+2, record:{name,email,signup_date:date(input.signup_date),city:safeText(input.city)}});
      } catch (error) { rejected.push({line:index+2,reason:error.message}); }
    });
    const counts = new Map();
    for (const {record} of valid) counts.set(record.email,(counts.get(record.email)||0)+1);
    const accepted = [];
    for (const {line,record} of valid) {
      if (counts.get(record.email)>1) rejected.push({line,reason:"duplicate email (all occurrences rejected)"});
      else accepted.push(record);
    }
    rejected.sort((a,b)=>a.line-b.line);
    return {accepted,rejected,cleanCsv:csvOutput(accepted,FIELDS),rejectCsv:csvOutput(rejected,["line","reason"]),sourceRows:rows.length};
  }
  const api = {process,csvParse,formula,MAX_BYTES,MAX_ROWS};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CsvRescuePreview = api;
})(typeof window !== "undefined" ? window : globalThis);
