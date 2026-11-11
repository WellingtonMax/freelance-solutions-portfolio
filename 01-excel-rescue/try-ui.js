"use strict";
const source = document.getElementById("source");
const feedback = document.getElementById("feedback");
const result = document.getElementById("result");
const run = document.getElementById("run");
const clean = document.getElementById("clean");
const reject = document.getElementById("reject");
const totals = document.getElementById("totals");

function resetPreview() {
  result.hidden = true;
  clean.value = "";
  reject.value = "";
  totals.textContent = "";
}
function selectedFile() {
  return source.files && source.files[0];
}
source.addEventListener("change", () => {
  resetPreview();
  const file = selectedFile();
  feedback.textContent = file
    ? "Selected: " + file.name + ". Ready to process locally."
    : "Choose a fictional CSV file to preview locally.";
});
run.addEventListener("click", async () => {
  resetPreview();
  const file = selectedFile();
  if (!file) {
    feedback.textContent = "Choose a CSV file before processing.";
    source.focus();
    return;
  }
  if (file.size > CsvRescuePreview.MAX_BYTES) {
    feedback.textContent = "File exceeds the 1 MB local preview limit. Choose a smaller file.";
    return;
  }
  run.disabled = true;
  feedback.setAttribute("aria-busy", "true");
  feedback.textContent = "Processing in this browser tab…";
  try {
    const text = await file.text();
    // Selection can change while the file is being read: never show stale output.
    if (selectedFile() !== file) return;
    const output = CsvRescuePreview.process(text);
    if (selectedFile() !== file) return;
    clean.value = output.cleanCsv;
    reject.value = output.rejectCsv;
    totals.textContent = output.sourceRows + " input rows · " + output.accepted.length + " accepted · " + output.rejected.length + " rejected";
    result.hidden = false;
    feedback.textContent = output.accepted.length === 0
      ? "Preview complete: no records accepted. Review rejection reasons."
      : "Preview complete: " + output.accepted.length + " accepted, " + output.rejected.length + " rejected. No data was transmitted.";
  } catch (error) {
    if (selectedFile() === file) {
      feedback.textContent = "Unable to process: " + (error && typeof error.message === "string" ? error.message : "invalid input") + ". Your file was not uploaded.";
    }
  } finally {
    feedback.setAttribute("aria-busy", "false");
    run.disabled = false;
  }
});
