"use strict";
// Versioned fictional fixture; keep byte-for-byte aligned with sample.csv.
const ExcelRescueSample = "name,email,signup_date,city\n\"Alice Silva\",\" ALICE@EXAMPLE.COM \",05/11/2026,Brasília\n\"Bob Lima\",bob@example.com,2026-11-02,Recife\n\"Alice duplicate\",alice@example.com,2026-11-03,Brasília\n\"Invalid entry\",no-at-sign,2026-11-03,Salvador\n";
if (typeof module !== "undefined" && module.exports) module.exports = ExcelRescueSample;
