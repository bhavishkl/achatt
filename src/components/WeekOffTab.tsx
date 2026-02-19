"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { WeekOffGroup } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekOffTab() {
  const companyId = useAppStore((s) => s.companyId);
  const groups = useAppStore((s) => s.weekOffGroups);
  const employees = useAppStore((s) => s.employees);
  const setGroups = useAppStore((s) => s.setWeekOffGroups);
  const addEmpToGroup = useAppStore((s) => s.addEmployeeToGroup);
  const removeEmpFromGroup = useAppStore((s) => s.removeEmployeeFromGroup);

  const [form, setForm] = useState({ name: "", daysOff: [] as number[] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyId) {
      setLoading(true);
      fetch(`/api/week-off-groups?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.groups) {
            setGroups(data.groups);
          }
        })
        .catch((err) => console.error("Error fetching week-off groups:", err))
        .finally(() => setLoading(false));
    }
  }, [companyId, setGroups]);

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      daysOff: f.daysOff.includes(day)
        ? f.daysOff.filter((d) => d !== day)
        : [...f.daysOff, day],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || form.daysOff.length === 0 || !companyId) return;

    setLoading(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/week-off-groups/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            daysOff: form.daysOff,
          }),
        });
        const data = await res.json();
        if (res.ok) {
            // Update store manually
            const updatedGroups = groups.map((g) =>
                g.id === editingId ? { ...g, name: form.name, daysOff: form.daysOff } : g
            );
            setGroups(updatedGroups);
            setEditingId(null);
            setShowForm(false);
            setForm({ name: "", daysOff: [] });
        } else {
            console.error("Failed to update:", data);
            alert("Failed to update group");
        }
      } else {
        // Create
        const res = await fetch(`/api/week-off-groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            name: form.name,
            daysOff: form.daysOff,
          }),
        });
        const data = await res.json();
        if (res.ok) {
            const newGroup = data.group;
            setGroups([...groups, newGroup]);
            setShowForm(false);
            setForm({ name: "", daysOff: [] });
        } else {
            console.error("Failed to create:", data);
            alert("Failed to create group");
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
        const res = await fetch(`/api/week-off-groups/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            setGroups(groups.filter((g) => g.id !== id));
            setConfirmDeleteId(null);
        } else {
            alert("Failed to delete");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred");
    } finally {
        setLoading(false);
    }
  }

  async function handleAddEmployee(groupId: string, employeeId: string) {
      try {
          const res = await fetch(`/api/week-off-groups/${groupId}/employees`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId })
          });
          if (res.ok) {
              addEmpToGroup("weekoff", groupId, employeeId);
          } else {
              const data = await res.json();
              alert(data.message || "Failed to add employee");
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred");
      }
  }

  async function handleRemoveEmployee(groupId: string, employeeId: string) {
      try {
          const res = await fetch(`/api/week-off-groups/${groupId}/employees?employeeId=${employeeId}`, {
              method: 'DELETE'
          });
          if (res.ok) {
              removeEmpFromGroup("weekoff", groupId, employeeId);
          } else {
              const data = await res.json();
              alert(data.message || "Failed to remove employee");
          }
      } catch (err) {
          console.error(err);
          alert("An error occurred");
      }
  }

  function startEdit(g: WeekOffGroup) {
    setForm({ name: g.name, daysOff: [...g.daysOff] });
    setEditingId(g.id);
    setShowForm(true);
  }

  function handleCancel() {
    setForm({ name: "", daysOff: [] });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Week-Off Groups</h2>
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
            {editingId ? "Edit Week-Off Group" : "New Week-Off Group"}
          </h3>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Group Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Standard Week-Off"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Days Off</label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.daysOff.includes(idx)
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                  }`}
                >
                  {label}
                </button>
              ))}
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
          <p className="text-lg mb-1">No week-off groups yet</p>
          <p className="text-sm">Create a group and assign employees to it.</p>
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
                      Days off: {g.daysOff.map((d) => DAY_LABELS[d]).join(", ")} ·{" "}
                      {g.employeeIds.length} employee(s)
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
                              onClick={() =>
                                handleRemoveEmployee(g.id, emp.id)
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
                                handleAddEmployee(g.id, emp.id)
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
    </div>
  );
}
