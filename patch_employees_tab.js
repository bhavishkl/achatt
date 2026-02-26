const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeesTab.tsx', 'utf-8');

// 1. Add state for advance modal
if (!code.includes("showAdvanceForm")) {
  code = code.replace(
    "const [loading, setLoading] = useState(false);",
    `const [loading, setLoading] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceEmpId, setAdvanceEmpId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");`
  );
}

// 2. Add button next to "Add Employee"
if (!code.includes("+ Add Advance")) {
  code = code.replace(
    /\{!showForm && \(\s+<button\s+onClick=\{\(\) => setShowForm\(true\)\}\s+className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"\s+>\s+\+ Add Employee\s+<\/button>\s+\)\}/m,
    `{!showForm && !showAdvanceForm && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanceForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Advance
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Employee
            </button>
          </div>
        )}`
  );
}

// 3. Add handleAdvanceSubmit function
if (!code.includes("handleAdvanceSubmit")) {
  code = code.replace(
    "function startEdit(emp: Employee) {",
    `async function handleAdvanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!advanceEmpId || !advanceAmount) return;

    setLoading(true);
    try {
      const res = await fetch(\`/api/employees/\${advanceEmpId}/advance\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advanceAmount: Number(advanceAmount)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Find existing emp to preserve other fields
        const emp = employees.find(e => e.id === advanceEmpId);
        if (emp) {
          updateEmployeeStore(advanceEmpId, {
            ...emp,
            advanceAmount: (emp.advanceAmount || 0) + Number(advanceAmount)
          });
        }
        setShowAdvanceForm(false);
        setAdvanceEmpId("");
        setAdvanceAmount("");
      } else {
        console.error("Failed to add advance:", data);
        alert("Failed to add advance");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(emp: Employee) {`
  );
}

// 4. Add the Advance Modal UI
if (!code.includes("Add Advance Amount")) {
  code = code.replace(
    "{showForm && (",
    `{showAdvanceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Add Advance Amount</h3>
            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Select Employee</label>
                <select
                  value={advanceEmpId}
                  onChange={(e) => setAdvanceEmpId(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="" disabled>Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  min="1"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  disabled={loading || !advanceEmpId || !advanceAmount}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Add Advance"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvanceForm(false);
                    setAdvanceEmpId("");
                    setAdvanceAmount("");
                  }}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (`
  );
}

// 5. Render Advance Amount in the Table Header
if (!code.includes("<th>Advance</th>")) {
    code = code.replace(
      "<th className=\"text-right py-3 px-3 font-medium\">Basic Salary</th>",
      "<th className=\"text-right py-3 px-3 font-medium\">Basic Salary</th>\n                <th className=\"text-right py-3 px-3 font-medium\">Advance</th>"
    );
}

// 6. Render Advance Amount in the Table Body
if (!code.includes("emp.advanceAmount")) {
    code = code.replace(
      `<td className="py-3 px-3 text-right text-neutral-300">
                    ₹{emp.basicSalary.toLocaleString()}
                  </td>`,
      `<td className="py-3 px-3 text-right text-neutral-300">
                    ₹{emp.basicSalary.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-400 font-medium">
                    ₹{(emp.advanceAmount || 0).toLocaleString()}
                  </td>`
    );
}

// 7. Update Employee Types and initial mapped fetching to include advance
if (!code.includes("advanceAmount: Number(e.advance_amount) || 0")) {
    code = code.replace(
      "basicSalary: Number(e.basic_salary),",
      "basicSalary: Number(e.basic_salary),\n              advanceAmount: Number(e.advance_amount) || 0,"
    );
}

fs.writeFileSync('src/components/EmployeesTab.tsx', code);
