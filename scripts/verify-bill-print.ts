// Verification script (run with bun): exercises the REAL buildBillPrintHtml
// from src/components/add-bill-modal/print.ts and asserts that the hospital
// header renders on draft bills and is replaced by the blank letterhead-space
// on final bills. Also guards the DOD fix from earlier.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildBillPrintHtml } from "../src/components/add-bill-modal/print";
import type { Patient } from "../src/types/patient";

const patient: Patient = {
  id: "test-patient",
  name: "Test Patient",
  prefix: "Mr.",
  gender: "Male",
  age: 45,
  regNo: "REG-001",
  ipNumber: "IP-001",
  wardName: "General",
  bedNo: "101",
  doctorName: "Dr. Test",
  admissionDate: "2026-09-20",
  admissionTime: "10:30",
  hospitalName: "",
  pincode: "411001",
  attenderName: "Test Attender",
  attenderAddress: "Pune",
  attenderMobile: "9123456780",
  attenderRelation: "Son",
  diagnosis: "Fever",
  status: "admitted",
  advanceBalance: 0,
  bills: [],
};

const items = [{ id: "1", description: "Room Rent", rate: 1000, quantity: 2, amount: 2000 }];
const companyProfile = {
  id: "test-company",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  name: "Sunrise Hospital",
  address: "MG Road, Pune",
  emailId: "care@sunrise.example",
  mobileNumber1: "9876543210",
  mobileNumber2: "",
  ownerName: "",
};

const base = {
  patient,
  items,
  billDate: "2026-09-29",
  billNo: "BILL-1",
  dischargeDate: "2026-09-09",
  dischargeTime: "14:30",
  grossAmount: 2000,
  advanceUsed: 0,
  concession: 0,
  netAmount: 2000,
  companyProfile,
};

const draftHtml = buildBillPrintHtml({ ...base, ipBillType: "draft" });
const finalHtml = buildBillPrintHtml({ ...base, ipBillType: "final" });

const hasHeader = (html: string) =>
  html.includes('<div class="header">') && html.includes("Sunrise Hospital");
const hasLetterheadSpace = (html: string) =>
  html.includes('<div class="letterhead-space"></div>');
const hasBanner = (html: string, text: string) => html.includes(text);
// DOD regression guard (from the earlier fix): DD-MM-YYYY hh:mm AM/PM.
const hasDod = (html: string) =>
  /DOD<\/span><span class="value-inline">09-09-2026 02:30 PM<\/span>/.test(html);

const results: [string, boolean][] = [
  ["DRAFT banner shows 'IP DRAFT BILL'", hasBanner(draftHtml, "IP DRAFT BILL")],
  ["DRAFT shows hospital header", hasHeader(draftHtml)],
  ["DRAFT has no letterhead-space", !hasLetterheadSpace(draftHtml)],
  ["DRAFT prints DOD from modal", hasDod(draftHtml)],
  ["FINAL banner shows 'IP FINAL BILL'", hasBanner(finalHtml, "IP FINAL BILL")],
  ["FINAL hides hospital header", !hasHeader(finalHtml)],
  ["FINAL shows blank letterhead-space", hasLetterheadSpace(finalHtml)],
  ["FINAL prints DOD from modal", hasDod(finalHtml)],
];

let exitCode = 0;
for (const [label, ok] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}`);
  if (!ok) exitCode = 1;
}

// Keep the generated HTML around briefly for manual inspection.
const outDir = mkdtempSync(join(tmpdir(), "bill-print-verify-"));
writeFileSync(join(outDir, "draft-bill.html"), draftHtml);
writeFileSync(join(outDir, "final-bill.html"), finalHtml);
console.log(`\nHTML artifacts: ${outDir}/draft-bill.html and final-bill.html`);

// Best-effort cleanup so the temp dir doesn't linger.
process.on("exit", () => {
  try {
    rmSync(outDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

process.exit(exitCode);
