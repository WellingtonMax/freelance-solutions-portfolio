"use strict";
const source = document.getElementById("source");
const sampleButton = document.getElementById("sample");
const resultHeading = document.getElementById("result-heading");
let sampleSelected = false;
let selectionVersion = 0;
const feedback = document.getElementById("feedback");
const result = document.getElementById("result");
const run = document.getElementById("run");
const clean = document.getElementById("clean");
const reject = document.getElementById("reject");
const totals = document.getElementById("totals");
const copyClean = document.getElementById("copy-clean");
const copyReject = document.getElementById("copy-reject");
const copyFeedback = document.getElementById("copy-feedback");
let previewVersion = 0;

function resetPreview() {
  previewVersion++;
  // A new selection cancels the old read and must restore the action immediately.
  run.disabled = false;
  copyClean.disabled = true;
  copyReject.disabled = true;
  copyFeedback.textContent = "Copy an output to use it locally. If copying is unavailable, select the CSV text manually.";
  result.hidden = true;
  clean.value = "";
  reject.value = "";
  totals.textContent = "";
}
function selectedFile() {
  return source.files && source.files[0];
}
source.addEventListener("change", () => {
  selectionVersion++;
  sampleSelected = false;
  resetPreview();
  const file = selectedFile();
  feedback.textContent = file
    ? "CSV file selected. Ready to process locally."
    : "Choose a fictional CSV file to preview locally.";
});
sampleButton.addEventListener("click", () => {
  selectionVersion++;
  sampleSelected = true;
  source.value = "";
  resetPreview();
  feedback.textContent = "Fictional sample.csv selected. Select Validate CSV in this browser to continue.";
});
run.addEventListener("click", async () => {
  resetPreview();
  const file = sampleSelected ? null : selectedFile();
  const usingSample = sampleSelected;
  const version = selectionVersion;
  if (!usingSample && !file) {
    feedback.textContent = "Choose a CSV file before processing.";
    source.focus();
    return;
  }
  if (file && file.size > CsvRescuePreview.MAX_BYTES) {
    feedback.textContent = "File exceeds the 1 MB local preview limit. Choose a smaller file.";
    return;
  }
  run.disabled = true;
  const processingVersion = previewVersion;
  feedback.textContent = "Processing in this browser tab…";
  try {
    const text = usingSample ? ExcelRescueSample : await file.text();
    // Selection can change while the file is being read: never show stale output.
    if (version !== selectionVersion) return;
    const output = CsvRescuePreview.process(text);
    if (!usingSample && selectedFile() !== file) return;
    clean.value = output.cleanCsv;
    reject.value = output.rejectCsv;
    totals.textContent = output.sourceRows + " input rows · " + output.accepted.length + " accepted · " + output.rejected.length + " rejected";
    result.hidden = false;
    copyClean.disabled = output.accepted.length === 0;
    copyReject.disabled = output.rejected.length === 0;
    copyFeedback.textContent = output.accepted.length === 0 && output.rejected.length === 0
      ? "No records available to copy. Review the input CSV."
      : output.accepted.length === 0
        ? "No accepted records to copy. Review the rejected CSV."
        : output.rejected.length === 0
          ? "No rejected records to copy. All accepted records are available above."
          : "Accepted and rejected CSV outputs are ready to copy.";
    resultHeading.focus();
    feedback.textContent = output.accepted.length === 0
      ? "Preview complete: no records accepted. Review rejection reasons."
      : "Preview complete: " + output.accepted.length + " accepted, " + output.rejected.length + " rejected. No data was transmitted.";
  } catch (error) {
    if (version === selectionVersion) {
      feedback.textContent = "Unable to read or validate this CSV. Check UTF-8 encoding and required headers, then try again. Your file was not uploaded.";
    }
  } finally {
    // An older read must not unlock a newer processing operation.
    if (processingVersion === previewVersion) run.disabled = false;
  }
});

// Clipboard access may be blocked for file:// or insecure origins. Never claim success on failure.
async function copyOutput(textarea, button, label) {
  if (button.disabled || result.hidden || !textarea.value) return;
  const version = previewVersion;
  const value = textarea.value;
  // Avoid duplicate clipboard writes while an earlier permission prompt is pending.
  button.disabled = true;
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    copyFeedback.textContent = "Clipboard access is unavailable. Select and copy the " + label + " CSV manually.";
    textarea.focus();
    textarea.select();
    if (version === previewVersion) button.disabled = false;
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    if (version !== previewVersion || textarea.value !== value) return;
    copyFeedback.textContent = label + " CSV copied to clipboard.";
  } catch (_error) {
    if (version !== previewVersion || textarea.value !== value) return;
    copyFeedback.textContent = "Clipboard permission denied. Select and copy the " + label + " CSV manually.";
    textarea.focus();
    textarea.select();
  } finally {
    // A selection change owns the new disabled state; stale copies cannot override it.
    if (version === previewVersion) button.disabled = false;
  }
}
copyClean.addEventListener("click", () => copyOutput(clean, copyClean, "Accepted"));
copyReject.addEventListener("click", () => copyOutput(reject, copyReject, "Rejected"));
