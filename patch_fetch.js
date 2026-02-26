const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeesTab.tsx', 'utf-8');

if (!code.includes("advance_amount, created_at")) {
    code = code.replace(
      "id: e.id,",
      "id: e.id,\n              advanceAmount: Number(e.advance_amount) || 0,"
    );
}

fs.writeFileSync('src/components/EmployeesTab.tsx', code);
