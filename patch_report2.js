const fs = require('fs');
let code = fs.readFileSync('src/components/ReportTab.tsx', 'utf-8');

// 1. Add state for input fields in ReportTab
if (!code.includes("const [deductions, setDeductions]")) {
  code = code.replace(
    "const [selectedDept, setSelectedDept] = useState<string>(\"All Departments\");",
    `const [selectedDept, setSelectedDept] = useState<string>("All Departments");
  const [deductions, setDeductions] = useState<Record<string, { advance: number, lateEntry: number }>>({});`
  );
}

// 2. Add deduction handler
if (!code.includes("handleDeductionChange")) {
  code = code.replace(
    "const handlePrint = () => {",
    `const handleDeductionChange = (empId: string, field: 'advance' | 'lateEntry', value: string) => {
    const numValue = Number(value) || 0;
    setDeductions(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { advance: 0, lateEntry: 0 }),
        [field]: numValue
      }
    }));
  };

  const handlePrint = () => {`
  );
}

// 3. Update 'totals' PDF export to include new columns and calculated gross salary
if (!code.includes(`"Advance Ded.", "Late Ded."`)) {
  code = code.replace(
    `const headers = [
        "ID", "Name", "Dept",
        "Total", "W.Off", "Hol", "Leave", "Abs", "Present", "DD", "Late",
        "Basic", "Gross Salary"
      ];`,
    `const headers = [
        "ID", "Name", "Dept",
        "Total", "W.Off", "Hol", "Leave", "Abs", "Present", "DD", "Late",
        "Basic", "Advance Ded.", "Late Ded.", "Gross Salary"
      ];`
  );
  
  code = code.replace(
    `const ddCount = internalEmpId
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
        ];`,
    `const ddCount = internalEmpId
          ? leaveRecords.filter(
            (lr) => lr.substituteEmployeeId === internalEmpId && lr.date.startsWith(\`\$\{year\}-\$\{String(month + 1).padStart(2, '0')\}\`)
          ).length
          : 0;

        const empDeds = deductions[r.employeeId] || { advance: 0, lateEntry: 0 };
        const finalGrossSalary = r.netSalary - empDeds.advance - empDeds.lateEntry;

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
          empDeds.advance.toLocaleString(),
          empDeds.lateEntry.toLocaleString(),
          finalGrossSalary.toLocaleString()
        ];`
  );

  code = code.replace(
    `10: { textColor: [217, 119, 6], fontStyle: 'bold' }, // Late
          12: { textColor: [5, 150, 105], fontStyle: 'bold' } // Gross Salary`,
    `10: { textColor: [217, 119, 6], fontStyle: 'bold' }, // Late
          12: { textColor: [220, 38, 38] }, // Advance Ded
          13: { textColor: [220, 38, 38] }, // Late Ded
          14: { textColor: [5, 150, 105], fontStyle: 'bold' } // Gross Salary`
  );
}


// 4. UI Totals Headers
if (!code.includes(`<th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Advance Ded.</th>`)) {
  let totalsThs = `<th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-orange-400 border-b border-neutral-700">Late Entry</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Basic</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Gross Salary</th>`;
                      
  let newTotalsThs = `<th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium text-orange-400 border-b border-neutral-700">Late Entry</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Basic</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Advance Ded.</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Late Ded.</th>
                      <th className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm text-right py-3 px-2 font-medium border-b border-neutral-700">Gross Salary</th>`;
                      
  code = code.replace(totalsThs, newTotalsThs);
}

// 5. UI Totals Body
if (!code.includes(`onChange={(e) => handleDeductionChange(r.employeeId, 'advance', e.target.value)}`)) {
  let totalsTds = `<td className="py-2 px-2 text-right text-orange-400 font-bold border-b border-neutral-800">
                            {totalLateDays}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-300 border-b border-neutral-800">
                            ₹{r.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-semibold border-b border-neutral-800">
                            ₹{r.netSalary.toLocaleString()}
                          </td>`;
                          
  let newTotalsTds = `<td className="py-2 px-2 text-right text-orange-400 font-bold border-b border-neutral-800">
                            {totalLateDays}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-300 border-b border-neutral-800">
                            ₹{r.basicSalary.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right border-b border-neutral-800">
                            <input 
                              type="number" 
                              className="w-16 bg-neutral-800 border border-neutral-700 rounded px-1 py-1 text-xs text-white text-right"
                              value={deductions[r.employeeId]?.advance || ''}
                              onChange={(e) => handleDeductionChange(r.employeeId, 'advance', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 px-2 text-right border-b border-neutral-800">
                            <input 
                              type="number" 
                              className="w-16 bg-neutral-800 border border-neutral-700 rounded px-1 py-1 text-xs text-white text-right"
                              value={deductions[r.employeeId]?.lateEntry || ''}
                              onChange={(e) => handleDeductionChange(r.employeeId, 'lateEntry', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-semibold border-b border-neutral-800">
                            ₹{(r.netSalary - (deductions[r.employeeId]?.advance || 0) - (deductions[r.employeeId]?.lateEntry || 0)).toLocaleString()}
                          </td>`;
                          
  code = code.replace(totalsTds, newTotalsTds);
}

// 6. Fix Total Net Salary in footer
if (!code.includes("const currentTotalNetSalary =")) {
  code = code.replace(
    "const totalNetSalary = filteredReport.reduce((sum, r) => sum + r.netSalary, 0);",
    `const totalNetSalary = filteredReport.reduce((sum, r) => sum + r.netSalary, 0);
  
  const currentTotalNetSalary = useMemo(() => {
    return filteredReport.reduce((sum, r) => {
      if (reportType === 'totals') {
         const empDeds = deductions[r.employeeId] || { advance: 0, lateEntry: 0 };
         return sum + (r.netSalary - empDeds.advance - empDeds.lateEntry);
      }
      return sum + r.netSalary;
    }, 0);
  }, [filteredReport, reportType, deductions]);`
  );
  
  // Replace the usage of totalNetSalary in the UI summary cards
  code = code.replace(
    "₹{Math.round(totalNetSalary).toLocaleString()}",
    "₹{Math.round(currentTotalNetSalary).toLocaleString()}"
  );
  code = code.replace(
    "₹{Math.round(totalNetSalary).toLocaleString()}",
    "₹{Math.round(currentTotalNetSalary).toLocaleString()}"
  );
}

// 7. Update Footer ColSpan
if (!code.includes("colSpan={reportType === 'totals' ? 14 : 11}")) {
    code = code.replace(
      "colSpan={reportType === 'totals' ? 12 : 11}",
      "colSpan={reportType === 'totals' ? 14 : 11}"
    );
}

fs.writeFileSync('src/components/ReportTab.tsx', code);
