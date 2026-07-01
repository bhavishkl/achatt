import type { OpdPatient, OpdVisit, OpdBill } from "@/types/opd";

export function buildOpdBillPrintHtml({
  patient,
  bill,
  visit,
}: {
  patient: OpdPatient;
  bill: OpdBill;
  visit: OpdVisit;
}): string {
  const itemRows = bill.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${item.description}</td>
        <td style="padding:6px 10px;text-align:right;border-bottom:1px solid #eee">₹${item.rate.toFixed(2)}</td>
        <td style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee">${item.quantity}</td>
        <td style="padding:6px 10px;text-align:right;font-weight:600;border-bottom:1px solid #eee">₹${item.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>OPD Bill - ${bill.billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 12px; }
    .header h1 { font-size: 20px; margin-bottom: 2px; }
    .header p { font-size: 12px; color: #666; }
    .bill-meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; }
    .patient-info { background: #f8f8f8; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
    .patient-info b { color: #111; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    thead th { background: #f0f0f0; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
    thead th:nth-child(1) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(5) { text-align: right; }
    thead th:nth-child(4) { text-align: center; }
    .totals { text-align: right; font-size: 13px; margin-bottom: 10px; }
    .totals div { margin: 4px 0; }
    .totals .net { font-size: 16px; font-weight: 700; border-top: 2px solid #333; padding-top: 6px; margin-top: 8px; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>OPD Bill</h1>
    <p>Outpatient Department</p>
  </div>

  <div class="bill-meta">
    <div><b>Bill No:</b> ${bill.billNo}</div>
    <div><b>Date:</b> ${new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
    <div><b>Token:</b> #${visit.tokenNo}</div>
  </div>

  <div class="patient-info">
    <b>${patient.name}</b> &nbsp;|&nbsp; ${patient.age}y / ${patient.gender}
    &nbsp;|&nbsp; Ph: ${patient.phone}
    ${patient.address ? ` &nbsp;|&nbsp; ${patient.address}` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Rate</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div>Gross Amount: ₹${bill.grossAmount.toFixed(2)}</div>
    ${bill.concession > 0 ? `<div>Concession: -₹${bill.concession.toFixed(2)}</div>` : ""}
    <div class="net">Net Amount: ₹${bill.totalAmount.toFixed(2)}</div>
    <div style="font-size:12px;color:#666;margin-top:4px">Payment: ${bill.paymentMode.toUpperCase()}</div>
  </div>

  <div class="footer">
    <div>Thank you for visiting</div>
    <div>Authorized Signature</div>
  </div>

  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;
}

export function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
