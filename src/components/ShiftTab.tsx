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

  const [form, setForm] = useState({ name: "", startTime: "", endTime: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch groups
  useEffect(() => {
    if (companyId) {
      setLoading(true);
      fetch(`/api/shifts?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.groups) {
            setGroups(data.groups);
          }
        })
        .catch((err) => console.error("Error fetching shift groups:", err))
        .finally(() => setLoading(false));
    }
  }, [companyId, setGroups]);

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
             // The store usually adds a local ID, but we want the server ID.
             // The addShiftGroup implementation in store generates a new ID.
             // We should probably update the store to accept an ID or just refetch.
             // For now, let's just refetch or manually update state if possible.
             // Since store logic generates ID, let's just reload the list or modify store to accept ID.
             // Modifying store is better but I'll stick to reloading for simplicity or just let the store generate a temp ID and then reload?
             // Actually, the `addShiftGroup` implementation in `store.ts` ignores the ID passed and generates a new one: `id: uid()`.
             // This is a problem for persistence. Ideally `setGroups` handles the server state.
             // Since I fetch on mount, a reload would fix it.
             // But for immediate UI update with correct ID, I should update the store.
             // I'll manually append to the list using setGroups if I want consistency, or just rely on fetch.
             // Let's just re-fetch for now to be safe and simple.
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
    </div>
  );
}
