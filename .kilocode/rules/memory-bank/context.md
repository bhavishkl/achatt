# Context

## Recent Changes
- Added a search filter in `src/components/ReportTab.tsx` (name/employee ID/department) and clickable row selection highlighting for employee rows in the report table.
- Updated `src/components/LeaveTab.tsx` to initialize `selectedDate` from shared localStorage key `attendance-report-period` and persist month/year back on date changes, so Attendance opens the same month selected in Reports.
- Added localStorage persistence for the Reports period selector in `src/components/ReportTab.tsx` using key `attendance-report-period`, so selected month/year (for example January) is restored after page refresh.
- Updated `src/components/ReportTab.tsx` so Attendance and Totals reports calculate per-day salary using the selected month's actual day count (`new Date(year, month + 1, 0).getDate()`) instead of a fixed 30-day divisor.
- Applied the month-based salary values consistently in table rendering, PDF export, and total net salary/footer calculations for `attendance` and `totals` report types.
- Verified the change with `npm run -s typecheck` (passes).
- Renamed the main attendance nav tab label from `Leaves` to `Attendance` in `src/app/attendance/page.tsx`.
- Reworked `src/components/LeaveTab.tsx` daily flow to remove substitute modal and add direct per-employee actions for `Leave`, `Absent`, `Present`, and `Double Duty`, with API-backed persistence.
- Extended frontend state/types in `src/lib/types.ts` and `src/lib/store.ts` with `absentRecords`, `presentRecords`, and `doubleDutyRecords`.
- Added backend APIs for new status records:
  - `src/app/api/absent-records/route.ts`
  - `src/app/api/absent-records/[id]/route.ts`
  - `src/app/api/present-records/route.ts`
  - `src/app/api/present-records/[id]/route.ts`
  - `src/app/api/double-duty-records/route.ts`
  - `src/app/api/double-duty-records/[id]/route.ts`
- Updated `src/app/api/leave-records/route.ts` to remove substitute handling from leave records.
- Updated reports in `src/components/ReportTab.tsx` and shared computation in `src/lib/store.ts` so leave/absent/present/double-duty records are included in totals, day cells, and DD counts.
- Updated `schema.json` by removing `substitute_employee_id` from `leave_records` and adding `absent_records`, `present_records`, and `double_duty_records` table definitions.
- Verified current code with `npm run -s typecheck` (passes).
