"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Patient } from "@/types/patient";
import { formatDisplayDate, formatDisplayTime } from "@/components/add-bill-modal/utils";

interface AdmissionsReportTabProps {
  patients: Patient[];
}

const getPatientTotalBill = (patient: Patient) =>
  patient.bills?.reduce((sum, b) => sum + b.totalAmount, 0) ?? 0;

export default function AdmissionsReportTab({ patients }: AdmissionsReportTabProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilters = search.trim() || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // One row per patient admission, filtered by the DOA range
  const processed = useMemo(() => {
    let rows: Patient[] = [...patients];

    // Search: patient name, reg no, IP no, doctor
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.regNo.toLowerCase().includes(q) ||
          (p.ipNumber ?? "").toLowerCase().includes(q) ||
          p.doctorName.toLowerCase().includes(q)
      );
    }

    // Date range on the admission date (YYYY-MM-DD string compare)
    if (dateFrom) {
      rows = rows.filter((p) => (p.admissionDate || "").split("T")[0] >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter((p) => (p.admissionDate || "").split("T")[0] <= dateTo);
    }

    // Chronological order by DOA, then reg no
    rows.sort((a, b) => {
      const byDate = (a.admissionDate || "").localeCompare(b.admissionDate || "");
      if (byDate !== 0) return byDate;
      return a.regNo.localeCompare(b.regNo);
    });

    return rows;
  }, [patients, search, dateFrom, dateTo]);

  const totals = useMemo(
    () =>
      processed.reduce(
        (acc, p) => ({
          count: acc.count + 1,
          totalBill: acc.totalBill + getPatientTotalBill(p),
        }),
        { count: 0, totalBill: 0 }
      ),
    [processed]
  );

  const formatMoney = (n: number) => `₹${n.toLocaleString()}`;

  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  const handleExport = () => {
    if (exportFormat === "excel") {
      handleExportExcel();
    } else {
      handleExportPDF();
    }
  };

  const handleExportExcel = () => {
    const header = [
      "Sl No",
      "Reg No.",
      "IP No.",
      "Patient Name",
      "Age/Sex",
      "Ward & Bed",
      "Doctor",
      "DOA",
      "Status",
      "Total Bill Amount",
    ];
    const body = processed.map((p, i) => [
      i + 1,
      p.regNo,
      p.ipNumber || "-",
      `${p.prefix} ${p.name}`,
      `${p.age}/${p.gender.charAt(0).toUpperCase()}`,
      `${p.wardName} (Bed: ${p.bedNo})`,
      p.doctorName || "-",
      `${formatDisplayDate(p.admissionDate)}${formatDisplayTime(p.admissionTime) ? ` ${formatDisplayTime(p.admissionTime)}` : ""}`,
      p.status === "admitted" ? "Admitted" : "Discharged",
      getPatientTotalBill(p),
    ]);
    const totalRow = [
      "",
      "Total",
      `${totals.count} admissions`,
      "",
      "",
      "",
      "",
      "",
      "",
      totals.totalBill,
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...body, totalRow]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 12 },
      { wch: 28 },
      { wch: 8 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 11 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admissions Report");
    XLSX.writeFile(wb, `admissions_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Title
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("Admissions Report", 14, 15);

    // Subtitle: generated date + applied DOA range
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const range = dateFrom || dateTo
      ? `  |  Admission Date: ${dateFrom || "start"} to ${dateTo || "now"}`
      : "";
    doc.text(
      `Generated: ${new Date().toLocaleString()}${range}  |  ${processed.length} admission${processed.length !== 1 ? "s" : ""}`,
      14,
      21
    );

    const body = processed.map((p, i) => [
      String(i + 1),
      p.regNo,
      p.ipNumber || "-",
      `${p.prefix} ${p.name}`,
      `${p.age}/${p.gender.charAt(0).toUpperCase()}`,
      `${p.wardName} (Bed: ${p.bedNo})`,
      p.doctorName || "-",
      `${formatDisplayDate(p.admissionDate)}${formatDisplayTime(p.admissionTime) ? `\n${formatDisplayTime(p.admissionTime)}` : ""}`,
      p.status === "admitted" ? "Admitted" : "Discharged",
      getPatientTotalBill(p).toLocaleString(),
    ]);

    // Totals footer row
    body.push([
      "",
      "Total",
      `${totals.count} admissions`,
      "",
      "",
      "",
      "",
      "",
      "",
      totals.totalBill.toLocaleString(),
    ]);

    autoTable(doc, {
      head: [[
        "Sl No",
        "Reg No.",
        "IP No.",
        "Patient Name",
        "Age/Sex",
        "Ward & Bed",
        "Doctor",
        "DOA",
        "Status",
        "Total Bill Amount",
      ]],
      body,
      startY: 27,
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [50, 50, 50] },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 22 },
        2: { cellWidth: 24 },
        3: { cellWidth: 54 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 48 },
        6: { cellWidth: 34 },
        7: { cellWidth: 28, halign: "center" },
        8: { cellWidth: 20, halign: "center" },
        9: { cellWidth: 28, halign: "right", fontStyle: "bold" },
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

    doc.save(`admissions_report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
            placeholder="Search patient, reg no, IP no, doctor..."
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
              title="Admission date from"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <span className="text-neutral-500 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Admission date to"
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
            title={`Export admissions report as ${exportFormat === "excel" ? "Excel (.xlsx)" : "PDF"}`}
          >
            <span>⬇</span> Export {exportFormat === "excel" ? "Excel" : "PDF"}
          </button>

          {/* Result count */}
          <span className="text-xs text-neutral-500">
            {processed.length} admission{processed.length !== 1 ? "s" : ""}
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
                <th className="p-4">Reg No.</th>
                <th className="p-4">Patient Name</th>
                <th className="p-4">Age/Sex</th>
                <th className="p-4">Ward &amp; Bed</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">DOA</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Total Bill Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    {hasActiveFilters
                      ? "No admissions match your search or filters."
                      : "No admissions recorded yet."}
                  </td>
                </tr>
              ) : (
                <>
                  {processed.map((p, i) => (
                    <tr key={p.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="p-4 text-center text-neutral-500">{i + 1}</td>
                      <td className="p-4">
                        <div className="font-mono text-blue-400">{p.regNo}</div>
                        {p.ipNumber && (
                          <div className="font-mono text-xs text-blue-300 mt-1">IP: {p.ipNumber}</div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-neutral-200">
                        {p.prefix} {p.name}
                      </td>
                      <td className="p-4 text-neutral-300">{p.age}/{p.gender.charAt(0).toUpperCase()}</td>
                      <td className="p-4 text-neutral-400">
                        <div>{p.wardName}</div>
                        <div className="text-xs text-neutral-500">Bed: {p.bedNo}</div>
                      </td>
                      <td className="p-4 text-neutral-400">{p.doctorName || "-"}</td>
                      <td className="p-4 text-neutral-300">
                        <div>{formatDisplayDate(p.admissionDate)}</div>
                        {formatDisplayTime(p.admissionTime) && (
                          <div className="text-xs text-neutral-500">{formatDisplayTime(p.admissionTime)}</div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-xs rounded-full px-2 py-0.5 ${
                            p.status === "admitted"
                              ? "bg-blue-600/20 text-blue-400"
                              : "bg-green-600/20 text-green-400"
                          }`}
                        >
                          {p.status === "admitted" ? "Admitted" : "Discharged"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-neutral-200">
                        {formatMoney(getPatientTotalBill(p))}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-800/60 font-semibold text-neutral-200">
                    <td className="p-4 text-center text-neutral-500">—</td>
                    <td className="p-4">Total</td>
                    <td className="p-4 text-neutral-500" colSpan={6}>
                      {totals.count} admissions
                    </td>
                    <td className="p-4 text-right">{formatMoney(totals.totalBill)}</td>
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
