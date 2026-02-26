const fs = require('fs');
let code = fs.readFileSync('src/app/api/employees/route.ts', 'utf-8');

if (!code.includes("advance_amount")) {
  code = code.replace(
    /from\("employees"\)\s+\.select\("\*"\)/,
    'from("employees")\n      .select("*, advance_amount")'
  );
  if(!code.includes('advance_amount')){
      code = code.replace(
        /from\("employees"\)\s+\.select\(\)/,
        'from("employees")\n      .select("*, advance_amount")'
      );
  }
}
fs.writeFileSync('src/app/api/employees/route.ts', code);
