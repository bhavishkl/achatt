"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { ShiftGroup } from "@/lib/types";

export default function ShiftTab() {
  const companyId = useAppStore((s) => s.companyId);
  const groups = useAppStore((s) => s.shiftGroups);
  const setGroups = useAppStore((s) => s.setShiftGroups);
  const employees = useAppStore((s) => s.employees);
  const addGroupStore = useAppStore((s) => s.addShiftGroup);
  const updateGroupStore = useAppStore((s) => s.updateShiftGroup);
  const deleteGroupStore = useAppStore((s) => s.deleteShiftGroup);
  const addEmpToGroupStore = useAppStore((s) => s.addEmployeeToGroup);
  const removeEmpFromGroupStore = useAppStore((s) => s.removeEmployeeFromGroup);

  // Shift Rotations Store
  const shiftRotations = useAppStore((s) => s.shiftRotations);
  const setShiftRotations = useAppStore((s) => s.setShiftRotations);
  const addShiftRotation = useAppStore((s) => s.addShiftRotation);
  const deleteShiftRotation = useAppStore((s) => s.deleteShiftRotation);

  const [form, setForm] = useState({ name: "", startTime: "", endTime: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Rotation State
  const [showRotationForm, setShowRotationForm] = useState(false);
  const [rotationForm, setRotationForm] = useState({
    employeeId: "",
    shiftType: "morning",
    startDate: "",
    endDate: "",
  });
  const [rotationLoading, setRotationLoading] = useState(false);

  // Fetch groups and rotations
  useEffect(() => {
    if (companyId) {
      setLoading(true);
      
      // Fetch Shift Groups
      fetch(`/api/shifts?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.groups) {
            setGroups(data.groups);
          }
        })
        .catch((err) => console.error("Error fetching shift groups:", err))
        .finally(() => setLoading(false));

      // Fetch Shift Rotations
      fetch(`/api/shifts/rotations?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.rotations) {
            setShiftRotations(data.rotations);
          }
        })
        .catch((err) => console.error("Error fetching shift rotations:", err));
    }
  }, [companyId, setGroups, setShiftRotations]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.startTime || !form.endTime || !companyId) return;

    setLoading(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/shifts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            startTime: form.startTime,
            endTime: form.endTime,
          }),
        });
        
        if (res.ok) {
          updateGroupStore(editingId, {
            name: form.name,
            startTime: form.startTime,
            endTime: form.endTime,
          });
          setEditingId(null);
          setShowForm(false);
          setForm({ name: "", startTime: "", endTime: "" });
        } else {
            alert("Failed to update shift group");
        }
      } else {
        // Create
        const res = await fetch(`/api/shifts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            name: form.name,
            startTime: form.startTime,
            endTime: form.endTime,
          }),
        });
        const data = await res.json();
        
        if (res.ok) {
           addGroupStore({
             name: data.group.name,
             startTime: data.group.startTime,
             endTime: data.group.endTime,
           });
           
           // Re-fetch to get the correct ID from server
           fetch(`/api/shifts?companyId=${companyId}`)
            .then((res) => res.json())
            .then((d) => {
              if (d.groups) setGroups(d.groups);
            });

           setShowForm(false);
           setForm({ name: "", startTime: "", endTime: "" });
        } else {
             alert("Failed to create shift group");
        }
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleRotationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rotationForm.employeeId || !rotationForm.startDate || !rotationForm.endDate || !companyId) return;

    setRotationLoading(true);
    try {
      const res = await fetch(`/api/shifts/rotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          employeeId: rotationForm.employeeId,
          shiftType: rotationForm.shiftType,
          startDate: rotationForm.startDate,
          endDate: rotationForm.endDate,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        addShiftRotation(data.rotation);
        setRotationForm({
          employeeId: "",
          shiftType: "morning",
          startDate: "",
          endDate: "",
        });
        setShowRotationForm(false);
      } else {
        alert("Failed to create shift rotation");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setRotationLoading(false);
    }
  }

  async function handleDeleteRotation(id: string) {
    if (!confirm("Are you sure you want to delete this rotation?")) return;
    try {
      const res = await fetch(`/api/shifts/rotations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        deleteShiftRotation(id);
      } else {
        alert("Failed to delete shift rotation");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  }

  async function handleDelete(id: string) {
      setLoading(true);
      try {
          const res = await fetch(`/api/shifts/${id}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              deleteGroupStore(id); 
              setConfirmDeleteId(null);
          } else {
              alert("Failed to delete shift group");
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred");
      } finally {
          setLoading(false);
      }
  }

  async function handleAddEmployee(groupId: string, employeeId: string) {
      // Optimistic update? No, let's wait.
      try {
          const res = await fetch(`/api/shifts/${groupId}/employees`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId })
          });
          if (res.ok) {
              addEmpToGroupStore("shift", groupId, employeeId);
          } else {
              alert("Failed to add employee to shift");
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred");
      }
  }

  async function handleRemoveEmployee(groupId: string, employeeId: string) {
      try {
          const res = await fetch(`/api/shifts/${groupId}/employees?employeeId=${employeeId}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              removeEmpFromGroupStore("shift", groupId, employeeId);
          } else {
              alert("Failed to remove employee from shift");
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred");
      }
  }

  function startEdit(g: ShiftGroup) {
    setForm({ name: g.name, startTime: g.startTime, endTime: g.endTime });
    setEditingId(g.id);
    setShowForm(true);
  }

  function handleCancel() {
    setForm({ name: "", startTime: "", endTime: "" });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Shift Groups</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Group
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 mb-6 space-y-4"
        >
          <h3 className="text-white font-medium">
            {editingId ? "Edit Shift Group" : "New Shift Group"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Group Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning Shift"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : (editingId ? "Update" : "Add")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-neutral-700 hover:bg-neutral-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !groups.length ? (
        <div className="text-center py-12 text-neutral-500">Loading...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg mb-1">No shift groups yet</p>
          <p className="text-sm">Create shifts and assign employees to them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const isExpanded = expandedId === g.id;
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
                    onClick={() => setExpandedId(isExpanded ? null : g.id)}
                  >
                    <h4 className="text-white font-medium">{g.name}</h4>
                    <p className="text-sm text-neutral-400">
                      {g.startTime} – {g.endTime} · {g.employeeIds.length} employee(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {confirmDeleteId === g.id ? (
                      <>
                        <span className="text-xs text-neutral-400">Delete?</span>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-neutral-400 hover:text-neutral-300 text-xs font-medium"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(g)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(g.id)}
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
                              onClick={() => handleRemoveEmployee(g.id, emp.id)}
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
                              onClick={() => handleAddEmployee(g.id, emp.id)}
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

      {/* --- Rotational Shifts Section --- */}
      <div className="mt-12 pt-8 border-t border-neutral-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Rotational Shifts</h2>
          {!showRotationForm && (
            <button
              onClick={() => setShowRotationForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Rotation
            </button>
          )}
        </div>

        {showRotationForm && (
          <form
            onSubmit={handleRotationSubmit}
            className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 mb-6 space-y-4"
          >
            <h3 className="text-white font-medium">New Rotational Shift</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Employee</label>
                <select
                  value={rotationForm.employeeId}
                  onChange={(e) => setRotationForm({ ...rotationForm, employeeId: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Shift Type</label>
                <select
                  value={rotationForm.shiftType}
                  onChange={(e) => setRotationForm({ ...rotationForm, shiftType: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning</option>
                  <option value="night">Night</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={rotationForm.startDate}
                  onChange={(e) => setRotationForm({ ...rotationForm, startDate: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={rotationForm.endDate}
                  onChange={(e) => setRotationForm({ ...rotationForm, endDate: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={rotationLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {rotationLoading ? "Saving..." : "Add Rotation"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRotationForm(false);
                  setRotationForm({ employeeId: "", shiftType: "morning", startDate: "", endDate: "" });
                }}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {shiftRotations.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-sm">
            No rotational shifts assigned yet.
          </div>
        ) : (
          <div className="space-y-3">
            {shiftRotations.map((rot) => {
              const emp = employees.find((e) => e.id === rot.employeeId);
              return (
                <div
                  key={rot.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-white font-medium">{emp?.name || "Unknown Employee"}</h4>
                    <p className="text-sm text-neutral-400">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${rot.shiftType === "morning" ? "bg-yellow-400" : "bg-indigo-400"}`}></span>
                      {rot.shiftType === "morning" ? "Morning" : "Night"} Shift · {rot.startDate} to {rot.endDate}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRotation(rot.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
