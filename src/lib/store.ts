import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Employee,
  WeekOffGroup,
  HolidayGroup,
  LeaveGroup,
  LeaveRecord,
  ShiftGroup,
  ShiftRotation,
  HolidayEntry,
  PunchRecord,
  ProcessedPunch,
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
  // --- Punch Records ---
  punchRecords: PunchRecord[];
  processedPunches: ProcessedPunch[];
  addPunchRecords: (records: PunchRecord[]) => void;
  clearPunchRecords: () => void;

  // --- Employees ---
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (e: Omit<Employee, "id" | "createdAt">) => void;
  updateEmployee: (id: string, e: Partial<Omit<Employee, "id" | "createdAt">>) => void;
  deleteEmployee: (id: string) => void;

  // --- Company Context ---
  companyId: string | null;
  setCompanyId: (id: string | null) => void;

  // --- Week-Off Groups ---
  weekOffGroups: WeekOffGroup[];
  setWeekOffGroups: (groups: WeekOffGroup[]) => void;
  addWeekOffGroup: (g: Omit<WeekOffGroup, "id" | "employeeIds">) => void;
  updateWeekOffGroup: (id: string, g: Partial<Omit<WeekOffGroup, "id">>) => void;
  deleteWeekOffGroup: (id: string) => void;

  // --- Holiday Groups ---
  holidayGroups: HolidayGroup[];
  setHolidayGroups: (groups: HolidayGroup[]) => void;
  addHolidayGroup: (g: Omit<HolidayGroup, "id" | "employeeIds">) => void;
  updateHolidayGroup: (id: string, g: Partial<Omit<HolidayGroup, "id">>) => void;
  deleteHolidayGroup: (id: string) => void;

  // --- Leave Groups ---
  leaveGroups: LeaveGroup[];
  setLeaveGroups: (groups: LeaveGroup[]) => void;
  addLeaveGroup: (g: Omit<LeaveGroup, "id" | "employeeIds">) => void;
  updateLeaveGroup: (id: string, g: Partial<Omit<LeaveGroup, "id">>) => void;
  deleteLeaveGroup: (id: string) => void;

  // --- Shift Groups ---
  shiftGroups: ShiftGroup[];
  setShiftGroups: (groups: ShiftGroup[]) => void;
  addShiftGroup: (g: Omit<ShiftGroup, "id" | "employeeIds">) => void;
  updateShiftGroup: (id: string, g: Partial<Omit<ShiftGroup, "id">>) => void;
  deleteShiftGroup: (id: string) => void;

  // --- Shift Rotations ---
  shiftRotations: ShiftRotation[];
  setShiftRotations: (rotations: ShiftRotation[]) => void;
  addShiftRotation: (r: ShiftRotation) => void;
  deleteShiftRotation: (id: string) => void;

  // --- Leave Records (per-date) ---
  leaveRecords: LeaveRecord[];
  setLeaveRecords: (records: LeaveRecord[]) => void;
  addLeaveRecord: (employeeId: string, date: string, reason: string) => void;
  removeLeaveRecord: (id: string) => void;

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
      // ---- Punch Records ----
      punchRecords: [],
      processedPunches: [],
      addPunchRecords: (records) =>
        set((s) => {
          // Add new records
          const newRecords = [...s.punchRecords, ...records];
          
          // Process punches with current employee + rotation context
          const processed = processPunchRecords(newRecords, s.employees, s.shiftRotations);
          
          return {
            punchRecords: newRecords,
            processedPunches: processed,
          };
        }),
      clearPunchRecords: () =>
        set(() => ({
          punchRecords: [],
          processedPunches: [],
        })),

      // ---- Employees ----
      employees: [],
      setEmployees: (employees) =>
        set((s) => ({
          employees,
          processedPunches: processPunchRecords(s.punchRecords, employees, s.shiftRotations),
        })),
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
          // Also remove from all groups and leave records
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
          shiftRotations: s.shiftRotations.filter((r) => r.employeeId !== id),
          leaveRecords: s.leaveRecords.filter((r) => r.employeeId !== id),
        })),

      // ---- Company Context ----
      companyId: null,
      setCompanyId: (id) => set({ companyId: id }),

      // ---- Week-Off Groups ----
      weekOffGroups: [],
      setWeekOffGroups: (groups) => set({ weekOffGroups: groups }),
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
      setHolidayGroups: (groups) => set({ holidayGroups: groups }),
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
      setLeaveGroups: (groups) => set({ leaveGroups: groups }),
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
      setShiftGroups: (groups) => set({ shiftGroups: groups }),
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

      // ---- Shift Rotations ----
      shiftRotations: [],
      setShiftRotations: (rotations) =>
        set((s) => ({
          shiftRotations: rotations,
          processedPunches: processPunchRecords(s.punchRecords, s.employees, rotations),
        })),
      addShiftRotation: (r) =>
        set((s) => ({
          shiftRotations: [...s.shiftRotations, r],
          processedPunches: processPunchRecords(
            s.punchRecords,
            s.employees,
            [...s.shiftRotations, r],
          ),
        })),
      deleteShiftRotation: (id) =>
        set((s) => {
          const nextRotations = s.shiftRotations.filter((r) => r.id !== id);
          return {
            shiftRotations: nextRotations,
            processedPunches: processPunchRecords(s.punchRecords, s.employees, nextRotations),
          };
        }),

      // ---- Leave Records (per-date) ----
      leaveRecords: [],
      setLeaveRecords: (records) => set({ leaveRecords: records }),
      addLeaveRecord: (employeeId, date, reason) =>
        set((s) => ({
          leaveRecords: [
            ...s.leaveRecords,
            { id: uid(), employeeId, date, reason },
          ],
        })),
      removeLeaveRecord: (id) =>
        set((s) => ({
          leaveRecords: s.leaveRecords.filter((r) => r.id !== id),
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
// Punch Record Processing
// ============================================================
function processPunchRecords(
  records: PunchRecord[],
  employees: Employee[],
  shiftRotations: ShiftRotation[],
): ProcessedPunch[] {
  const toTimeString = (isoDateTime: string) =>
    new Date(isoDateTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  // Map external employeeId (punch files) -> internal employee id (rotations)
  const externalToInternal = new Map<string, string>();
  employees.forEach((emp) => {
    externalToInternal.set(emp.employeeId, emp.id);
  });

  // Group records per employee per date.
  const byEmpDate = new Map<string, Map<string, PunchRecord[]>>();
  records.forEach((record) => {
    let dateMap = byEmpDate.get(record.employeeId);
    if (!dateMap) {
      dateMap = new Map<string, PunchRecord[]>();
      byEmpDate.set(record.employeeId, dateMap);
    }
    const dayPunches = dateMap.get(record.date) ?? [];
    dayPunches.push(record);
    dateMap.set(record.date, dayPunches);
  });

  byEmpDate.forEach((dateMap) => {
    dateMap.forEach((dayPunches, date) => {
      dayPunches.sort(
        (a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime(),
      );
      dateMap.set(date, dayPunches);
    });
  });

  // Build lookup for night shift ranges by internal employee id.
  const nightRangesByEmp = new Map<string, { startDate: string; endDate: string }[]>();
  shiftRotations.forEach((rotation) => {
    if (rotation.shiftType !== "night") return;
    const existing = nightRangesByEmp.get(rotation.employeeId) ?? [];
    existing.push({ startDate: rotation.startDate, endDate: rotation.endDate });
    nightRangesByEmp.set(rotation.employeeId, existing);
  });

  const isNightShiftDate = (externalEmployeeId: string, date: string) => {
    const internalId = externalToInternal.get(externalEmployeeId);
    if (!internalId) return false;
    const ranges = nightRangesByEmp.get(internalId);
    if (!ranges || ranges.length === 0) return false;
    return ranges.some((r) => date >= r.startDate && date <= r.endDate);
  };

  const nextDateString = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const consumedFirstPunch = new Set<string>(); // key: employeeId-date
  const processed: ProcessedPunch[] = [];

  byEmpDate.forEach((dateMap, employeeId) => {
    const sortedDates = Array.from(dateMap.keys()).sort();

    sortedDates.forEach((date) => {
      const todayPunches = dateMap.get(date) ?? [];
      const consumeTodayFirst = consumedFirstPunch.has(`${employeeId}-${date}`);
      const usableToday = consumeTodayFirst ? todayPunches.slice(1) : todayPunches;

      let punchIn: string | null = null;
      let punchOut: string | null = null;

      if (isNightShiftDate(employeeId, date)) {
        // Night rotation rule:
        // - punchIn: 2nd punch of the date
        // - punchOut: 1st punch of the next date
        const inSource = todayPunches[1];
        if (inSource) {
          punchIn = toTimeString(inSource.punchTime);
        }

        const nextDate = nextDateString(date);
        const nextDayPunches = dateMap.get(nextDate) ?? [];
        const nextDayFirst = nextDayPunches[0];
        if (nextDayFirst) {
          punchOut = toTimeString(nextDayFirst.punchTime);
          consumedFirstPunch.add(`${employeeId}-${nextDate}`);
        }
      } else if (usableToday.length >= 2) {
        punchIn = toTimeString(usableToday[0].punchTime);
        punchOut = toTimeString(usableToday[usableToday.length - 1].punchTime);
      } else if (usableToday.length === 1) {
        punchIn = toTimeString(usableToday[0].punchTime);
      }

      const status: "present" | "absent" | "missed" =
        punchIn && punchOut ? "present" : punchIn ? "missed" : "absent";

      processed.push({
        employeeId,
        date,
        punchIn,
        punchOut,
        status,
      });
    });
  });

  return processed.sort(
    (a, b) =>
      a.employeeId.localeCompare(b.employeeId) ||
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

// ============================================================
// Attendance report computation (pure function)
// ============================================================
export function computeAttendanceReport(
  employees: Employee[],
  weekOffGroups: WeekOffGroup[],
  holidayGroups: HolidayGroup[],
  leaveGroups: LeaveGroup[],
  shiftGroups: ShiftGroup[],
  leaveRecords: LeaveRecord[],
  processedPunches: ProcessedPunch[],
  year: number,
  month: number, // 0-based
) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build a YYYY-MM prefix for filtering leave records
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  return employees.map((emp) => {
    // Week-offs for this employee — compute exact week-off dates for the month
    const empWeekOff = weekOffGroups.find((g) => g.employeeIds.includes(emp.id));
    const weekOffDateSet = new Set<string>();
    if (empWeekOff) {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dayOfWeek = dateObj.getDay();
        if (empWeekOff.daysOff.includes(dayOfWeek)) {
          weekOffDateSet.add(
            `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
          );
        }
      }
    }
    const weekOffs = weekOffDateSet.size;
    const weekOffDates = Array.from(weekOffDateSet).sort();

    // Holidays for this employee in the month (aggregate across all holiday groups)
    const holidayDateSet = new Set<string>();
    holidayGroups.forEach((g) => {
      if (!g.employeeIds.includes(emp.id)) return;
      g.holidays.forEach((h) => {
        const d = new Date(h.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          holidayDateSet.add(h.date);
        }
      });
    });
    const holidays = holidayDateSet.size;
    const holidayDates = Array.from(holidayDateSet).sort();

    // Leaves – count actual leave records for this employee in the month
    const leaves = leaveRecords.filter(
      (r) => r.employeeId === emp.id && r.date.startsWith(monthPrefix),
    ).length;

    // Also check leave group allowance (for reference, but actual count from records)
    const empLeaveGroup = leaveGroups.find((g) =>
      g.employeeIds.includes(emp.id),
    );
    const _leaveAllowance = empLeaveGroup ? empLeaveGroup.leavesPerMonth : 0;
    void _leaveAllowance; // available for future use

    // Build a set of dates (YYYY-MM-DD) where we have any punch record for this employee
    const punchDateSet = new Set<string>();
    processedPunches.forEach((pp) => {
      if (pp.employeeId === emp.employeeId) {
        const d = new Date(pp.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          punchDateSet.add(pp.date);
        }
      }
    });

    // Count absences: days that are NOT (holiday | week-off | leave | have a punch)
    let absences = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

      const isHoliday = holidayDateSet.has(dateStr);
      const isWeekOff = weekOffDateSet.has(dateStr);
      const isLeave = leaveRecords.some((lr) => lr.employeeId === emp.id && lr.date === dateStr);
      const hasPunch = punchDateSet.has(dateStr);

      if (!isHoliday && !isWeekOff && !isLeave && !hasPunch) absences++;
    }

    // Shift
    const empShift = shiftGroups.find((g) =>
      g.employeeIds.includes(emp.id),
    );
    const shiftInfo = empShift
      ? `${empShift.name} (${empShift.startTime} – ${empShift.endTime})`
      : "—";

    // Working days now treat week-offs, holidays and recorded leaves as PAID.
    // Only true absences (calculated above) reduce payable days.
    const workingDays = Math.max(0, daysInMonth - absences);
    const perDaySalary = emp.basicSalary / 30;
    const netSalary = perDaySalary * workingDays;

    return {
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      basicSalary: emp.basicSalary,
      totalDays: daysInMonth,
      weekOffs,
      weekOffDates,
      holidays,
      holidayDates,
      leaves,
      absences,
      workingDays,
      perDaySalary: Math.round(perDaySalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      shiftInfo,
    };
  });
}
