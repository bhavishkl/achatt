"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LeaveTab() {
  const employees = useAppStore((s) => s.employees);
  const leaveRecords = useAppStore((s) => s.leaveRecords);
  const addLeaveRecord = useAppStore((s) => s.addLeaveRecord);
  const removeLeaveRecord = useAppStore((s) => s.removeLeaveRecord);

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [search, setSearch] = useState("");
  const [reasonInput, setReasonInput] = useState<Record<string, string>>({});

  // Leave records for the selected date
  const todayRecords = useMemo(
    () => leaveRecords.filter((r) => r.date === selectedDate),
    [leaveRecords, selectedDate],
  );

  // Set of employee IDs on leave for selected date
  const onLeaveIds = useMemo(
    () => new Set(todayRecords.map((r) => r.employeeId)),
    [todayRecords],
  );

  // Filter employees by search query
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q),
    );
  }, [employees, search]);

  function toggleLeave(employeeId: string) {
    const existing = todayRecords.find((r) => r.employeeId === employeeId);
    if (existing) {
      removeLeaveRecord(existing.id);
    } else {
      const reason = reasonInput[employeeId] || "";
      addLeaveRecord(employeeId, selectedDate, reason);
      setReasonInput((prev) => ({ ...prev, [employeeId]: "" }));
    }
  }

  const onLeaveCount = todayRecords.length;
  const presentCount = employees.length - onLeaveCount;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Leave Management</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {formatDisplayDate(new Date(selectedDate + "T00:00:00"))}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{employees.length}</p>
        </div>
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Present</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</p>
        </div>
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">On Leave</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{onLeaveCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search employees by name, ID, or department..."
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-neutral-500"
        />
      </div>

      {/* Employee list */}
      {employees.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg mb-1">No employees yet</p>
          <p className="text-sm">Add employees in the Employees tab first.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg mb-1">No matching employees</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmployees.map((emp) => {
            const isOnLeave = onLeaveIds.has(emp.id);
            const leaveRecord = todayRecords.find(
              (r) => r.employeeId === emp.id,
            );

            return (
              <div
                key={emp.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isOnLeave
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-neutral-800 border-neutral-700"
                }`}
              >
                {/* Status indicator */}
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isOnLeave ? "bg-orange-400" : "bg-emerald-400"
                  }`}
                />

                {/* Employee info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">
                      {emp.name}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {emp.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">{emp.department}</p>
                  {isOnLeave && leaveRecord?.reason && (
                    <p className="text-xs text-orange-300 mt-1">
                      Reason: {leaveRecord.reason}
                    </p>
                  )}
                </div>

                {/* Reason input (only when not on leave) */}
                {!isOnLeave && (
                  <input
                    type="text"
                    value={reasonInput[emp.id] || ""}
                    onChange={(e) =>
                      setReasonInput((prev) => ({
                        ...prev,
                        [emp.id]: e.target.value,
                      }))
                    }
                    placeholder="Reason (optional)"
                    className="hidden sm:block w-40 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-neutral-600"
                  />
                )}

                {/* Toggle button */}
                <button
                  onClick={() => toggleLeave(emp.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isOnLeave
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  {isOnLeave ? "Mark Present" : "Mark Leave"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* On-leave summary for the date */}
      {todayRecords.length > 0 && (
        <div className="mt-6 bg-neutral-800 border border-neutral-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">
            Employees on Leave — {selectedDate}
          </h3>
          <div className="flex flex-wrap gap-2">
            {todayRecords.map((record) => {
              const emp = employees.find((e) => e.id === record.employeeId);
              if (!emp) return null;
              return (
                <span
                  key={record.id}
                  className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-xs"
                >
                  {emp.name}
                  {record.reason && (
                    <span className="text-orange-400/60">({record.reason})</span>
                  )}
                  <button
                    onClick={() => removeLeaveRecord(record.id)}
                    className="ml-1 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
