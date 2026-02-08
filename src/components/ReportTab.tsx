"use client";

import { useState, useMemo } from "react";
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

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const report = useMemo(
    () =>
      computeAttendanceReport(
        employees,
        weekOffGroups,
        holidayGroups,
        leaveGroups,
        shiftGroups,
        leaveRecords,
        year,
        month,
      ),
    [employees, weekOffGroups, holidayGroups, leaveGroups, shiftGroups, leaveRecords, year, month],
  );

  const totalNetSalary = report.reduce((sum, r) => sum + r.netSalary, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-white">Monthly Attendance Report</h2>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-24 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Total Salary</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                ₹{Math.round(totalNetSalary).toLocaleString()}
              </p>
            </div>
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
                  <th className="text-right py-3 px-2 font-medium">Total</th>
                  <th className="text-right py-3 px-2 font-medium">W.Off</th>
                  <th className="text-right py-3 px-2 font-medium">Hol.</th>
                  <th className="text-right py-3 px-2 font-medium">Leave</th>
                  <th className="text-right py-3 px-2 font-medium">Working</th>
                  <th className="text-left py-3 px-2 font-medium">Shift</th>
                  <th className="text-right py-3 px-2 font-medium">Basic</th>
                  <th className="text-right py-3 px-2 font-medium">Per Day</th>
                  <th className="text-right py-3 px-2 font-medium">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr
                    key={r.employeeId}
                    className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="py-3 px-2 text-neutral-300 font-mono text-xs">
                      {r.employeeId}
                    </td>
                    <td className="py-3 px-2 text-white">{r.employeeName}</td>
                    <td className="py-3 px-2 text-neutral-400">{r.department}</td>
                    <td className="py-3 px-2 text-right text-neutral-300">{r.totalDays}</td>
                    <td className="py-3 px-2 text-right text-orange-400">{r.weekOffs}</td>
                    <td className="py-3 px-2 text-right text-purple-400">{r.holidays}</td>
                    <td className="py-3 px-2 text-right text-yellow-400">{r.leaves}</td>
                    <td className="py-3 px-2 text-right text-emerald-400 font-medium">
                      {r.workingDays}
                    </td>
                    <td className="py-3 px-2 text-neutral-400 text-xs">{r.shiftInfo}</td>
                    <td className="py-3 px-2 text-right text-neutral-300">
                      ₹{r.basicSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-neutral-400">
                      ₹{r.perDaySalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-400 font-semibold">
                      ₹{r.netSalary.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-600">
                  <td colSpan={11} className="py-3 px-2 text-right text-neutral-400 font-medium">
                    Total Net Salary
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-400 font-bold text-base">
                    ₹{Math.round(totalNetSalary).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
