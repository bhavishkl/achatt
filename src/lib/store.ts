import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Employee,
  WeekOffGroup,
  HolidayGroup,
  LeaveGroup,
  LeaveRecord,
  AbsentRecord,
  PresentRecord,
  DoubleDutyRecord,
  ShiftGroup,
  ShiftRotation,
  HolidayEntry,
  PunchRecord,
  ProcessedPunch,
} from "./types";
import type {
  OpdPatient,
  OpdVisit,
  OpdVisitStatus,
  Vitals,
  OpdBill,
  Prescription,
  PrescriptionFormatConfig,
} from "@/types/opd";
import { DEFAULT_FORMAT_CONFIG } from "@/types/opd";
import {
  PULMONOLOGY_MEDICINES,
  PULMONOLOGY_TESTS,
  PULMONOLOGY_DIAGNOSES,
} from "@/data/opdSeedData";

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
export interface AppState {
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
  absentRecords: AbsentRecord[];
  setAbsentRecords: (records: AbsentRecord[]) => void;
  removeAbsentRecord: (id: string) => void;
  presentRecords: PresentRecord[];
  setPresentRecords: (records: PresentRecord[]) => void;
  removePresentRecord: (id: string) => void;
  doubleDutyRecords: DoubleDutyRecord[];
  setDoubleDutyRecords: (records: DoubleDutyRecord[]) => void;
  removeDoubleDutyRecord: (id: string) => void;

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

  // --- OPD Patient Registry ---
  opdPatients: OpdPatient[];
  setOpdPatients: (patients: OpdPatient[]) => void;
  addOpdPatient: (p: Omit<OpdPatient, "id" | "createdAt">) => OpdPatient;
  upsertOpdPatient: (patient: OpdPatient) => void;
  updateOpdPatient: (id: string, data: Partial<Omit<OpdPatient, "id" | "createdAt">>) => void;

  // --- OPD Visits ---
  opdVisits: OpdVisit[];
  setOpdVisits: (visits: OpdVisit[]) => void;
  upsertOpdVisit: (visit: OpdVisit) => void;
  createOpdVisit: (patientId: string) => OpdVisit;
  updateOpdVisitStatus: (visitId: string, status: OpdVisitStatus) => void;
  updateOpdVisitVitals: (visitId: string, vitals: Vitals) => void;
  updateOpdVisitBill: (visitId: string, bill: OpdBill) => void;
  updateOpdVisitPrescription: (visitId: string, prescription: Prescription) => void;
  bulkUpdateOpdVisitTokens: (updates: { id: string, tokenNo: number }[]) => void;
  removeOpdVisit: (visitId: string) => void;

  // --- OPD Bill Counter ---
  opdBillCounter: Record<string, number>;
  getNextBillNo: (date: string) => string;

  // --- Prescription Format ---
  prescriptionFormatConfig: PrescriptionFormatConfig;
  setPrescriptionFormatConfig: (config: PrescriptionFormatConfig) => void;

  // --- Custom Autocomplete Lists (user-extendable) ---
  customMedicines: string[];
  customTests: string[];
  customDiagnoses: string[];
  addCustomMedicine: (name: string) => void;
  addCustomTest: (name: string) => void;
  addCustomDiagnosis: (name: string) => void;

  // --- Prescription Templates ---
  prescriptionTemplates: { id: string; name: string; prescription: Prescription }[];
  setTemplates: (templates: { id: string; name: string; prescription: Prescription }[]) => void;
  savePrescriptionTemplate: (name: string, prescription: Prescription) => void;
  deletePrescriptionTemplate: (id: string) => void;
}

// ============================================================
// Store implementation
// ============================================================
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
          absentRecords: s.absentRecords.filter((r) => r.employeeId !== id),
          presentRecords: s.presentRecords.filter((r) => r.employeeId !== id),
          doubleDutyRecords: s.doubleDutyRecords.filter((r) => r.employeeId !== id),
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
      absentRecords: [],
      setAbsentRecords: (records) => set({ absentRecords: records }),
      removeAbsentRecord: (id) =>
        set((s) => ({
          absentRecords: s.absentRecords.filter((r) => r.id !== id),
        })),
      presentRecords: [],
      setPresentRecords: (records) => set({ presentRecords: records }),
      removePresentRecord: (id) =>
        set((s) => ({
          presentRecords: s.presentRecords.filter((r) => r.id !== id),
        })),
      doubleDutyRecords: [],
      setDoubleDutyRecords: (records) => set({ doubleDutyRecords: records }),
      removeDoubleDutyRecord: (id) =>
        set((s) => ({
          doubleDutyRecords: s.doubleDutyRecords.filter((r) => r.id !== id),
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

      // ---- OPD Patient Registry ----
      opdPatients: [],
      setOpdPatients: (patients) => set({ opdPatients: patients }),
      addOpdPatient: (p) => {
        const newPatient: OpdPatient = {
          ...p,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ opdPatients: [...s.opdPatients, newPatient] }));
        return newPatient;
      },
      upsertOpdPatient: (patient) =>
        set((s) => {
          const exists = s.opdPatients.some((p) => p.id === patient.id);
          if (exists) {
            return { opdPatients: s.opdPatients.map((p) => p.id === patient.id ? patient : p) };
          }
          return { opdPatients: [...s.opdPatients, patient] };
        }),
      updateOpdPatient: (id, data) =>
        set((s) => ({
          opdPatients: s.opdPatients.map((p) =>
            p.id === id ? { ...p, ...data } : p,
          ),
        })),

      // ---- OPD Visits ----
      opdVisits: [],
      setOpdVisits: (visits) => set({ opdVisits: visits }),
      upsertOpdVisit: (visit) =>
        set((s) => {
          const exists = s.opdVisits.some((v) => v.id === visit.id);
          if (exists) {
            return { opdVisits: s.opdVisits.map((v) => v.id === visit.id ? visit : v) };
          }
          return { opdVisits: [...s.opdVisits, visit] };
        }),
      createOpdVisit: (patientId) => {
        const today = new Date().toISOString().split("T")[0];
        const now = new Date().toISOString();
        let tokenNo = 1;
        set((s) => {
          const todayVisits = s.opdVisits.filter((v) => v.visitDate === today);
          tokenNo = todayVisits.length + 1;
          return {};
        });
        // Read current state for token
        const currentState = get();
        const todayVisits = currentState.opdVisits.filter((v) => v.visitDate === today);
        tokenNo = todayVisits.length + 1;
        const newVisit: OpdVisit = {
          id: uid(),
          patientId,
          visitDate: today,
          tokenNo,
          status: "waiting",
          vitals: null,
          prescription: null,
          bill: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ opdVisits: [...s.opdVisits, newVisit] }));
        return newVisit;
      },
      updateOpdVisitStatus: (visitId, status) =>
        set((s) => ({
          opdVisits: s.opdVisits.map((v) =>
            v.id === visitId ? { ...v, status, updatedAt: new Date().toISOString() } : v,
          ),
        })),
      updateOpdVisitVitals: (visitId, vitals) =>
        set((s) => ({
          opdVisits: s.opdVisits.map((v) =>
            v.id === visitId
              ? { ...v, vitals, status: "vitals_done" as const, updatedAt: new Date().toISOString() }
              : v,
          ),
        })),
      updateOpdVisitBill: (visitId, bill) =>
        set((s) => ({
          opdVisits: s.opdVisits.map((v) =>
            v.id === visitId ? { ...v, bill, updatedAt: new Date().toISOString() } : v,
          ),
        })),
      updateOpdVisitPrescription: (visitId, prescription) =>
        set((s) => ({
          opdVisits: s.opdVisits.map((v) =>
            v.id === visitId ? { ...v, prescription, updatedAt: new Date().toISOString() } : v,
          ),
        })),
      bulkUpdateOpdVisitTokens: (updates) => 
        set((s) => {
          const updateMap = new Map(updates.map(u => [u.id, u.tokenNo]));
          return {
            opdVisits: s.opdVisits.map((v) => 
              updateMap.has(v.id) 
                ? { ...v, tokenNo: updateMap.get(v.id)!, updatedAt: new Date().toISOString() } 
                : v
            )
          };
        }),
      removeOpdVisit: (visitId) =>
        set((s) => ({
          opdVisits: s.opdVisits.filter((v) => v.id !== visitId),
        })),

      // ---- OPD Bill Counter ----
      opdBillCounter: {},
      getNextBillNo: (date) => {
        const state = get();
        const current = state.opdBillCounter[date] ?? 0;
        const next = current + 1;
        set((s) => ({
          opdBillCounter: { ...s.opdBillCounter, [date]: next },
        }));
        return `OPD-${date.replace(/-/g, "")}-${String(next).padStart(3, "0")}`;
      },

      // ---- Prescription Format ----
      prescriptionFormatConfig: DEFAULT_FORMAT_CONFIG,
      setPrescriptionFormatConfig: (config) =>
        set({ prescriptionFormatConfig: config }),

      // ---- Custom Autocomplete Lists ----
      customMedicines: [],
      customTests: [],
      customDiagnoses: [],
      addCustomMedicine: (name) =>
        set((s) => {
          const seedNames = PULMONOLOGY_MEDICINES.map((m) => typeof m === "string" ? m : (m as any).name);
          const all = [...seedNames, ...s.customMedicines];
          if (all.some((m) => m.toLowerCase() === name.toLowerCase())) return {};
          return { customMedicines: [...s.customMedicines, name] };
        }),
      addCustomTest: (name) =>
        set((s) => {
          const all = [...PULMONOLOGY_TESTS, ...s.customTests];
          if (all.some((t) => t.toLowerCase() === name.toLowerCase())) return {};
          return { customTests: [...s.customTests, name] };
        }),
      addCustomDiagnosis: (name) =>
        set((s) => {
          const all = [...PULMONOLOGY_DIAGNOSES, ...s.customDiagnoses];
          if (all.some((d) => d.toLowerCase() === name.toLowerCase())) return {};
          return { customDiagnoses: [...s.customDiagnoses, name] };
        }),

      // ---- Prescription Templates ----
      prescriptionTemplates: [],
      setTemplates: (templates) => set({ prescriptionTemplates: templates }),
      savePrescriptionTemplate: (name, prescription) =>
        set((s) => ({
          prescriptionTemplates: [
            ...s.prescriptionTemplates,
            { id: uid(), name, prescription: JSON.parse(JSON.stringify(prescription)) },
          ],
        })),
      deletePrescriptionTemplate: (id) =>
        set((s) => ({
          prescriptionTemplates: s.prescriptionTemplates.filter((t) => t.id !== id),
        })),
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

  // Build lookup for night shift rotations by internal employee id.
  const nightRotationsByEmp = new Map<string, ShiftRotation[]>();
  shiftRotations.forEach((rotation) => {
    if (rotation.shiftType !== "night") return;
    const existing = nightRotationsByEmp.get(rotation.employeeId) ?? [];
    existing.push(rotation);
    nightRotationsByEmp.set(rotation.employeeId, existing);
  });

  nightRotationsByEmp.forEach((rotations) => {
    rotations.sort((a, b) => a.startDate.localeCompare(b.startDate));
  });

  const getNightShiftRotation = (externalEmployeeId: string, date: string) => {
    const internalId = externalToInternal.get(externalEmployeeId);
    if (!internalId) return null;
    const rotations = nightRotationsByEmp.get(internalId);
    if (!rotations || rotations.length === 0) return null;
    return rotations.find((r) => date >= r.startDate && date <= r.endDate) ?? null;
  };

  const nextDateString = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const parseShiftDateTime = (date: string, time: string) => {
    const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
    return new Date(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      hours,
      minutes,
      seconds,
    );
  };

  const getConsumedPunchKey = (employeeId: string, punchId: string) => `${employeeId}-${punchId}`;

  const getNightShiftPunches = (
    employeeId: string,
    rotation: ShiftRotation,
    date: string,
    todayPunches: PunchRecord[],
    nextDayPunches: PunchRecord[],
    consumedPunchIds: Set<string>,
  ) => {
    const shiftStart = parseShiftDateTime(date, rotation.startTime);
    const shiftEnd = parseShiftDateTime(date, rotation.endTime);

    if (shiftEnd.getTime() <= shiftStart.getTime()) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const bufferMs = 6 * 60 * 60 * 1000;
    const midpointMs = shiftStart.getTime() + (shiftEnd.getTime() - shiftStart.getTime()) / 2;
    const allCandidatePunches = [...todayPunches, ...nextDayPunches]
      .filter((punch) => !consumedPunchIds.has(getConsumedPunchKey(employeeId, punch.id)))
      .map((punch) => ({ punch, timeMs: new Date(punch.punchTime).getTime() }))
      .filter(
        ({ timeMs }) =>
          timeMs >= shiftStart.getTime() - bufferMs &&
          timeMs <= shiftEnd.getTime() + bufferMs,
      );

    const pickClosest = (
      candidates: typeof allCandidatePunches,
      targetMs: number,
      excludePunchId?: string,
    ) => {
      return candidates
        .filter(({ punch }) => punch.id !== excludePunchId)
        .sort((a, b) => Math.abs(a.timeMs - targetMs) - Math.abs(b.timeMs - targetMs))[0]?.punch;
    };

    const punchIn = pickClosest(
      allCandidatePunches.filter(({ timeMs }) => timeMs <= midpointMs),
      shiftStart.getTime(),
    );
    const punchOut = pickClosest(
      allCandidatePunches.filter(({ timeMs }) => timeMs >= midpointMs),
      shiftEnd.getTime(),
      punchIn?.id,
    );

    return { punchIn, punchOut };
  };

  const consumedPunchIds = new Set<string>();
  const processed: ProcessedPunch[] = [];

  byEmpDate.forEach((dateMap, employeeId) => {
    const sortedDates = Array.from(dateMap.keys()).sort();

    sortedDates.forEach((date) => {
      const todayPunches = dateMap.get(date) ?? [];
      const usableToday = todayPunches.filter(
        (punch) => !consumedPunchIds.has(getConsumedPunchKey(employeeId, punch.id)),
      );

      let punchIn: string | null = null;
      let punchOut: string | null = null;

      const nightRotation = getNightShiftRotation(employeeId, date);

      if (nightRotation) {
        const nextDate = nextDateString(date);
        const nextDayPunches = dateMap.get(nextDate) ?? [];
        const nightPunches = getNightShiftPunches(
          employeeId,
          nightRotation,
          date,
          todayPunches,
          nextDayPunches,
          consumedPunchIds,
        );

        if (nightPunches.punchIn) {
          punchIn = toTimeString(nightPunches.punchIn.punchTime);
          consumedPunchIds.add(getConsumedPunchKey(employeeId, nightPunches.punchIn.id));
        }

        if (nightPunches.punchOut) {
          punchOut = toTimeString(nightPunches.punchOut.punchTime);
          consumedPunchIds.add(getConsumedPunchKey(employeeId, nightPunches.punchOut.id));
        }
      } else if (usableToday.length >= 2) {
        punchIn = toTimeString(usableToday[0].punchTime);
        punchOut = toTimeString(usableToday[usableToday.length - 1].punchTime);
      } else if (usableToday.length === 1) {
        punchIn = toTimeString(usableToday[0].punchTime);
      }

      const status: "present" | "absent" | "missed" =
        punchIn && punchOut ? "present" : punchIn || punchOut ? "missed" : "absent";

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
  absentRecords: AbsentRecord[],
  presentRecords: PresentRecord[],
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
    const leaveDates = leaveRecords
      .filter((r) => r.employeeId === emp.id && r.date.startsWith(monthPrefix))
      .map((r) => r.date);
    const leaves = leaveDates.length;

    const absentDateSet = new Set(
      absentRecords
        .filter((r) => r.employeeId === emp.id && r.date.startsWith(monthPrefix))
        .map((r) => r.date),
    );
    const presentDateSet = new Set(
      presentRecords
        .filter((r) => r.employeeId === emp.id && r.date.startsWith(monthPrefix))
        .map((r) => r.date),
    );

    const empLeaveGroup = leaveGroups.find((g) => g.employeeIds.includes(emp.id));
    const leaveAllowance = empLeaveGroup ? empLeaveGroup.leavesPerMonth : 0;
    const remainingLeaveAllowance = Math.max(0, leaveAllowance - leaves);

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
    let rawAbsences = 0;
    const rawAbsentDates = new Set<string>();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

      const isHoliday = holidayDateSet.has(dateStr);
      const isWeekOff = weekOffDateSet.has(dateStr);
      const isLeave = leaveDates.includes(dateStr);
      const isPresentOverride = presentDateSet.has(dateStr);
      const isAbsentOverride = absentDateSet.has(dateStr);
      const hasPunch = punchDateSet.has(dateStr);

      if (isHoliday || isWeekOff || isLeave || isPresentOverride) continue;
      if (isAbsentOverride || !hasPunch) {
        rawAbsences++;
        rawAbsentDates.add(dateStr);
      }
    }

    const convertedAbsences = Math.min(remainingLeaveAllowance, rawAbsences);
    const absences = rawAbsences - convertedAbsences;
    const effectiveLeaves = leaves + convertedAbsences;
    const remainingLeaveAfterConversion = Math.max(0, leaveAllowance - effectiveLeaves);
    const autoDoubleDuty = absences === 0 ? remainingLeaveAfterConversion : 0;

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
      leaves: effectiveLeaves,
      absences,
      convertedAbsences,
      leaveAllowance,
      remainingLeaveAfterConversion,
      autoDoubleDuty,
      workingDays,
      perDaySalary: Math.round(perDaySalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      shiftInfo,
    };
  });
}
