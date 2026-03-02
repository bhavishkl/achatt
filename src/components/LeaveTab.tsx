"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { LeaveGroup } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/constants";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  const removeLeaveRecordStore = useAppStore((s) => s.removeLeaveRecord);

  const absentRecords = useAppStore((s) => s.absentRecords);
  const setAbsentRecords = useAppStore((s) => s.setAbsentRecords);
  const removeAbsentRecordStore = useAppStore((s) => s.removeAbsentRecord);

  const presentRecords = useAppStore((s) => s.presentRecords);
  const setPresentRecords = useAppStore((s) => s.setPresentRecords);
  const removePresentRecordStore = useAppStore((s) => s.removePresentRecord);

  const doubleDutyRecords = useAppStore((s) => s.doubleDutyRecords);
  const setDoubleDutyRecords = useAppStore((s) => s.setDoubleDutyRecords);
  const removeDoubleDutyRecordStore = useAppStore((s) => s.removeDoubleDutyRecord);

  const leaveGroups = useAppStore((s) => s.leaveGroups);
  const setLeaveGroups = useAppStore((s) => s.setLeaveGroups);
  const addEmpToGroup = useAppStore((s) => s.addEmployeeToGroup);
  const removeEmpFromGroup = useAppStore((s) => s.removeEmployeeFromGroup);

  const [activeSubTab, setActiveSubTab] = useState<"daily" | "groups">("daily");
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [groupForm, setGroupForm] = useState({ name: "", leavesPerMonth: "" });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    setLoading(true);

    Promise.all([
      fetch(`/api/leave-groups?companyId=${companyId}`).then((res) => res.json()),
      fetch(`/api/leave-records?companyId=${companyId}`).then((res) => res.json()),
      fetch(`/api/absent-records?companyId=${companyId}`).then((res) => res.json()),
      fetch(`/api/present-records?companyId=${companyId}`).then((res) => res.json()),
      fetch(`/api/double-duty-records?companyId=${companyId}`).then((res) => res.json()),
    ])
      .then(([groupsData, leaveData, absentData, presentData, ddData]) => {
        if (groupsData.groups) setLeaveGroups(groupsData.groups);
        if (leaveData.records) setLeaveRecords(leaveData.records);
        if (absentData.records) setAbsentRecords(absentData.records);
        if (presentData.records) setPresentRecords(presentData.records);
        if (ddData.records) setDoubleDutyRecords(ddData.records);
      })
      .catch((err) => console.error("Error fetching attendance data:", err))
      .finally(() => setLoading(false));
  }, [companyId, setLeaveGroups, setLeaveRecords, setAbsentRecords, setPresentRecords, setDoubleDutyRecords]);

  const todayLeaveRecords = useMemo(
    () => leaveRecords.filter((r) => r.date === selectedDate),
    [leaveRecords, selectedDate],
  );
  const todayAbsentRecords = useMemo(
    () => absentRecords.filter((r) => r.date === selectedDate),
    [absentRecords, selectedDate],
  );
  const todayPresentRecords = useMemo(
    () => presentRecords.filter((r) => r.date === selectedDate),
    [presentRecords, selectedDate],
  );
  const todayDoubleDutyRecords = useMemo(
    () => doubleDutyRecords.filter((r) => r.date === selectedDate),
    [doubleDutyRecords, selectedDate],
  );

  const leaveMap = useMemo(
    () => new Map(todayLeaveRecords.map((r) => [r.employeeId, r])),
    [todayLeaveRecords],
  );
  const absentMap = useMemo(
    () => new Map(todayAbsentRecords.map((r) => [r.employeeId, r])),
    [todayAbsentRecords],
  );
  const presentMap = useMemo(
    () => new Map(todayPresentRecords.map((r) => [r.employeeId, r])),
    [todayPresentRecords],
  );
  const doubleDutyMap = useMemo(
    () => new Map(todayDoubleDutyRecords.map((r) => [r.employeeId, r])),
    [todayDoubleDutyRecords],
  );

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

  async function deleteById(endpoint: string, id: string): Promise<boolean> {
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    return res.ok;
  }

  async function clearPrimaryStatus(employeeId: string) {
    const leave = leaveMap.get(employeeId);
    const absent = absentMap.get(employeeId);
    const present = presentMap.get(employeeId);

    if (leave) {
      const ok = await deleteById("/api/leave-records", leave.id);
      if (ok) removeLeaveRecordStore(leave.id);
    }
    if (absent) {
      const ok = await deleteById("/api/absent-records", absent.id);
      if (ok) removeAbsentRecordStore(absent.id);
    }
    if (present) {
      const ok = await deleteById("/api/present-records", present.id);
      if (ok) removePresentRecordStore(present.id);
    }
  }

  async function markLeave(employeeId: string) {
    const reasonInput = window.prompt("Leave reason (optional)", "");
    if (reasonInput === null) return;

    await clearPrimaryStatus(employeeId);

    const res = await fetch(`/api/leave-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        date: selectedDate,
        reason: reasonInput.trim(),
      }),
    });

    if (!res.ok) {
      alert("Failed to mark leave");
      return;
    }

    const data = await res.json();
    setLeaveRecords([...leaveRecords, data.record]);
  }

  async function markAbsent(employeeId: string) {
    const reasonInput = window.prompt("Absent reason (optional)", "");
    if (reasonInput === null) return;

    await clearPrimaryStatus(employeeId);

    const res = await fetch(`/api/absent-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        date: selectedDate,
        reason: reasonInput.trim(),
      }),
    });

    if (!res.ok) {
      alert("Failed to mark absent");
      return;
    }

    const data = await res.json();
    setAbsentRecords([...absentRecords, data.record]);
  }

  async function markPresent(employeeId: string) {
    await clearPrimaryStatus(employeeId);

    const res = await fetch(`/api/present-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        date: selectedDate,
      }),
    });

    if (!res.ok) {
      alert("Failed to mark present");
      return;
    }

    const data = await res.json();
    setPresentRecords([...presentRecords, data.record]);
  }

  async function clearPrimaryMark(employeeId: string) {
    await clearPrimaryStatus(employeeId);
  }

  async function toggleDoubleDuty(employeeId: string) {
    const existing = doubleDutyMap.get(employeeId);

    if (existing) {
      const ok = await deleteById("/api/double-duty-records", existing.id);
      if (!ok) {
        alert("Failed to remove double duty");
        return;
      }
      removeDoubleDutyRecordStore(existing.id);
      return;
    }

    const res = await fetch(`/api/double-duty-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        date: selectedDate,
      }),
    });

    if (!res.ok) {
      alert("Failed to add double duty");
      return;
    }

    const data = await res.json();
    setDoubleDutyRecords([...doubleDutyRecords, data.record]);
  }

  async function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupForm.name || !groupForm.leavesPerMonth || !companyId) return;

    setLoading(true);
    try {
      if (editingGroupId) {
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
            g.id === editingGroupId ? { ...g, name: groupForm.name, leavesPerMonth: Number(groupForm.leavesPerMonth) } : g,
          );
          setLeaveGroups(updatedGroups);
          setEditingGroupId(null);
          setShowGroupForm(false);
          setGroupForm({ name: "", leavesPerMonth: "" });
        } else {
          alert("Failed to update leave group");
        }
      } else {
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
        method: "DELETE",
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
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
        method: "DELETE",
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

  const leaveCount = todayLeaveRecords.length;
  const absentCount = todayAbsentRecords.length;
  const presentCount = todayPresentRecords.length;
  const ddCount = todayDoubleDutyRecords.length;

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-neutral-700">
        <button
          onClick={() => setActiveSubTab("daily")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${activeSubTab === "daily"
            ? "text-blue-400 border-b-2 border-blue-400"
            : "text-neutral-400 hover:text-neutral-200"
            }`}
        >
          Daily Attendance Management
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

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-white mt-1">{employees.length}</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Leave</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{leaveCount}</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Absent</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{absentCount}</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Present</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide">Double Duty</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{ddCount}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees by name, ID, or department..."
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
                const leaveRecord = leaveMap.get(emp.id);
                const absentRecord = absentMap.get(emp.id);
                const presentRecord = presentMap.get(emp.id);
                const hasDoubleDuty = doubleDutyMap.has(emp.id);

                const status = leaveRecord
                  ? "leave"
                  : absentRecord
                    ? "absent"
                    : presentRecord
                      ? "present"
                      : "none";

                return (
                  <div
                    key={emp.id}
                    className={`p-4 rounded-xl border transition-colors ${status === "leave"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : status === "absent"
                        ? "bg-red-500/10 border-red-500/30"
                        : status === "present"
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-neutral-800 border-neutral-700"
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">{emp.name}</span>
                          <span className="text-xs text-neutral-500 font-mono">{emp.employeeId}</span>
                        </div>
                        <p className="text-xs text-neutral-400">{emp.department}</p>

                        {leaveRecord?.reason && (
                          <p className="text-xs text-orange-300 mt-1">Reason: {leaveRecord.reason}</p>
                        )}
                        {absentRecord?.reason && (
                          <p className="text-xs text-red-300 mt-1">Reason: {absentRecord.reason}</p>
                        )}
                        {hasDoubleDuty && (
                          <p className="text-xs text-blue-300 mt-1">Double duty assigned</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => markLeave(emp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Leave
                        </button>
                        <button
                          onClick={() => markAbsent(emp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => markPresent(emp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => toggleDoubleDuty(emp.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hasDoubleDuty
                            ? "bg-blue-500 text-white"
                            : "bg-blue-700 hover:bg-blue-600 text-white"
                            }`}
                        >
                          Double Duty
                        </button>
                        {(leaveRecord || absentRecord || presentRecord) && (
                          <button
                            onClick={() => clearPrimaryMark(emp.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-neutral-700 hover:bg-neutral-600 text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  {loading ? "Saving..." : editingGroupId ? "Update" : "Add"}
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
