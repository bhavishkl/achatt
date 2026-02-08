import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Employee,
  WeekOffGroup,
  HolidayGroup,
  LeaveGroup,
  ShiftGroup,
  HolidayEntry,
} from "./types";

// ============================================================
// Helper – generate a short unique id
// ============================================================
let _counter = 0;
function uid(): string {
  _counter += 1;
  return `${Date.now()}-${_counter}-${Math.random().toString(36).slice(2, 7)}`;
}

// ============================================================
// Store interface
// ============================================================
interface AppState {
  // --- Employees ---
  employees: Employee[];
  addEmployee: (e: Omit<Employee, "id" | "createdAt">) => void;
  updateEmployee: (id: string, e: Partial<Omit<Employee, "id" | "createdAt">>) => void;
  deleteEmployee: (id: string) => void;

  // --- Week-Off Groups ---
  weekOffGroups: WeekOffGroup[];
  addWeekOffGroup: (g: Omit<WeekOffGroup, "id" | "employeeIds">) => void;
  updateWeekOffGroup: (id: string, g: Partial<Omit<WeekOffGroup, "id">>) => void;
  deleteWeekOffGroup: (id: string) => void;

  // --- Holiday Groups ---
  holidayGroups: HolidayGroup[];
  addHolidayGroup: (g: Omit<HolidayGroup, "id" | "employeeIds">) => void;
  updateHolidayGroup: (id: string, g: Partial<Omit<HolidayGroup, "id">>) => void;
  deleteHolidayGroup: (id: string) => void;

  // --- Leave Groups ---
  leaveGroups: LeaveGroup[];
  addLeaveGroup: (g: Omit<LeaveGroup, "id" | "employeeIds">) => void;
  updateLeaveGroup: (id: string, g: Partial<Omit<LeaveGroup, "id">>) => void;
  deleteLeaveGroup: (id: string) => void;

  // --- Shift Groups ---
  shiftGroups: ShiftGroup[];
  addShiftGroup: (g: Omit<ShiftGroup, "id" | "employeeIds">) => void;
  updateShiftGroup: (id: string, g: Partial<Omit<ShiftGroup, "id">>) => void;
  deleteShiftGroup: (id: string) => void;

  // --- Group membership helpers ---
  addEmployeeToGroup: (
    groupType: "weekoff" | "holiday" | "leave" | "shift",
    groupId: string,
    employeeId: string,
  ) => void;
  removeEmployeeFromGroup: (
    groupType: "weekoff" | "holiday" | "leave" | "shift",
    groupId: string,
    employeeId: string,
  ) => void;
}

// ============================================================
// Store implementation
// ============================================================
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ---- Employees ----
      employees: [],
      addEmployee: (e) =>
        set((s) => ({
          employees: [
            ...s.employees,
            { ...e, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateEmployee: (id, data) =>
        set((s) => ({
          employees: s.employees.map((emp) =>
            emp.id === id ? { ...emp, ...data } : emp,
          ),
        })),
      deleteEmployee: (id) =>
        set((s) => ({
          employees: s.employees.filter((emp) => emp.id !== id),
          // Also remove from all groups
          weekOffGroups: s.weekOffGroups.map((g) => ({
            ...g,
            employeeIds: g.employeeIds.filter((eid) => eid !== id),
          })),
          holidayGroups: s.holidayGroups.map((g) => ({
            ...g,
            employeeIds: g.employeeIds.filter((eid) => eid !== id),
          })),
          leaveGroups: s.leaveGroups.map((g) => ({
            ...g,
            employeeIds: g.employeeIds.filter((eid) => eid !== id),
          })),
          shiftGroups: s.shiftGroups.map((g) => ({
            ...g,
            employeeIds: g.employeeIds.filter((eid) => eid !== id),
          })),
        })),

      // ---- Week-Off Groups ----
      weekOffGroups: [],
      addWeekOffGroup: (g) =>
        set((s) => ({
          weekOffGroups: [...s.weekOffGroups, { ...g, id: uid(), employeeIds: [] }],
        })),
      updateWeekOffGroup: (id, data) =>
        set((s) => ({
          weekOffGroups: s.weekOffGroups.map((g) =>
            g.id === id ? { ...g, ...data } : g,
          ),
        })),
      deleteWeekOffGroup: (id) =>
        set((s) => ({
          weekOffGroups: s.weekOffGroups.filter((g) => g.id !== id),
        })),

      // ---- Holiday Groups ----
      holidayGroups: [],
      addHolidayGroup: (g) =>
        set((s) => ({
          holidayGroups: [...s.holidayGroups, { ...g, id: uid(), employeeIds: [] }],
        })),
      updateHolidayGroup: (id, data) =>
        set((s) => ({
          holidayGroups: s.holidayGroups.map((g) =>
            g.id === id ? { ...g, ...data } : g,
          ),
        })),
      deleteHolidayGroup: (id) =>
        set((s) => ({
          holidayGroups: s.holidayGroups.filter((g) => g.id !== id),
        })),

      // ---- Leave Groups ----
      leaveGroups: [],
      addLeaveGroup: (g) =>
        set((s) => ({
          leaveGroups: [...s.leaveGroups, { ...g, id: uid(), employeeIds: [] }],
        })),
      updateLeaveGroup: (id, data) =>
        set((s) => ({
          leaveGroups: s.leaveGroups.map((g) =>
            g.id === id ? { ...g, ...data } : g,
          ),
        })),
      deleteLeaveGroup: (id) =>
        set((s) => ({
          leaveGroups: s.leaveGroups.filter((g) => g.id !== id),
        })),

      // ---- Shift Groups ----
      shiftGroups: [],
      addShiftGroup: (g) =>
        set((s) => ({
          shiftGroups: [...s.shiftGroups, { ...g, id: uid(), employeeIds: [] }],
        })),
      updateShiftGroup: (id, data) =>
        set((s) => ({
          shiftGroups: s.shiftGroups.map((g) =>
            g.id === id ? { ...g, ...data } : g,
          ),
        })),
      deleteShiftGroup: (id) =>
        set((s) => ({
          shiftGroups: s.shiftGroups.filter((g) => g.id !== id),
        })),

      // ---- Group membership ----
      addEmployeeToGroup: (groupType, groupId, employeeId) =>
        set((s) => {
          const key = groupKeyMap[groupType];
          return {
            [key]: (s[key] as GroupUnion[]).map((g) =>
              g.id === groupId && !g.employeeIds.includes(employeeId)
                ? { ...g, employeeIds: [...g.employeeIds, employeeId] }
                : g,
            ),
          } as Partial<AppState>;
        }),
      removeEmployeeFromGroup: (groupType, groupId, employeeId) =>
        set((s) => {
          const key = groupKeyMap[groupType];
          return {
            [key]: (s[key] as GroupUnion[]).map((g) =>
              g.id === groupId
                ? { ...g, employeeIds: g.employeeIds.filter((eid) => eid !== employeeId) }
                : g,
            ),
          } as Partial<AppState>;
        }),
    }),
    { name: "attendance-salary-app" },
  ),
);

// ---- helpers ----
type GroupUnion = WeekOffGroup | HolidayGroup | LeaveGroup | ShiftGroup;

const groupKeyMap: Record<
  "weekoff" | "holiday" | "leave" | "shift",
  keyof AppState
> = {
  weekoff: "weekOffGroups",
  holiday: "holidayGroups",
  leave: "leaveGroups",
  shift: "shiftGroups",
};

// ============================================================
// Attendance report computation (pure function)
// ============================================================
export function computeAttendanceReport(
  employees: Employee[],
  weekOffGroups: WeekOffGroup[],
  holidayGroups: HolidayGroup[],
  leaveGroups: LeaveGroup[],
  shiftGroups: ShiftGroup[],
  year: number,
  month: number, // 0-based
) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return employees.map((emp) => {
    // Week-offs for this employee
    const empWeekOff = weekOffGroups.find((g) =>
      g.employeeIds.includes(emp.id),
    );
    let weekOffs = 0;
    if (empWeekOff) {
      for (let d = 1; d <= daysInMonth; d++) {
        const dayOfWeek = new Date(year, month, d).getDay();
        if (empWeekOff.daysOff.includes(dayOfWeek)) weekOffs++;
      }
    }

    // Holidays for this employee in the month
    const empHoliday = holidayGroups.find((g) =>
      g.employeeIds.includes(emp.id),
    );
    let holidays = 0;
    if (empHoliday) {
      holidays = empHoliday.holidays.filter((h) => {
        const d = new Date(h.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;
    }

    // Leaves
    const empLeave = leaveGroups.find((g) =>
      g.employeeIds.includes(emp.id),
    );
    const leaves = empLeave ? empLeave.leavesPerMonth : 0;

    // Shift
    const empShift = shiftGroups.find((g) =>
      g.employeeIds.includes(emp.id),
    );
    const shiftInfo = empShift
      ? `${empShift.name} (${empShift.startTime} – ${empShift.endTime})`
      : "—";

    const workingDays = Math.max(0, daysInMonth - weekOffs - holidays - leaves);
    const perDaySalary = emp.basicSalary / daysInMonth;
    const netSalary = perDaySalary * workingDays;

    return {
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      basicSalary: emp.basicSalary,
      totalDays: daysInMonth,
      weekOffs,
      holidays,
      leaves,
      workingDays,
      perDaySalary: Math.round(perDaySalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      shiftInfo,
    };
  });
}
