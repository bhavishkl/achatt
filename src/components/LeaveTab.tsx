"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { LeaveGroup, Employee } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/constants";

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
  const companyId = useAppStore((s) => s.companyId);
  const employees = useAppStore((s) => s.employees);
  const leaveRecords = useAppStore((s) => s.leaveRecords);
  const setLeaveRecords = useAppStore((s) => s.setLeaveRecords);
  const addLeaveRecordStore = useAppStore((s) => s.addLeaveRecord);
  const removeLeaveRecordStore = useAppStore((s) => s.removeLeaveRecord);

  // Leave Group Store Actions
  const leaveGroups = useAppStore((s) => s.leaveGroups);
  const setLeaveGroups = useAppStore((s) => s.setLeaveGroups);
  const addEmpToGroup = useAppStore((s) => s.addEmployeeToGroup);
  const removeEmpFromGroup = useAppStore((s) => s.removeEmployeeFromGroup);

  // UI State
  const [activeSubTab, setActiveSubTab] = useState<"daily" | "groups">("daily");

  // Daily Leave Management State
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  // Leave Modal State
  const [leaveModalEmpId, setLeaveModalEmpId] = useState<string | null>(null);
  const [leaveModalReason, setLeaveModalReason] = useState("");
  const [leaveModalSubstitute, setLeaveModalSubstitute] = useState("");

  // Group Management State
  const [groupForm, setGroupForm] = useState({ name: "", leavesPerMonth: "" });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (companyId) {
      setLoading(true);
      // Fetch Groups
      fetch(`/api/leave-groups?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.groups) setLeaveGroups(data.groups);
        })
        .catch((err) => console.error("Error fetching leave groups:", err));

      // Fetch Records (current month by default or all for now)
      // To keep it simple, fetching all or simple filter.
      // Ideally we fetch by month range based on selectedDate, but for now let's fetch all 
      // or at least current month. Let's fetch all for simplicity in this demo scope.
      fetch(`/api/leave-records?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.records) setLeaveRecords(data.records);
        })
        .catch((err) => console.error("Error fetching leave records:", err))
        .finally(() => setLoading(false));
    }
  }, [companyId, setLeaveGroups, setLeaveRecords]);

  // --- Daily Leave Management Logic ---

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
    let result = employees;
    if (departmentFilter) {
      result = result.filter((emp) => emp.department === departmentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q),
      );
    }
    return result;
  }, [employees, search, departmentFilter]);

  async function removeLeave(employeeId: string) {
    const existing = todayRecords.find((r) => r.employeeId === employeeId);
    if (!existing) return;
    try {
      const res = await fetch(`/api/leave-records/${existing.id}`, { method: 'DELETE' });
      if (res.ok) {
        removeLeaveRecordStore(existing.id);
      } else {
        alert("Failed to remove leave record");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function openLeaveModal(empId: string) {
    setLeaveModalEmpId(empId);
    setLeaveModalReason("");
    setLeaveModalSubstitute("");
  }

  function closeLeaveModal() {
    setLeaveModalEmpId(null);
    setLeaveModalReason("");
    setLeaveModalSubstitute("");
  }

  // Employees from same department for substitute dropdown
  const substituteOptions = useMemo(() => {
    if (!leaveModalEmpId) return [];
    const emp = employees.find((e) => e.id === leaveModalEmpId);
    if (!emp) return [];
    return employees.filter(
      (e) => e.id !== leaveModalEmpId && e.department === emp.department,
    );
  }, [employees, leaveModalEmpId]);

  async function handleMarkLeave() {
    if (!leaveModalEmpId) return;
    try {
      const res = await fetch(`/api/leave-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: leaveModalEmpId,
          date: selectedDate,
          reason: leaveModalReason,
          substituteEmployeeId: leaveModalSubstitute || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeaveRecords([...leaveRecords, data.record]);
        closeLeaveModal();
      } else {
        alert("Failed to add leave record");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // --- Leave Group Management Logic ---

  async function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupForm.name || !groupForm.leavesPerMonth || !companyId) return;

    setLoading(true);
    try {
      if (editingGroupId) {
        // Update
        const res = await fetch(`/api/leave-groups/${editingGroupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupForm.name,
            leavesPerMonth: Number(groupForm.leavesPerMonth),
          }),
        });
        if (res.ok) {
          const updatedGroups = leaveGroups.map((g) =>
            g.id === editingGroupId ? { ...g, name: groupForm.name, leavesPerMonth: Number(groupForm.leavesPerMonth) } : g
          );
          setLeaveGroups(updatedGroups);
          setEditingGroupId(null);
          setShowGroupForm(false);
          setGroupForm({ name: "", leavesPerMonth: "" });
        } else {
          alert("Failed to update leave group");
        }
      } else {
        // Create
        const res = await fetch(`/api/leave-groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            name: groupForm.name,
            leavesPerMonth: Number(groupForm.leavesPerMonth),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setLeaveGroups([...leaveGroups, data.group]);
          setShowGroupForm(false);
          setGroupForm({ name: "", leavesPerMonth: "" });
        } else {
          alert("Failed to create leave group");
        }
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave-groups/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLeaveGroups(leaveGroups.filter((g) => g.id !== id));
        setConfirmDeleteGroupId(null);
      } else {
        alert("Failed to delete group");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEmpToGroup(groupId: string, employeeId: string) {
    try {
      const res = await fetch(`/api/leave-groups/${groupId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        addEmpToGroup("leave", groupId, employeeId);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add employee");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRemoveEmpFromGroup(groupId: string, employeeId: string) {
    try {
      const res = await fetch(`/api/leave-groups/${groupId}/employees?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        removeEmpFromGroup("leave", groupId, employeeId);
      } else {
        alert("Failed to remove employee");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function startEditGroup(g: LeaveGroup) {
    setGroupForm({ name: g.name, leavesPerMonth: String(g.leavesPerMonth) });
    setEditingGroupId(g.id);
    setShowGroupForm(true);
  }

  function handleCancelGroup() {
    setGroupForm({ name: "", leavesPerMonth: "" });
    setEditingGroupId(null);
    setShowGroupForm(false);
  }

  const onLeaveCount = todayRecords.length;
  const presentCount = employees.length - onLeaveCount;

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex gap-4 mb-6 border-b border-neutral-700">
        <button
          onClick={() => setActiveSubTab("daily")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${activeSubTab === "daily"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-neutral-400 hover:text-neutral-200"
            }`}
        >
          Daily Leave Management
        </button>
        <button
          onClick={() => setActiveSubTab("groups")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${activeSubTab === "groups"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-neutral-400 hover:text-neutral-200"
            }`}
        >
          Leave Groups & Policies
        </button>
      </div>

      {activeSubTab === "daily" ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Daily Attendance</h2>
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

          {/* Search & Department Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search employees by name, ID, or department..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-neutral-500"
            />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-48"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
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
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isOnLeave
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-neutral-800 border-neutral-700"
                      }`}
                  >
                    {/* Status indicator */}
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${isOnLeave ? "bg-orange-400" : "bg-emerald-400"
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
                      {isOnLeave && leaveRecord?.substituteEmployeeId && (() => {
                        const sub = employees.find((e) => e.id === leaveRecord.substituteEmployeeId);
                        return sub ? (
                          <p className="text-xs text-blue-300 mt-0.5">
                            Substitute: {sub.name}
                          </p>
                        ) : null;
                      })()}
                    </div>

                    {/* Toggle button */}
                    {isOnLeave ? (
                      <button
                        onClick={() => removeLeave(emp.id)}
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Mark Present
                      </button>
                    ) : (
                      <button
                        onClick={() => openLeaveModal(emp.id)}
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Mark Leave
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Leave Modal */}
          {leaveModalEmpId && (() => {
            const modalEmp = employees.find((e) => e.id === leaveModalEmpId);
            if (!modalEmp) return null;
            return (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-full max-w-md space-y-5">
                  <h3 className="text-lg font-semibold text-white">Mark Leave</h3>

                  <div>
                    <p className="text-sm text-neutral-400">Employee</p>
                    <p className="text-white font-medium">{modalEmp.name} <span className="text-xs text-neutral-500 font-mono">{modalEmp.employeeId}</span></p>
                    <p className="text-xs text-neutral-400 mt-0.5">{modalEmp.department} · {selectedDate}</p>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Reason (optional)</label>
                    <input
                      type="text"
                      value={leaveModalReason}
                      onChange={(e) => setLeaveModalReason(e.target.value)}
                      placeholder="e.g. Sick leave, personal"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Substitute Employee (Double Duty)</label>
                    <select
                      value={leaveModalSubstitute}
                      onChange={(e) => setLeaveModalSubstitute(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No substitute</option>
                      {substituteOptions.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.employeeId})
                        </option>
                      ))}
                    </select>
                    {substituteOptions.length === 0 && (
                      <p className="text-xs text-neutral-500 mt-1">No other employees in the same department.</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleMarkLeave}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark Leave
                    </button>
                    <button
                      onClick={closeLeaveModal}
                      className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

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
                        onClick={() => removeLeave(emp.id)}
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
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Leave Groups</h2>
            {!showGroupForm && (
              <button
                onClick={() => setShowGroupForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Add Group
              </button>
            )}
          </div>

          {showGroupForm && (
            <form
              onSubmit={handleGroupSubmit}
              className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 mb-6 space-y-4"
            >
              <h3 className="text-white font-medium">
                {editingGroupId ? "Edit Leave Group" : "New Leave Group"}
              </h3>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. Standard Policy"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Leaves Per Month</label>
                <input
                  type="number"
                  value={groupForm.leavesPerMonth}
                  onChange={(e) => setGroupForm({ ...groupForm, leavesPerMonth: e.target.value })}
                  placeholder="e.g. 2"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : (editingGroupId ? "Update" : "Add")}
                </button>
                <button
                  type="button"
                  onClick={handleCancelGroup}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {leaveGroups.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg mb-1">No leave groups yet</p>
              <p className="text-sm">Create a group to define leave policies.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveGroups.map((g) => {
                const isExpanded = expandedGroupId === g.id;
                const assignedEmps = employees.filter((emp) =>
                  g.employeeIds.includes(emp.id),
                );
                const unassignedEmps = employees.filter(
                  (emp) => !g.employeeIds.includes(emp.id),
                );

                return (
                  <div
                    key={g.id}
                    className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setExpandedGroupId(isExpanded ? null : g.id)}
                      >
                        <h4 className="text-white font-medium">{g.name}</h4>
                        <p className="text-sm text-neutral-400">
                          {g.leavesPerMonth} leaves/month · {g.employeeIds.length} employee(s)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {confirmDeleteGroupId === g.id ? (
                          <>
                            <span className="text-xs text-neutral-400">Delete?</span>
                            <button
                              onClick={() => handleDeleteGroup(g.id)}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteGroupId(null)}
                              className="text-neutral-400 hover:text-neutral-300 text-xs font-medium"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditGroup(g)}
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteGroupId(g.id)}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-neutral-700 p-4 space-y-3">
                        <p className="text-sm text-neutral-400 font-medium">Assigned Employees</p>
                        {assignedEmps.length === 0 ? (
                          <p className="text-sm text-neutral-500">None assigned</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedEmps.map((emp) => (
                              <span
                                key={emp.id}
                                className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs"
                              >
                                {emp.name}
                                <button
                                  onClick={() =>
                                    handleRemoveEmpFromGroup(g.id, emp.id)
                                  }
                                  className="ml-1 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {unassignedEmps.length > 0 && (
                          <>
                            <p className="text-sm text-neutral-400 font-medium mt-3">
                              Add Employee
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {unassignedEmps.map((emp) => (
                                <button
                                  key={emp.id}
                                  onClick={() =>
                                    handleAddEmpToGroup(g.id, emp.id)
                                  }
                                  className="bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-3 py-1 rounded-full text-xs transition-colors"
                                >
                                  + {emp.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
