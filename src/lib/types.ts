// ============================================================
// Core Types for Attendance & Salary Management App
// ============================================================

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId: string; // e.g. "EMP-001"
  name: string;
  basicSalary: number;
  department: string;
  createdAt: string;
}

// ---- Group types ----

export type GroupType = "weekoff" | "holiday" | "leave" | "shift";

export interface WeekOffGroup {
  id: string;
  name: string;
  daysOff: number[]; // 0=Sun … 6=Sat
  employeeIds: string[];
}

export interface HolidayGroup {
  id: string;
  name: string;
  holidays: HolidayEntry[];
  employeeIds: string[];
}

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  label: string;
}

export interface LeaveGroup {
  id: string;
  name: string;
  leavesPerMonth: number;
  employeeIds: string[];
}

// Per-date leave record for individual employees
export interface LeaveRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  reason: string;
  substituteEmployeeId?: string; // employee covering double duty
}

export interface ShiftGroup {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  employeeIds: string[];
}

export interface ShiftRotation {
  id: string;
  employeeId: string;
  shiftType: "morning" | "night"; // or just string
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// ---- Attendance Report ----

export interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  totalDays: number;
  weekOffs: number;
  weekOffDates: string[]; // list of YYYY-MM-DD strings for week-off dates applicable to the employee
  holidays: number; // count of holiday dates in the month
  holidayDates: string[]; // list of YYYY-MM-DD strings for holiday dates applicable to the employee
  leaves: number;
  absences: number; // days with no punch and not holiday/week-off/leave
  workingDays: number;
  perDaySalary: number;
  netSalary: number;
  shiftInfo: string;
}

// ---- Tab definitions ----

export type TabKey =
  | "employees"
  | "weekoff"
  | "holiday"
  | "leave"
  | "shift"
  | "report"
  | "punch";

// ---- Punch Record Types ----

export interface PunchRecord {
  id: string;
  employeeId: string; // From Excel (e.g., "2")
  employeeName: string; // From Excel
  punchTime: string; // ISO datetime string
  date: string; // YYYY-MM-DD (extracted from punchTime)
}

export interface ProcessedPunch {
  employeeId: string;
  date: string; // YYYY-MM-DD
  punchIn: string | null; // ISO time string (HH:mm:ss)
  punchOut: string | null; // ISO time string (HH:mm:ss)
  status: 'present' | 'absent' | 'missed'; // present = both punches, missed = only one punch, absent = no punches
}
