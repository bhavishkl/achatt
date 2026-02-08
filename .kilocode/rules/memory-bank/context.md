# Active Context: Attendance & Salary Manager

## Current State

**App Status**: ✅ Fully functional attendance & salary management app

The app is a single-page Next.js application with a tab-based interface for managing employees, week-off groups, holiday groups, leave groups, shift groups, and generating monthly attendance/salary reports.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Zustand state management with localStorage persistence
- [x] Employee CRUD (id, name, basic salary, department)
- [x] Week-Off Groups CRUD with day selection
- [x] Holiday Groups CRUD with date entries
- [x] Leave Groups CRUD with monthly leave count
- [x] Shift Groups CRUD with start/end times
- [x] Group-employee assignment (add/remove employees to/from groups)
- [x] Monthly Attendance Report with auto-calculated working days & salary
- [x] Tab-based homepage interface with 6 tabs
- [x] Redesigned Leave tab: daily employee view with date picker, search, mark leave/present per employee
- [x] Added LeaveRecord type for per-date leave tracking
- [x] Updated report computation to use actual leave records instead of static monthly count

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Homepage with tab interface | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles + scrollbar hide | ✅ Ready |
| `src/lib/types.ts` | TypeScript type definitions | ✅ Ready |
| `src/lib/store.ts` | Zustand store + attendance report computation | ✅ Ready |
| `src/components/EmployeesTab.tsx` | Employee CRUD UI | ✅ Ready |
| `src/components/WeekOffTab.tsx` | Week-off groups CRUD + employee assignment | ✅ Ready |
| `src/components/HolidayTab.tsx` | Holiday groups CRUD + employee assignment | ✅ Ready |
| `src/components/LeaveTab.tsx` | Leave groups CRUD + employee assignment | ✅ Ready |
| `src/components/ShiftTab.tsx` | Shift groups CRUD + employee assignment | ✅ Ready |
| `src/components/ReportTab.tsx` | Monthly attendance/salary report | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Architecture Decisions

- **State Management**: Zustand with `persist` middleware (localStorage) for client-side data persistence
- **No Database**: All data stored in browser localStorage via Zustand persist
- **Report Calculation**: Pure function `computeAttendanceReport()` computes working days and salary based on group assignments
- **Salary Formula**: `netSalary = (basicSalary / daysInMonth) * workingDays` where `workingDays = totalDays - weekOffs - holidays - leaves`

## Tab Interface

| Tab | Description |
|-----|-------------|
| 👥 Employees | CRUD for employee profiles (ID, name, salary, department) |
| 📅 Week Off | Create week-off groups, select days, assign employees |
| 🎉 Holidays | Create holiday groups with specific dates, assign employees |
| 🏖️ Leaves | Create leave groups with monthly allowance, assign employees |
| ⏰ Shifts | Create shift groups with start/end times, assign employees |
| 📊 Report | Auto-generated monthly attendance & salary report |

## Dependencies Added

- `zustand` v5.0.11 - State management with persistence

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-02-08 | Built full attendance & salary management app with tab interface, employee CRUD, 4 group types (week-off, holiday, leave, shift) with CRUD and employee assignment, and auto-calculated monthly attendance report |
