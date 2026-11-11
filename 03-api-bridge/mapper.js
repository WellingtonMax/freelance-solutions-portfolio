"use strict";
(function (root) {
  const MAX_CHARS = 50000, MAX_RECORDS = 200, MAX_FIELDS = 50;
  function formulaLike(value) {
    for (const char of value) {
      if (/\s/u.test(char) || /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\ufeff]/u.test(char)) continue;
      return "=+-@".includes(char);
    }
    return false;
  }
  function csvCell(value) {
    if (value == null) return "";
    let text = typeof value === "object" ? JSON.stringify(value) : String(value);
    text = text.replace(/[\r\n]/g, " ").trim();
    if (formulaLike(text)) text = "'" + text;
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function inspect(raw) {
    if (typeof raw !== "string" || raw.length > MAX_CHARS) throw Error("JSON exceeds the 50 KB character limit.");
    let records;
    try { records = JSON.parse(raw); } catch (_) { throw Error("Invalid JSON. Check commas, brackets and quotation marks."); }
    if (!Array.isArray(records) || records.length > MAX_RECORDS || records.some(r => !r || typeof r !== "object" || Array.isArray(r))) {
      throw Error("Provide an array of up to 200 JSON objects.");
    }
    const fields = [...new Set(records.flatMap(r => Object.keys(r)))].filter(k => /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(k));
    if (!fields.length || fields.length > MAX_FIELDS) throw Error("Provide 1–50 unique fields with safe column names.");
    return {records, fields};
  }
  function toCsv(records, fields) {
    if (!fields.length) throw Error("Choose at least one column.");
    return [fields.map(csvCell).join(","), ...records.map(r => fields.map(f => csvCell(r[f])).join(","))].join("\r\n") + "\r\n";
  }
  const api = {inspect, toCsv, csvCell, formulaLike};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root.document) return;
  const doc = root.document, input = doc.getElementById("json-input"), inspectButton = doc.getElementById("inspect"),
    previewButton = doc.getElementById("preview"), downloadButton = doc.getElementById("download"),
    fieldsEl = doc.getElementById("field-group"), feedback = doc.getElementById("feedback"),
    summary = doc.getElementById("summary"), output = doc.getElementById("csv-output");
  let snapshot = null, csv = "";
  function reset() {
    snapshot = null; csv = ""; previewButton.disabled = true; downloadButton.disabled = true;
    fieldsEl.replaceChildren(); output.textContent = "No preview yet."; summary.textContent = "";
  }
  input.addEventListener("input", () => {reset(); feedback.textContent = "JSON changed. Inspect fields again.";});
  inspectButton.addEventListener("click", () => {
    reset();
    try {
      snapshot = inspect(input.value);
      const legend = doc.createElement("legend"); legend.textContent = "Available fields"; fieldsEl.append(legend);
      for (const name of snapshot.fields) {
        const label = doc.createElement("label"), checkbox = doc.createElement("input");
        checkbox.type = "checkbox"; checkbox.value = name; checkbox.checked = true;
        label.append(checkbox, doc.createTextNode(" " + name)); fieldsEl.append(label);
      }
      previewButton.disabled = false; feedback.textContent = snapshot.records.length + " fictional records ready. Choose columns.";
    } catch (error) { feedback.textContent = error.message; }
  });
  fieldsEl.addEventListener("change", () => {csv = ""; downloadButton.disabled = true; output.textContent = "Columns changed. Preview again.";});
  previewButton.addEventListener("click", () => {
    if (!snapshot) return;
    const selected = Array.from(fieldsEl.querySelectorAll('input[type="checkbox"]:checked'), el => el.value);
    if (!selected.length) { feedback.textContent = "Choose at least one column."; downloadButton.disabled = true; return; }
    csv = toCsv(snapshot.records, selected);
    output.textContent = csv; summary.textContent = snapshot.records.length + " records · " + selected.length + " columns · offline CSV preview.";
    feedback.textContent = "CSV ready. Review before downloading."; downloadButton.disabled = false;
  });
  downloadButton.addEventListener("click", () => {
    if (!csv) return;
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob), anchor = doc.createElement("a");
    anchor.href = url; anchor.download = "api-bridge-fictional-export.csv"; anchor.click();
    URL.revokeObjectURL(url);
  });
})(typeof globalThis === "undefined" ? this : globalThis);
