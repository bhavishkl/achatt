// ============================================================
// Core Types for Attendance & Salary Management App
// ============================================================

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

export interface ShiftGroup {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  employeeIds: string[];
}

// ---- Attendance Report ----

export interface AttendanceRow {
  employeeId: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  totalDays: number;
  weekOffs: number;
  holidays: number;
  leaves: number;
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
  | "report";
