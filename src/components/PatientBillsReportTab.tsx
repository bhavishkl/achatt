"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Patient } from "@/types/patient";
import { formatDisplayDate } from "@/components/add-bill-modal/utils";

interface PatientBillsReportTabProps {
  patients: Patient[];
}

interface ReportRow {
  patient: Patient;
  bill: Patient["bills"][number];
}

/** Date of discharge (DOD), sourced from the final bill, then any bill carrying one, then the patient record. */
const getPatientDOD = (patient: Patient): string =>
  patient.bills?.find(b => b.ipBillType === "final")?.dischargeDate ||
  patient.bills?.find(b => b.dischargeDate)?.dischargeDate ||
  patient.dischargeDate ||
  "";

export default function PatientBillsReportTab({ patients }: PatientBillsReportTabProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilters = search.trim() || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // One row per final bill (ipBillType === "final"), attached to its patient
  const processed = useMemo(() => {
    let rows: ReportRow[] = [];
    for (const patient of patients) {
      for (const bill of patient.bills ?? []) {
        if (bill.ipBillType !== "final") continue;
        rows.push({ patient, bill });
      }
    }

    // Search: patient name, reg no, IP no, bill no
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        ({ patient, bill }) =>
          patient.name.toLowerCase().includes(q) ||
          patient.regNo.toLowerCase().includes(q) ||
          (patient.ipNumber ?? "").toLowerCase().includes(q) ||
          (bill.billNo ?? "").toLowerCase().includes(q)
      );
    }

    // Date range on the bill date (YYYY-MM-DD string compare)
    if (dateFrom) {
      rows = rows.filter(({ bill }) => bill.date.split("T")[0] >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter(({ bill }) => bill.date.split("T")[0] <= dateTo);
    }

    // Serial order by date of discharge (DOD): chronological, patients without a DOD (still admitted) last
    rows.sort((a, b) => {
      const aDOD = getPatientDOD(a.patient);
      const bDOD = getPatientDOD(b.patient);
      if (aDOD && bDOD && aDOD !== bDOD) return aDOD.localeCompare(bDOD);
      if (aDOD && !bDOD) return -1;
      if (!aDOD && bDOD) return 1;
      // Same DOD (both discharged) or both still admitted -> reg no, then bill date
      const byReg = a.patient.regNo.localeCompare(b.patient.regNo);
      if (byReg !== 0) return byReg;
      return a.bill.date.localeCompare(b.bill.date);
    });

    return rows;
  }, [patients, search, dateFrom, dateTo]);

  const totals = useMemo(
    () =>
      processed.reduce(
        (acc, { bill }) => ({
          total: acc.total + bill.totalAmount,
          cash: acc.cash + (bill.paidCash ?? 0),
          online: acc.online + (bill.paidOnline ?? 0),
          concession: acc.concession + (bill.concession ?? 0),
        }),
        { total: 0, cash: 0, online: 0, concession: 0 }
      ),
    [processed]
  );

  const formatMoney = (n: number) => `₹${n.toLocaleString()}`;

  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  const handleExportExcel = () => {
    const header = [
      "Sl No",
      "Bill No.",
      "Patient Name",
      "DOD",
      "Total Amount",
      "Amount in Cash",
      "Amount Online",
      "Concession Amount",
    ];
    const body = processed.map(({ patient, bill }, i) => [
      i + 1,
      bill.billNo || "-",
      `${patient.prefix} ${patient.name}`,
      getPatientDOD(patient) ? formatDisplayDate(getPatientDOD(patient)) : "-",
      bill.totalAmount,
      bill.paidCash ?? 0,
      bill.paidOnline ?? 0,
      bill.concession ?? 0,
    ]);
    const totalRow = [
      "",
      "Total",
      `${processed.length} bills`,
      "",
      totals.total,
      totals.cash,
      totals.online,
      totals.concession,
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...body, totalRow]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 30 },
      { wch: 12 },
      { wch: 13 },
      { wch: 14 },
      { wch: 14 },
      { wch: 17 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills Report");
    XLSX.writeFile(wb, `bills_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExport = () => {
    if (exportFormat === "excel") {
      handleExportExcel();
    } else {
      handleExportPDF();
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Title
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("Bills Report", 14, 15);

    // Subtitle: generated date + applied bill date range
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const range = dateFrom || dateTo
      ? `  |  Bill Date: ${dateFrom || "start"} to ${dateTo || "now"}`
      : "";
    doc.text(
      `Generated: ${new Date().toLocaleString()}${range}  |  ${processed.length} bill${processed.length !== 1 ? "s" : ""}`,
      14,
      21
    );

    const body = processed.map(({ patient, bill }, i) => [
      String(i + 1),
      bill.billNo || "-",
      `${patient.prefix} ${patient.name}`,
      getPatientDOD(patient) ? formatDisplayDate(getPatientDOD(patient)) : "-",
      bill.totalAmount.toLocaleString(),
      (bill.paidCash ?? 0).toLocaleString(),
      (bill.paidOnline ?? 0).toLocaleString(),
      (bill.concession ?? 0).toLocaleString(),
    ]);

    // Totals footer row
    body.push([
      "",
      "Total",
      `${processed.length} bills`,
      "",
      totals.total.toLocaleString(),
      totals.cash.toLocaleString(),
      totals.online.toLocaleString(),
      totals.concession.toLocaleString(),
    ]);

    autoTable(doc, {
      head: [[
        "Sl No",
        "Bill No.",
        "Patient Name",
        "DOD",
        "Total Amount",
        "Amount in Cash",
        "Amount Online",
        "Concession Amount",
      ]],
      body,
      startY: 27,
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [50, 50, 50] },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 32 },
        2: { cellWidth: 56 },
        3: { cellWidth: 26 },
        4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        5: { cellWidth: 26, halign: "right" },
        6: { cellWidth: 24, halign: "right" },
        7: { cellWidth: 28, halign: "right" },
      },
      didParseCell: (data) => {
        // Bold the totals row (last body row)
        if (data.section === "body" && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [224, 231, 243];
        }
      },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 8
        );
      },
    });

    doc.save(`bills_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search patient, reg no, bill no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-600 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Bill date from"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <span className="text-neutral-500 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Bill date to"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-neutral-500 hover:text-white transition-colors px-2 py-2">
              Clear all
            </button>
          )}

          {/* Export format selector */}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "pdf" | "excel")}
            title="Choose export format"
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel (.xlsx)</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={processed.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            title={`Export bills report as ${exportFormat === "excel" ? "Excel (.xlsx)" : "PDF"}`}
          >
            <span>⬇</span> Export {exportFormat === "excel" ? "Excel" : "PDF"}
          </button>

          {/* Result count */}
          <span className="text-xs text-neutral-500">
            {processed.length} bill{processed.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="p-4 text-center">Sl No</th>
                <th className="p-4">Bill No.</th>
                <th className="p-4">Patient Name</th>
                <th className="p-4">DOD</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-right">Amount in Cash</th>
                <th className="p-4 text-right">Amount Online</th>
                <th className="p-4 text-right">Concession Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    {hasActiveFilters
                      ? "No bills match your search or filters."
                      : "No bills recorded yet."}
                  </td>
                </tr>
              ) : (
                <>
                  {processed.map(({ patient, bill }, i) => (
                    <tr key={`${patient.id}-${bill.id}`} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="p-4 text-center text-neutral-500">{i + 1}</td>
                      <td className="p-4 font-mono text-blue-400">{bill.billNo || "-"}</td>
                      <td className="p-4">
                        <div className="font-medium text-neutral-200">{patient.prefix} {patient.name}</div>
                        <div className="text-xs text-neutral-500">
                          Reg No: {patient.regNo} · {patient.status === 'admitted' ? 'Admitted' : 'Discharged'}
                        </div>
                      </td>
                      <td className="p-4 text-neutral-300">
                        {getPatientDOD(patient) ? formatDisplayDate(getPatientDOD(patient)) : "-"}
                      </td>
                      <td className="p-4 text-right font-medium text-neutral-200">{formatMoney(bill.totalAmount)}</td>
                      <td className="p-4 text-right text-emerald-400">{formatMoney(bill.paidCash ?? 0)}</td>
                      <td className="p-4 text-right text-blue-400">{formatMoney(bill.paidOnline ?? 0)}</td>
                      <td className="p-4 text-right text-amber-400">{formatMoney(bill.concession ?? 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-800/60 font-semibold text-neutral-200">
                    <td className="p-4 text-center text-neutral-500">—</td>
                    <td className="p-4">Total</td>
                    <td className="p-4 text-neutral-500">{processed.length} bills</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-right">{formatMoney(totals.total)}</td>
                    <td className="p-4 text-right text-emerald-400">{formatMoney(totals.cash)}</td>
                    <td className="p-4 text-right text-blue-400">{formatMoney(totals.online)}</td>
                    <td className="p-4 text-right text-amber-400">{formatMoney(totals.concession)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
