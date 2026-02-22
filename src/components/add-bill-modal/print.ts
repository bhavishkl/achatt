import type { Company } from "@/lib/types";
import type { Patient } from "@/types/patient";
import type { BillDraftItem } from "@/components/add-bill-modal/types";

export function buildBillPrintHtml({
  patient,
  items,
  billDate,
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

  const itemsRows = items
    .map(
      (item, i) => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.description}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">Rs ${item.rate.toFixed(2)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">Rs ${(item.rate * item.quantity).toFixed(2)}</td>
            </tr>
        `
    )
    .join("");

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - ${patient.name} - ${billDate}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
                .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
                .header p { font-size: 12px; color: #666; }
                .bill-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
                .bill-meta div { line-height: 1.6; }
                .bill-meta .label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                .bill-meta .value { font-weight: 600; }
                .contact-row { display: flex; justify-content: center; gap: 16px; font-size: 12px; color: #666; margin-top: 2px; }
                .meta-row { display: flex; align-items: center; gap: 8px; }
                .meta-row .label-inline { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; min-width: 70px; }
                .meta-row .value-inline { font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                thead th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #d1d5db; }
                thead th:first-child { text-align: center; }
                thead th:nth-child(3), thead th:nth-child(5) { text-align: right; }
                thead th:nth-child(4) { text-align: center; }
                .total-row td { border-top: 2px solid #1a1a1a; padding: 12px; font-size: 15px; font-weight: 700; }
                .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; }
                @media print {
                    body { padding: 16px; }
                    @page { margin: 12mm; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${companyName}</h1>
                <p>Patient Bill / Invoice</p>
                ${companyAddress ? `<p>${companyAddress}</p>` : ""}
                ${(companyEmail || companyMobile1 || companyMobile2) ? `<div class="contact-row"><span>${companyEmail ? `Email: ${companyEmail}` : ""}</span><span>${(companyMobile1 || companyMobile2) ? `Mobile: ${[companyMobile1, companyMobile2].filter(Boolean).join(", ")}` : ""}</span></div>` : ""}
            </div>

            <div class="bill-meta">
                <div>
                    <div class="meta-row"><span class="label-inline">Patient</span><span class="value-inline">${patient.prefix} ${patient.name}</span></div>
                    <div class="meta-row"><span class="label-inline">Gender/Age</span><span>${patient.gender}, ${patient.age} Yrs</span></div>
                    <div class="meta-row"><span class="label-inline">Reg No</span><span>${patient.regNo}</span></div>
                </div>
                <div>
                    <div class="label">Ward / Bed</div>
                    <div class="value">${patient.wardName} - Bed ${patient.bedNo}</div>
                    <div class="label" style="margin-top:8px">Doctor</div>
                    <div class="value">${patient.doctorName}</div>
                    ${companyOwner ? `<div class="meta-row"><span class="label-inline">Owner</span><span>${companyOwner}</span></div>` : ""}
                </div>
                <div style="text-align:right">
                    <div class="label">Bill Type</div>
                    <div class="value">${ipBillType === "final" ? "IP Final Bill" : "IP Draft Bill"}</div>
                    <div class="label">Bill Date</div>
                    <div class="value">${billDate}</div>
                    <div class="label" style="margin-top:8px">Discharge</div>
                    <div class="value">${dischargeDate || "-"}</div>
                    <div class="label" style="margin-top:8px">Admission</div>
                    <div class="value">${patient.admissionDate}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:40px">#</th>
                        <th>Description</th>
                        <th style="width:100px;text-align:right">Rate</th>
                        <th style="width:60px;text-align:center">Qty</th>
                        <th style="width:120px;text-align:right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    <tr class="total-row">
                        <td colspan="4" style="text-align:right">Gross Amount</td>
                        <td style="text-align:right">Rs ${grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    ${
                      advanceUsed > 0
                        ? `<tr><td colspan="4" style="text-align:right;padding:10px 12px;">Advance Deducted</td><td style="text-align:right;padding:10px 12px;">- Rs ${advanceUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`
                        : ""
                    }
                    ${
                      concession > 0
                        ? `<tr><td colspan="4" style="text-align:right;padding:10px 12px;">Concession</td><td style="text-align:right;padding:10px 12px;">- Rs ${concession.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`
                        : ""
                    }
                    <tr class="total-row">
                        <td colspan="4" style="text-align:right">Net Payable</td>
                        <td style="text-align:right">Rs ${netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
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
