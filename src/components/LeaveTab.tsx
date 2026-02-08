"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { LeaveGroup } from "@/lib/types";

export default function LeaveTab() {
  const groups = useAppStore((s) => s.leaveGroups);
  const employees = useAppStore((s) => s.employees);
  const addGroup = useAppStore((s) => s.addLeaveGroup);
  const updateGroup = useAppStore((s) => s.updateLeaveGroup);
  const deleteGroup = useAppStore((s) => s.deleteLeaveGroup);
  const addEmpToGroup = useAppStore((s) => s.addEmployeeToGroup);
  const removeEmpFromGroup = useAppStore((s) => s.removeEmployeeFromGroup);

  const [form, setForm] = useState({ name: "", leavesPerMonth: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.leavesPerMonth) return;

    if (editingId) {
      updateGroup(editingId, {
        name: form.name,
        leavesPerMonth: Number(form.leavesPerMonth),
      });
      setEditingId(null);
    } else {
      addGroup({
        name: form.name,
        leavesPerMonth: Number(form.leavesPerMonth),
      });
    }
    setForm({ name: "", leavesPerMonth: "" });
    setShowForm(false);
  }

  function startEdit(g: LeaveGroup) {
    setForm({ name: g.name, leavesPerMonth: String(g.leavesPerMonth) });
    setEditingId(g.id);
    setShowForm(true);
  }

  function handleCancel() {
    setForm({ name: "", leavesPerMonth: "" });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Leave Groups</h2>
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
            {editingId ? "Edit Leave Group" : "New Leave Group"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Group Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Standard Leave"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Leaves Per Month
              </label>
              <input
                type="number"
                value={form.leavesPerMonth}
                onChange={(e) =>
                  setForm({ ...form, leavesPerMonth: e.target.value })
                }
                placeholder="2"
                min="0"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {editingId ? "Update" : "Add"}
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

      {groups.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg mb-1">No leave groups yet</p>
          <p className="text-sm">Create a group to define monthly leave allowances.</p>
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
                      {g.leavesPerMonth} leave(s)/month · {g.employeeIds.length} employee(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(g)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${g.name}"?`)) deleteGroup(g.id);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs font-medium"
                    >
                      Delete
                    </button>
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
                                removeEmpFromGroup("leave", g.id, emp.id)
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
                                addEmpToGroup("leave", g.id, emp.id)
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
