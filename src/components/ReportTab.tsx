"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAppStore, computeAttendanceReport } from "@/lib/store";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReportTab() {
  const employees = useAppStore((s) => s.employees);
  const weekOffGroups = useAppStore((s) => s.weekOffGroups);
  const holidayGroups = useAppStore((s) => s.holidayGroups);
  const leaveGroups = useAppStore((s) => s.leaveGroups);
  const shiftGroups = useAppStore((s) => s.shiftGroups);
  const leaveRecords = useAppStore((s) => s.leaveRecords);
  const processedPunches = useAppStore((s) => s.processedPunches);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [reportType, setReportType] = useState<'attendance' | 'late'>('attendance');

  const report = useMemo(
    () =>
      computeAttendanceReport(
        employees,
        weekOffGroups,
        holidayGroups,
        leaveGroups,
        shiftGroups,
        leaveRecords,
        processedPunches,
        year,
        month,
      ),
    [employees, weekOffGroups, holidayGroups, leaveGroups, shiftGroups, leaveRecords, processedPunches, year, month],
  );

  // Build days array for the selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Quick lookup map for processed punches within the selected month
  const punchesMap = useMemo(() => {
    const m = new Map<string, typeof processedPunches[0]>();
    processedPunches.forEach((p) => {
      const d = new Date(p.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        m.set(`${p.employeeId}-${p.date}`, p);
      }
    });
    return m;
  }, [processedPunches, year, month]);

  // Map external employeeId (e.g. "EMP-001") -> internal store id (emp.id)
  const empIdToInternalId = useMemo(() => {
    const m = new Map<string, string>();
    employees.forEach((emp) => m.set(emp.employeeId, emp.id));
    return m;
  }, [employees]);

  const totalNetSalary = report.reduce((sum, r) => sum + r.netSalary, 0);

  // Helper to parse "HH:mm" or "HH:mm:ss" to minutes
  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getShiftStart = (internalEmpId: string) => {
    const g = shiftGroups.find(g => g.employeeIds.includes(internalEmpId));
    return g ? g.startTime : null;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    const title = `${reportType === 'attendance' ? 'Attendance' : 'Late Entry'} Report - ${MONTH_NAMES[month]} ${year}`;
    doc.text(title, 14, 15);

    if (reportType === 'attendance') {
      const headers = [
        "ID", "Name", "Dept",
        ...days.map(String),
        "Total", "W.Off", "Hol", "Leave", "Abs", "Work", "DD",
        "Basic", "Per Day", "Net Salary"
      ];

      const body = report.map((r) => {
        const internalEmpId = empIdToInternalId.get(r.employeeId);

        // Calculate row cells for days
        const dayCells = days.map((d) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

          if (r.holidayDates?.includes(dateStr)) return "H";
          if (r.weekOffDates?.includes(dateStr)) return "WO";

          const isLeave = internalEmpId
            ? leaveRecords.some((lr) => lr.employeeId === internalEmpId && lr.date === dateStr)
            : false;
          if (isLeave) return "L";

          const p = punchesMap.get(`${r.employeeId}-${dateStr}`);
          if (p) {
            return p.punchIn || "P";
          }

          return "A";
        });

        // Count double duty for this employee
        const internalId = empIdToInternalId.get(r.employeeId);
        const ddCount = internalId
          ? leaveRecords.filter(
            (lr) => lr.substituteEmployeeId === internalId && lr.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
          ).length
          : 0;

        return [
          r.employeeId,
          r.employeeName,
          r.department,
          ...dayCells,
          r.totalDays,
          r.weekOffs,
          r.holidays,
          r.leaves,
          r.absences,
          r.workingDays,
          ddCount,
          r.basicSalary.toLocaleString(),
          r.perDaySalary.toLocaleString(),
          r.netSalary.toLocaleString()
        ];
      });

      autoTable(doc, {
        head: [headers],
        body: body as any[],
        startY: 20,
        styles: { fontSize: 6, cellPadding: 1 },
        headStyles: { fillColor: [23, 23, 23] },
        columnStyles: {
          0: { cellWidth: 15 }, // ID
          1: { cellWidth: 20 }, // Name
          2: { cellWidth: 15 }, // Dept
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index >= 3 && data.column.index < 3 + days.length) {
            if (data.cell.raw === 'A') {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            } else if (data.cell.raw === 'H') {
              data.cell.styles.textColor = [124, 58, 237]; // Purple
            } else if (data.cell.raw === 'WO') {
              data.cell.styles.textColor = [217, 119, 6]; // Orange
            } else if (data.cell.raw === 'L') {
              data.cell.styles.textColor = [202, 138, 4]; // Yellow
            }
          }
        }
      });
    } else {
      // Late Entry Report - Concise
      const headers = [
        "ID", "Name",
        "Total", "W.Off", "Hol", "Leave", "Abs", "Work", "Shift",
        "Late Days"
      ];

      const body = report.map((r) => {
        let totalLateDays = 0;
        const internalEmpId = empIdToInternalId.get(r.employeeId);
        const shiftStart = internalEmpId ? getShiftStart(internalEmpId) : null;

        // Calculate late days
        days.forEach((d) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const p = punchesMap.get(`${r.employeeId}-${dateStr}`);
          if (p && p.punchIn && shiftStart) {
            const punchMins = timeToMinutes(p.punchIn);
            const shiftMins = timeToMinutes(shiftStart);
            if (punchMins > shiftMins + 5) {
              totalLateDays++;
            }
          }
        });

        return [
          r.employeeId,
          r.employeeName,
          r.totalDays,
          r.weekOffs,
          r.holidays,
          r.leaves,
          r.absences,
          r.workingDays,
          r.shiftInfo,
          totalLateDays
        ];
      });

      autoTable(doc, {
        head: [headers],
        body: body as any[],
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 }, // Slightly larger font for concise report
        headStyles: { fillColor: [23, 23, 23] },
        columnStyles: {
          0: { cellWidth: 20 }, // ID
          1: { cellWidth: 40 }, // Name
        }
      });
    }

    doc.save(`${reportType}_report_${year}-${String(month + 1).padStart(2, '0')}.pdf`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-white">Monthly Reports</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors no-print"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors no-print"
          >
            ⬇️ Export PDF
          </button>

          <div className="h-6 w-px bg-neutral-700 mx-1 self-center hidden sm:block no-print"></div>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'attendance' | 'late')}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-print"
          >
            <option value="attendance">Attendance Report</option>
            <option value="late">Late Entry Report</option>
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-print"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020}
            max={2040}
            className="w-24 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 no-print"
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg mb-1">No employees to report on</p>
          <p className="text-sm">Add employees and assign them to groups first.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Employees</p>
              <p className="text-2xl font-bold text-white mt-1">{report.length}</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Days in Month</p>
              <p className="text-2xl font-bold text-white mt-1">
                {report[0]?.totalDays ?? "—"}
              </p>
            </div>
            {reportType === 'attendance' ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                <p className="text-xs text-neutral-400 uppercase tracking-wide">Total Salary</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  ₹{Math.round(totalNetSalary).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                <p className="text-xs text-neutral-400 uppercase tracking-wide">Report Type</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">Late Entry</p>
              </div>
            )}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Period</p>
              <p className="text-lg font-bold text-white mt-1">
                {MONTH_NAMES[month]} {year}
              </p>
            </div>
          </div>

          {/* Report table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700 text-neutral-400">
                  <th className="text-left py-3 px-2 font-medium">ID</th>
                  <th className="text-left py-3 px-2 font-medium">Name</th>
                  <th className="text-left py-3 px-2 font-medium">Dept</th>

                  {/* Per-day columns (dates as columns) */}
                  {days.map((d) => {
                    const dateObj = new Date(year, month, d);
                    const dow = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                    return (
                      <th key={d} className="text-center py-2 px-1 font-medium text-xs uppercase">
                        <div className="text-sm">{d}</div>
                        <div className="text-xs text-neutral-400">{dow}</div>
                      </th>
                    );
                  })}

                  <th className="text-right py-3 px-2 font-medium">Total</th>
                  <th className="text-right py-3 px-2 font-medium">W.Off</th>
                  <th className="text-right py-3 px-2 font-medium">Hol.</th>
                  <th className="text-right py-3 px-2 font-medium">Leave</th>
                  <th className="text-right py-3 px-2 font-medium">Absent</th>
                  <th className="text-right py-3 px-2 font-medium">Working</th>
                  <th className="text-left py-3 px-2 font-medium">Shift</th>
                  <th className="text-right py-3 px-2 font-medium text-blue-400">DD</th>
                  {reportType === 'attendance' ? (
                    <>
                      <th className="text-right py-3 px-2 font-medium">Basic</th>
                      <th className="text-right py-3 px-2 font-medium">Per Day</th>
                      <th className="text-right py-3 px-2 font-medium">Net Salary</th>
                    </>
                  ) : (
                    <th className="text-right py-3 px-2 font-medium text-orange-400">Late Days</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.map((r) => {
                  let totalLateDays = 0;

                  // Pre-calculate late days if needed for summary
                  // We also need it for rendering the cell if reportType is 'late'
                  // To avoid double loop, we can just calculate on the fly or memoize, 
                  // but the loop inside map is cheap enough.
                  if (reportType === 'late') {
                    const internalId = empIdToInternalId.get(r.employeeId);
                    const shiftStart = internalId ? getShiftStart(internalId) : null;

                    days.forEach(d => {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const p = punchesMap.get(`${r.employeeId}-${dateStr}`);
                      if (p && p.punchIn && shiftStart) {
                        const punchMins = timeToMinutes(p.punchIn);
                        const shiftMins = timeToMinutes(shiftStart);
                        if (punchMins > shiftMins + 5) { // 5 mins grace
                          totalLateDays++;
                        }
                      }
                    });
                  }

                  return (
                    <tr
                      key={r.employeeId}
                      className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-2 px-2 text-neutral-300 font-mono text-xs">
                        {r.employeeId}
                      </td>
                      <td className="py-2 px-2 text-white">{r.employeeName}</td>
                      <td className="py-2 px-2 text-neutral-400">{r.department}</td>

                      {/* Per-day cells */}
                      {days.map((d) => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                        // Use holidayDates/weekOffDates provided by the report row
                        const isHoliday = r.holidayDates?.includes(dateStr);
                        if (isHoliday) {
                          return (
                            <td key={d} className="py-1 px-2 text-center align-top text-xs">
                              <div className="text-purple-300 font-medium">🎉</div>
                              <div className="text-xs text-neutral-400">Hol.</div>
                            </td>
                          );
                        }

                        const isWeekOff = r.weekOffDates?.includes(dateStr);
                        if (isWeekOff) {
                          return (
                            <td key={d} className="py-1 px-2 text-center align-top text-xs">
                              <div className="text-orange-300 font-medium">🟧</div>
                              <div className="text-xs text-neutral-400">W.Off</div>
                            </td>
                          );
                        }

                        // Check explicit leave records for the employee/date
                        const internalEmpId = empIdToInternalId.get(r.employeeId);
                        const isLeave = internalEmpId
                          ? leaveRecords.some((lr) => lr.employeeId === internalEmpId && lr.date === dateStr)
                          : false;

                        if (isLeave) {
                          return (
                            <td key={d} className="py-1 px-2 text-center align-top text-xs">
                              <div className="text-yellow-300 font-medium">🟡</div>
                              <div className="text-xs text-neutral-400">Leave</div>
                            </td>
                          );
                        }

                        // Otherwise show punches
                        const p = punchesMap.get(`${r.employeeId}-${dateStr}`);
                        if (p) {
                          let isLateEntry = false;
                          if (reportType === 'late' && p.punchIn && internalEmpId) {
                            const shiftStart = getShiftStart(internalEmpId);
                            if (shiftStart) {
                              const punchMins = timeToMinutes(p.punchIn);
                              const shiftMins = timeToMinutes(shiftStart);
                              if (punchMins > shiftMins + 5) {
                                isLateEntry = true;
                              }
                            }
                          }

                          return (
                            <td key={d} className={`py-1 px-2 text-center align-top text-xs ${isLateEntry ? 'bg-red-500/10' : ''}`}>
                              <div className="flex flex-col items-center gap-1">
                                <div className={`font-medium ${isLateEntry ? 'text-red-400' : 'text-emerald-300'}`}>
                                  {p.punchIn || '-'}
                                </div>
                                <div className="text-neutral-400">{p.punchOut || '-'}</div>
                              </div>
                            </td>
                          );
                        }

                        // No punch + not holiday/week-off/leave → mark Absent
                        return (
                          <td key={d} className="py-1 px-2 text-center align-top text-xs">
                            <div className="text-red-400 font-medium">✖</div>
                            <div className="text-xs text-neutral-400">Abs.</div>
                          </td>
                        );
                      })}

                      <td className="py-2 px-2 text-right text-neutral-300">{r.totalDays}</td>
                      <td className="py-2 px-2 text-right text-orange-400">{r.weekOffs}</td>
                      <td className="py-2 px-2 text-right text-purple-400">{r.holidays}</td>
                      <td className="py-2 px-2 text-right text-yellow-400">{r.leaves}</td>
                      <td className="py-2 px-2 text-right text-red-400">{r.absences}</td>
                      <td className="py-2 px-2 text-right text-emerald-400 font-medium">
                        {r.workingDays}
                      </td>
                      <td className="py-2 px-2 text-neutral-400 text-xs">{r.shiftInfo}</td>
                      <td className="py-2 px-2 text-right text-blue-400 font-medium">
                        {(() => {
                          const intId = empIdToInternalId.get(r.employeeId);
                          const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                          const ddCount = intId
                            ? leaveRecords.filter((lr) => lr.substituteEmployeeId === intId && lr.date.startsWith(monthPrefix)).length
                            : 0;
                          return ddCount;
                        })()}
                      </td>

                      {reportType === 'attendance' ? (
                        <>
                          <td className="py-2 px-2 text-right text-neutral-300">
                            ₹{r.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-400">
                            ₹{r.perDaySalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-semibold">
                            ₹{r.netSalary.toLocaleString()}
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-2 text-right text-orange-400 font-bold">
                          {totalLateDays}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-600">
                  <td colSpan={11} className="py-3 px-2 text-right text-neutral-400 font-medium">
                    {reportType === 'attendance' ? 'Total Net Salary' : 'Summary'}
                  </td>
                  {reportType === 'attendance' ? (
                    <td className="py-3 px-2 text-right text-emerald-400 font-bold text-base">
                      ₹{Math.round(totalNetSalary).toLocaleString()}
                    </td>
                  ) : (
                    <td className="py-3 px-2 text-right text-neutral-400 italic">
                      -
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
