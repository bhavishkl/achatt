import type { Company } from "@/lib/types";
import type { Patient } from "@/types/patient";
import type { BillDraftItem } from "@/components/add-bill-modal/types";
import { formatDisplayDate, amountToWords } from "@/components/add-bill-modal/utils";

export function buildBillPrintHtml({
  patient,
  items,
  billDate,
  billNo,
  dischargeDate,
  ipBillType,
  grossAmount,
  advanceUsed,
  concession,
  netAmount,
  companyProfile,
}: {
  patient: Patient;
  items: BillDraftItem[];
  billDate: string;
  billNo?: string;
  dischargeDate: string;
  ipBillType: "draft" | "final";
  grossAmount: number;
  advanceUsed: number;
  concession: number;
  netAmount: number;
  companyProfile: Company | null;
}) {
  const companyName = companyProfile?.name || patient.hospitalName || "Hospital";
  const companyAddress = companyProfile?.address || "";
  const companyEmail = companyProfile?.emailId || "";
  const companyMobile1 = companyProfile?.mobileNumber1 || "";
  const companyMobile2 = companyProfile?.mobileNumber2 || "";
  const companyOwner = companyProfile?.ownerName || "";

  const formattedBillDate = formatDisplayDate(billDate);
  const formattedAdmissionDate = formatDisplayDate(patient.admissionDate);
  const formattedDischargeDate = dischargeDate ? formatDisplayDate(dischargeDate) : "-";
    const printDateTime = new Date().toLocaleString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
  const netAmountWords = amountToWords(netAmount);
  const isFinal = ipBillType === "final";

  const itemsRows = items
    .map(
      (item, i) => `
            <tr>
                <td style="padding:8px 12px;text-align:center">${i + 1}</td>
                <td style="padding:8px 12px">${item.description}</td>
                <td style="padding:8px 12px;text-align:right">Rs ${item.rate.toFixed(2)}</td>
                <td style="padding:8px 12px;text-align:center">${item.quantity}</td>
                <td style="padding:8px 12px;text-align:right;font-weight:700;color:#000">Rs ${(item.rate * item.quantity).toFixed(2)}</td>
            </tr>
        `
    )
    .join("");

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill ${billNo ? `(${billNo}) ` : ""}- ${patient.name} - ${formattedBillDate}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; max-width: 800px; margin: 0 auto; }
                body.final-bill { padding-top: 10px; }
                .header { text-align: center; padding-top: 10px; padding-bottom: 10px; margin-bottom: 10px; }
                .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
                .header p { font-size: 12px; color: #000; }
                .letterhead-space { height: 80px; }
                .bill-type-banner { width: 100%; background: #f3f4f6; color: #000; border: 1px solid #000; text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; padding: 7px 10px; margin-bottom: 16px; }
                .bill-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
                .bill-meta div { line-height: 1.6; }
                .bill-meta .label { color: #000; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .bill-meta .value { color: #000; font-weight: 700; }
                .contact-row { display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 12px; color: #000; margin-top: 2px; }
                .meta-row { display: flex; align-items: center; gap: 8px; }
                .meta-row .label-inline { color: #000; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; min-width: 70px; font-weight: 600; }
                .meta-row .value-inline { color: #000; font-weight: 700; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #000; }
                thead th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #000; border: 1px solid #000; }
                tbody td { color: #000; border: 1px solid #000; }
                thead th:first-child { text-align: center; }
                thead th:nth-child(3), thead th:nth-child(5) { text-align: right; }
                thead th:nth-child(4) { text-align: center; }
                .summary-row td { padding: 6px 12px; font-size: 13px; line-height: 1.2; }
                .summary-row td:last-child { font-weight: 700; color: #000; }
                .summary-concession td { font-weight: 700; color: #000; }
                .summary-total td { padding: 8px 12px; font-size: 14px; font-weight: 700; color: #000; }
                .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #000; font-size: 11px; color: #000; }
                .print-date { color: #6b7280; font-size: 10px; margin-bottom: 4px; }
                @media print {
                    body { padding: 16px; }
                    body.final-bill { padding-top: 0; }
                    @page { margin: 12mm; }
                }
            </style>
        </head>
        <body${isFinal ? ` class="final-bill"` : ""}>
            ${
              isFinal
                ? `<div class="letterhead-space"></div>`
                : `<div class="header">
                    <h1>${companyName}</h1>
                    ${companyAddress ? `<p>${companyAddress}</p>` : ""}
                    ${(companyEmail || companyMobile1 || companyMobile2) ? `<p>${companyEmail ? `Email: ${companyEmail}` : ""} ${companyEmail && (companyMobile1 || companyMobile2) ? '| ' : ''}${(companyMobile1 || companyMobile2) ? `Mobile: ${[companyMobile1, companyMobile2].filter(Boolean).join(", ")}` : ""}</p>` : ""}
                </div>`
            }
            <div class="bill-type-banner">${isFinal ? "IP FINAL BILL" : "IP DRAFT BILL"}</div>

            <div class="bill-meta">
                <div>
                    <div class="meta-row"><span class="label-inline">Patient</span><span class="value-inline">${patient.prefix} ${patient.name}</span></div>
                    <div class="meta-row"><span class="label-inline">Gender/Age</span><span class="value-inline">${patient.gender} / ${patient.age} Yrs</span></div>
                    <div class="meta-row"><span class="label-inline">Reg No</span><span class="value-inline">${patient.regNo}</span></div>
                    <div class="meta-row"><span class="label-inline">IP No</span><span class="value-inline">${patient.ipNumber || "-"}</span></div>
                </div>
                <div>
                    <div class="meta-row"><span class="label-inline">Ward / Bed</span><span class="value-inline">${patient.wardName} - Bed ${patient.bedNo}</span></div>
                    <div class="meta-row"><span class="label-inline">Doctor</span><span class="value-inline">${patient.doctorName || "-"}</span></div>
                </div>
                <div style="text-align:right">
                    <div class="meta-row" style="justify-content:flex-end"><span class="label-inline">Bill No</span><span class="value-inline">${billNo || "-"}</span></div>
                    <div class="meta-row" style="justify-content:flex-end"><span class="label-inline">Bill Date</span><span class="value-inline">${formattedBillDate}</span></div>
                    <div class="meta-row" style="justify-content:flex-end"><span class="label-inline">DOA</span><span class="value-inline">${formattedAdmissionDate}</span></div>
                    <div class="meta-row" style="justify-content:flex-end"><span class="label-inline">DOD</span><span class="value-inline">${formattedDischargeDate}</span></div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:40px">Sl No.</th>
                        <th>Description</th>
                        <th style="width:100px;text-align:right">Rate</th>
                        <th style="width:60px;text-align:center">Qty</th>
                        <th style="width:120px;text-align:right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    <tr class="summary-total">
                        <td colspan="4" style="text-align:right">Gross Amount</td>
                        <td style="text-align:right">Rs ${grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    ${
                      advanceUsed > 0
                        ? `<tr class="summary-row"><td colspan="4" style="text-align:right">Advance Deducted</td><td style="text-align:right">- Rs ${advanceUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`
                        : ""
                    }
                    ${
                      concession > 0
                                                ? `<tr class="summary-row summary-concession"><td colspan="4" style="text-align:right">Concession</td><td style="text-align:right">- Rs ${concession.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`
                        : ""
                    }
                    <tr class="summary-total">
                        <td colspan="4" style="text-align:right">${isFinal ? "Net Paid Amount" : "Net Payable"}</td>
                        <td style="text-align:right">Rs ${netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td colspan="5" style="padding:8px 12px;font-size:12px;color:#000;border:1px solid #000;background:#f9fafb;">
                            <strong>Amount in Words:</strong> ${netAmountWords}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <p class="print-date">Printed: ${printDateTime}</p>
                <p>This is a computer-generated bill.</p>
            </div>
        </body>
        </html>
        `;
}

export function openBillPrintWindow(html: string) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
