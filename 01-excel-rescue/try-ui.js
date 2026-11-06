"use strict";
const source = document.getElementById("source");
const feedback = document.getElementById("feedback");
const result = document.getElementById("result");
document.getElementById("run").addEventListener("click", async () => {
  result.hidden = true;
  document.getElementById("clean").value = "";
  document.getElementById("reject").value = "";
  const file = source.files && source.files[0];
  if (!file) { feedback.textContent = "Choose a CSV file first."; return; }
  if (file.size > CsvRescuePreview.MAX_BYTES) { feedback.textContent = "Rejected: file exceeds 1 MB."; return; }
  try {
    const text = await file.text();
    const output = CsvRescuePreview.process(text);
    document.getElementById("clean").value = output.cleanCsv;
    document.getElementById("reject").value = output.rejectCsv;
    document.getElementById("totals").textContent = output.sourceRows + " input rows · " + output.accepted.length + " accepted · " + output.rejected.length + " rejected";
    result.hidden = false;
    feedback.textContent = "Local processing complete. No data was transmitted.";
  } catch (error) {
    feedback.textContent = "Unable to process: " + (error instanceof Error ? error.message : "invalid input");
  }
});
