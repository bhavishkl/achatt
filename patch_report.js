const fs = require('fs');
let code = fs.readFileSync('src/components/ReportTab.tsx', 'utf-8');

// 1. reportType state
code = code.replace(
  "useState<'attendance' | 'late'>('attendance')",
  "useState<'attendance' | 'late' | 'totals'>('attendance')"
);

// 2. Report type select options
code = code.replace(
  "setReportType(e.target.value as 'attendance' | 'late')",
  "setReportType(e.target.value as 'attendance' | 'late' | 'totals')"
);
code = code.replace(
  "<option value=\"late\">Late Entry Report</option>",
  "<option value=\"late\">Late Entry Report</option>\n            <option value=\"totals\">Totals Only Report</option>"
);

// 3. handleExportPDF
let exportPDFMatch = code.match(/const title = `\$\{reportType === 'attendance' \? 'Attendance' : 'Late Entry'\} Report - \$\{MONTH_NAMES\[month\]\} \$\{year\}\$\{selectedDept !== 'All Departments' \? ` \(\$\{selectedDept\}\)` : ''\}`;/);
if (exportPDFMatch) {
  code = code.replace(
    exportPDFMatch[0],
    "const title = `${reportType === 'attendance' ? 'Attendance' : reportType === 'late' ? 'Late Entry' : 'Totals Only'} Report - ${MONTH_NAMES[month]} ${year}${selectedDept !== 'All Departments' ? ` (${selectedDept})` : ''}`;"
  );
}

let elseLateEntryReportMatch = code.match(/\} else \{\n\s+\/\/ Late Entry Report - Detailed/);
if (elseLateEntryReportMatch) {
  code = code.replace(
    /\} else \{\n\s+\/\/ Late Entry Report - Detailed/,
    `} else if (reportType === 'late') {
      // Late Entry Report - Detailed`
  );
  
  // Need to append `} else if (reportType === 'totals') { ... }` after the `autoTable(...)` for 'late' type.
  // Actually, wait, let's just do a string replace for the end of the `if/else` block in handleExportPDF.
  code = code.replace(
    "doc.save(`${reportType}_report_${year}-${String(month + 1).padStart(2, '0')}.pdf`);",
    `} else if (reportType === 'totals') {
      const headers = [
        "ID", "Name", "Dept",
        "Total", "W.Off", "Hol", "Leave", "Abs", "Present", "DD", "Late",
        "Basic", "Gross Salary"
      ];

      const body = filteredReport.map((r) => {
        let totalLateDays = 0;
        let presentDays = 0;
        const internalEmpId = empIdToInternalId.get(r.employeeId);
        
        days.forEach((d) => {
          const dateStr = \`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}-\$\{String(d).padStart(2, '0')\}\`;
          const p = punchesMap.get(\`\$\{r.employeeId\}-\$\{dateStr\}\`);
          if (p) {
            presentDays++;
            if (p.punchIn && internalEmpId) {
              const shiftStart = getShiftStartForDate(internalEmpId, dateStr);
              if (shiftStart && checkIsLate(p.punchIn, shiftStart)) {
                totalLateDays++;
              }
            }
          }
        });

        const ddCount = internalEmpId
          ? leaveRecords.filter(
            (lr) => lr.substituteEmployeeId === internalEmpId && lr.date.startsWith(\`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}\`)
          ).length
          : 0;

        return [
          r.employeeId,
          r.employeeName,
          r.department,
          r.totalDays,
          r.weekOffs,
          r.holidays,
          r.leaves,
          r.absences,
          presentDays,
          ddCount,
          totalLateDays,
          r.basicSalary.toLocaleString(),
          r.netSalary.toLocaleString()
        ];
      });

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [23, 23, 23] },
      });
    }

    doc.save(\`\$\{reportType\}_report_\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}.pdf\`);`
  );
}


// 4. UI Rendering Updates
// Update "Total Salary" card to show for 'totals' too
code = code.replace(
  "{reportType === 'attendance' ? (",
  "{reportType === 'attendance' || reportType === 'totals' ? ("
);

// Table headers - days columns
code = code.replace(
  "{days.map((d) => {",
  "{reportType !== 'totals' && days.map((d) => {"
);

// Table headers - Present vs Working, Shift, and Late Entry vs Basic/Gross
let thCodeToReplace = `<th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Working</th>
                  <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-left py-3 px-2 font-medium border-b border-neutral-700">Shift</th>
                  <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-blue-400 border-b border-neutral-700">DD</th>
                  {reportType === 'attendance' ? (
                    <>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Basic</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Per Day</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Net Salary</th>
                    </>
                  ) : (
                    <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-orange-400 border-b border-neutral-700">Late Days</th>
                  )}`;

let newThCode = `{reportType === 'totals' ? (
                    <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Present</th>
                  ) : (
                    <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Working</th>
                  )}
                  {reportType !== 'totals' && (
                    <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-left py-3 px-2 font-medium border-b border-neutral-700">Shift</th>
                  )}
                  <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-blue-400 border-b border-neutral-700">DD</th>
                  {reportType === 'attendance' ? (
                    <>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Basic</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Per Day</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Net Salary</th>
                    </>
                  ) : reportType === 'totals' ? (
                    <>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-orange-400 border-b border-neutral-700">Late Entry</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Basic</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Gross Salary</th>
                    </>
                  ) : (
                    <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-orange-400 border-b border-neutral-700">Late Days</th>
                  )}`;
code = code.replace(thCodeToReplace, newThCode);

// Table body iteration map logic updates
let totalLateDaysMatch = `let totalLateDays = 0;

                  // Pre-calculate late days if needed for summary
                  // We also need it for rendering the cell if reportType is 'late'
                  // To avoid double loop, we can just calculate on the fly or memoize, 
                  // but the loop inside map is cheap enough.
                  if (reportType === 'late') {
                    const internalId = empIdToInternalId.get(r.employeeId);

                    days.forEach(d => {
                      const dateStr = \`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}-\$\{String(d).padStart(2, '0')\}\`;
                      const p = punchesMap.get(\`\$\{r.employeeId\}-\$\{dateStr\}\`);
                      if (p && p.punchIn && internalId) {
                        const shiftStart = getShiftStartForDate(internalId, dateStr);
                        if (shiftStart && checkIsLate(p.punchIn, shiftStart)) {
                          totalLateDays++;
                        }
                      }
                    });
                  }`;
let newTotalLateDaysMatch = `let totalLateDays = 0;
                  let presentDays = 0;
                  if (reportType === 'late' || reportType === 'totals') {
                    const internalId = empIdToInternalId.get(r.employeeId);
                    days.forEach(d => {
                      const dateStr = \`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}-\$\{String(d).padStart(2, '0')\}\`;
                      const p = punchesMap.get(\`\$\{r.employeeId\}-\$\{dateStr\}\`);
                      if (p) {
                        presentDays++;
                        if (p.punchIn && internalId) {
                          const shiftStart = getShiftStartForDate(internalId, dateStr);
                          if (shiftStart && checkIsLate(p.punchIn, shiftStart)) {
                            totalLateDays++;
                          }
                        }
                      }
                    });
                  }`;
code = code.replace(totalLateDaysMatch, newTotalLateDaysMatch);


// Table body per-day cells condition
code = code.replace(
  "{/* Per-day cells */}\n                      {days.map((d) => {",
  "{/* Per-day cells */}\n                      {reportType !== 'totals' && days.map((d) => {"
);

// Table body Working, Shift, and Net/Basic cells
let tdCodeToReplace = `<td className="py-2 px-2 text-right text-emerald-400 font-medium border-b border-neutral-800">
                        {r.workingDays}
                      </td>
                      <td className="py-2 px-2 text-neutral-400 text-xs border-b border-neutral-800">{r.shiftInfo}</td>
                      <td className="py-2 px-2 text-right text-blue-400 font-medium border-b border-neutral-800">
                        {(() => {
                          const intId = empIdToInternalId.get(r.employeeId);
                          const monthPrefix = \`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}\`;
                          const ddCount = intId
                            ? leaveRecords.filter((lr) => lr.substituteEmployeeId === intId && lr.date.startsWith(monthPrefix)).length
                            : 0;
                          return ddCount;
                        })()}
                      </td>

                      {reportType === 'attendance' ? (
                        <>
                          <td className="py-2 px-2 text-right text-neutral-300 border-b border-neutral-800">
                            ₹{r.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-400 border-b border-neutral-800">
                            ₹{r.perDaySalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-semibold border-b border-neutral-800">
                            ₹{r.netSalary.toLocaleString()}
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-2 text-right text-orange-400 font-bold border-b border-neutral-800">
                          {totalLateDays}
                        </td>
                      )}`;

let newTdCode = `{reportType === 'totals' ? (
                        <td className="py-2 px-2 text-right text-emerald-400 font-medium border-b border-neutral-800">
                          {presentDays}
                        </td>
                      ) : (
                        <td className="py-2 px-2 text-right text-emerald-400 font-medium border-b border-neutral-800">
                          {r.workingDays}
                        </td>
                      )}
                      
                      {reportType !== 'totals' && (
                        <td className="py-2 px-2 text-neutral-400 text-xs border-b border-neutral-800">{r.shiftInfo}</td>
                      )}
                      
                      <td className="py-2 px-2 text-right text-blue-400 font-medium border-b border-neutral-800">
                        {(() => {
                          const intId = empIdToInternalId.get(r.employeeId);
                          const monthPrefix = \`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}\`;
                          const ddCount = intId
                            ? leaveRecords.filter((lr) => lr.substituteEmployeeId === intId && lr.date.startsWith(monthPrefix)).length
                            : 0;
                          return ddCount;
                        })()}
                      </td>

                      {reportType === 'attendance' ? (
                        <>
                          <td className="py-2 px-2 text-right text-neutral-300 border-b border-neutral-800">
                            ₹{r.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-400 border-b border-neutral-800">
                            ₹{r.perDaySalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-semibold border-b border-neutral-800">
                            ₹{r.netSalary.toLocaleString()}
                          </td>
                        </>
                      ) : reportType === 'totals' ? (
                        <>
                          <td className="py-2 px-2 text-right text-orange-400 font-bold border-b border-neutral-800">
                            {totalLateDays}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-300 border-b border-neutral-800">
                            ₹{r.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-semibold border-b border-neutral-800">
                            ₹{r.netSalary.toLocaleString()}
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-2 text-right text-orange-400 font-bold border-b border-neutral-800">
                          {totalLateDays}
                        </td>
                      )}`;

code = code.replace(tdCodeToReplace, newTdCode);


// Footer update
let footerCodeToReplace = `<tfoot className="sticky bottom-0 z-20 bg-neutral-900 shadow-[0_-1px_0_rgba(64,64,64,1)]">
                <tr>
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
              </tfoot>`;

let newFooterCode = `<tfoot className="sticky bottom-0 z-20 bg-neutral-900 shadow-[0_-1px_0_rgba(64,64,64,1)]">
                <tr>
                  <td colSpan={reportType === 'totals' ? 12 : 11} className="py-3 px-2 text-right text-neutral-400 font-medium">
                    {reportType === 'attendance' || reportType === 'totals' ? 'Total Net Salary' : 'Summary'}
                  </td>
                  {reportType === 'attendance' || reportType === 'totals' ? (
                    <td colSpan={reportType === 'totals' ? 1 : 1} className="py-3 px-2 text-right text-emerald-400 font-bold text-base">
                      ₹{Math.round(totalNetSalary).toLocaleString()}
                    </td>
                  ) : (
                    <td className="py-3 px-2 text-right text-neutral-400 italic">
                      -
                    </td>
                  )}
                </tr>
              </tfoot>`;
code = code.replace(footerCodeToReplace, newFooterCode);

fs.writeFileSync('src/components/ReportTab.tsx', code);
