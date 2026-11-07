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
  selectionVersion++;
  sampleSelected = false;
  resetPreview();
  const file = selectedFile();
  feedback.textContent = file
    ? "Selected: " + file.name + ". Ready to process locally."
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
  feedback.textContent = "Processing in this browser tab…";
  try {
    const text = usingSample ? ExcelRescueSample : await file.text();
    // Selection can change while the file is being read: never show stale output.
    if (version !== selectionVersion) return;
    const output = CsvRescuePreview.process(text);
    if (selectedFile() !== file) return;
    clean.value = output.cleanCsv;
    reject.value = output.rejectCsv;
    totals.textContent = output.sourceRows + " input rows · " + output.accepted.length + " accepted · " + output.rejected.length + " rejected";
    result.hidden = false;
    resultHeading.focus();
    feedback.textContent = output.accepted.length === 0
      ? "Preview complete: no records accepted. Review rejection reasons."
      : "Preview complete: " + output.accepted.length + " accepted, " + output.rejected.length + " rejected. No data was transmitted.";
  } catch (error) {
    if (version === selectionVersion) {
      feedback.textContent = "Unable to process: " + (error && typeof error.message === "string" ? error.message : "invalid input") + ". Your file was not uploaded.";
    }
  } finally {
    run.disabled = false;
  }
});
