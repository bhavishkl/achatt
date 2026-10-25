import type { Company } from "@/lib/types";
import type { Patient } from "@/types/patient";
import { amountToWords } from "@/components/add-bill-modal/utils";

/**
 * Deterministic, simple receipt number for a manual advance entry, derived
 * from the entry id so the same entry always reprints with the same number.
 */
export function advanceReceiptNo(entry: { id: string }) {
  return `ADV-${(entry.id || "").slice(0, 6).toUpperCase()}`;
}

export function advanceModeLabel(mode: string) {
  if (mode === "online") return "Online (UPI / Card / Bank)";
  if (mode === "adjustment") return "Advance Adjustment";
  return "Cash";
}

export function buildAdvanceReceiptHtml({
  patient,
  amount,
  mode,
  note,
  receiptNo,
  createdAt,
  advanceBalance,
  companyProfile,
}: {
  patient: Patient;
  amount: number;
  mode: string;
  note?: string;
  receiptNo: string;
  createdAt: string;
  /** Current (after adding the advance) patient balance; omitted when unknown. */
  advanceBalance?: number | null;
  companyProfile: Company | null;
}) {
  const companyName = companyProfile?.name || patient.hospitalName || "Hospital";
  const companyAddress = companyProfile?.address || "";
  const companyEmail = companyProfile?.emailId || "";
  const companyMobile1 = companyProfile?.mobileNumber1 || "";
  const companyMobile2 = companyProfile?.mobileNumber2 || "";

  const entryDate = createdAt ? new Date(createdAt) : new Date();
  const receiptDateTime = (isNaN(entryDate.getTime()) ? new Date() : entryDate).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const printDateTime = new Date().toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formatAmount = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountWords = amountToWords(amount);

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Advance Receipt (${receiptNo}) - ${patient.prefix} ${patient.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; max-width: 720px; margin: 0 auto; }
                .header { text-align: center; padding-top: 10px; padding-bottom: 10px; margin-bottom: 10px; }
                .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
                .header p { font-size: 12px; color: #000; }
                .bill-type-banner { width: 100%; background: #f3f4f6; color: #000; border: 1px solid #000; text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; padding: 7px 10px; margin-bottom: 16px; }
                .receipt-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
                .receipt-meta div { line-height: 1.6; }
                .receipt-meta .label { color: #000; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .receipt-meta .value { color: #000; font-weight: 700; }
                .meta-row { display: flex; align-items: center; gap: 8px; }
                .meta-row .label-inline { color: #000; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; min-width: 78px; font-weight: 600; }
                .meta-row .value-inline { color: #000; font-weight: 700; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #000; }
                thead th { background: #f3f4f6; padding: 7px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #000; border: 1px solid #000; }
                tbody td { color: #000; border: 1px solid #000; padding: 7px 10px; }
                .summary-row td { font-size: 13px; }
                .summary-total td { font-size: 14px; font-weight: 700; }
                .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #000; font-size: 11px; color: #000; }
                .print-date { color: #6b7280; font-size: 10px; margin-bottom: 4px; }
                @media print {
                    body { padding: 16px; }
                    @page { margin: 12mm; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${companyName}</h1>
                ${companyAddress ? `<p>${companyAddress}</p>` : ""}
                ${
                  (companyEmail || companyMobile1 || companyMobile2)
                    ? `<p>${companyEmail ? `Email: ${companyEmail}` : ""}${companyEmail && (companyMobile1 || companyMobile2) ? " | " : ""}${(companyMobile1 || companyMobile2) ? `Mobile: ${[companyMobile1, companyMobile2].filter(Boolean).join(", ")}` : ""}</p>`
                    : ""
                }
            </div>
            <div class="bill-type-banner">Advance Receipt</div>

            <div class="receipt-meta">
                <div>
                    <div class="meta-row"><span class="label-inline">Patient</span><span class="value-inline">${patient.prefix} ${patient.name}</span></div>
                    <div class="meta-row"><span class="label-inline">Gender/Age</span><span class="value-inline">${patient.gender} / ${patient.age} Yrs</span></div>
                    <div class="meta-row"><span class="label-inline">Reg No</span><span class="value-inline">${patient.regNo}</span></div>
                </div>
                <div>
                    <div class="meta-row"><span class="label-inline">Ward / Bed</span><span class="value-inline">${patient.wardName} - Bed ${patient.bedNo}</span></div>
                    <div class="meta-row"><span class="label-inline">Receipt No</span><span class="value-inline">${receiptNo}</span></div>
                    <div class="meta-row"><span class="label-inline">Date</span><span class="value-inline">${receiptDateTime}</span></div>
                    <div class="meta-row"><span class="label-inline">Payment Mode</span><span class="value-inline">${advanceModeLabel(mode)}</span></div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:40px">Sl No.</th>
                        <th>Description</th>
                        <th style="width:130px;text-align:right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align:center">1</td>
                        <td>Advance payment received against IP admission (${patient.ipNumber || `Reg No ${patient.regNo}`})</td>
                        <td style="text-align:right;font-weight:700">Rs ${formatAmount(amount)}</td>
                    </tr>
                    ${
                      advanceBalance != null
                        ? `<tr class="summary-row"><td colspan="2" style="text-align:right">Advance Balance After This Receipt</td><td style="text-align:right">Rs ${formatAmount(advanceBalance)}</td></tr>`
                        : ""
                    }
                    <tr class="summary-total">
                        <td colspan="2" style="text-align:right">Amount Received</td>
                        <td style="text-align:right">Rs ${formatAmount(amount)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="font-size:12px;background:#f9fafb;">
                            <strong>Amount in Words:</strong> ${amountWords}
                        </td>
                    </tr>
                    ${
                      note
                        ? `<tr><td colspan="3" style="font-size:12px;background:#f9fafb;"><strong>Note:</strong> ${note}</td></tr>`
                        : ""
                    }
                </tbody>
            </table>

            <div class="footer">
                <p class="print-date">Printed: ${printDateTime}</p>
                <p>This is a computer-generated receipt.</p>
            </div>
        </body>
        </html>
        `;
}
