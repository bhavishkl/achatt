"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { HolidayGroup, HolidayEntry } from "@/lib/types";

export default function HolidayTab() {
  const groups = useAppStore((s) => s.holidayGroups);
  const employees = useAppStore((s) => s.employees);
  const addGroup = useAppStore((s) => s.addHolidayGroup);
  const updateGroup = useAppStore((s) => s.updateHolidayGroup);
  const deleteGroup = useAppStore((s) => s.deleteHolidayGroup);
  const addEmpToGroup = useAppStore((s) => s.addEmployeeToGroup);
  const removeEmpFromGroup = useAppStore((s) => s.removeEmployeeFromGroup);

  const [form, setForm] = useState({ name: "", holidays: [] as HolidayEntry[] });
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayLabel, setHolidayLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function addHolidayEntry() {
    if (!holidayDate || !holidayLabel) return;
    setForm((f) => ({
      ...f,
      holidays: [...f.holidays, { date: holidayDate, label: holidayLabel }],
    }));
    setHolidayDate("");
    setHolidayLabel("");
  }

  function removeHolidayEntry(idx: number) {
    setForm((f) => ({
      ...f,
      holidays: f.holidays.filter((_, i) => i !== idx),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    if (editingId) {
      updateGroup(editingId, { name: form.name, holidays: form.holidays });
      setEditingId(null);
    } else {
      addGroup({ name: form.name, holidays: form.holidays });
    }
    setForm({ name: "", holidays: [] });
    setShowForm(false);
  }

  function startEdit(g: HolidayGroup) {
    setForm({ name: g.name, holidays: [...g.holidays] });
    setEditingId(g.id);
    setShowForm(true);
  }

  function handleCancel() {
    setForm({ name: "", holidays: [] });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Holiday Groups</h2>
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
            {editingId ? "Edit Holiday Group" : "New Holiday Group"}
          </h3>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Group Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. National Holidays 2026"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Holiday entries */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Holidays</label>
            {form.holidays.length > 0 && (
              <div className="space-y-1 mb-3">
                {form.holidays.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-neutral-900 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-neutral-300">
                      <span className="text-white font-mono">{h.date}</span> — {h.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHolidayEntry(idx)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={holidayLabel}
                onChange={(e) => setHolidayLabel(e.target.value)}
                placeholder="Holiday name"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addHolidayEntry}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {editingId ? "Update" : "Create Group"}
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
          <p className="text-lg mb-1">No holiday groups yet</p>
          <p className="text-sm">Create a group with holiday dates and assign employees.</p>
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
                      {g.holidays.length} holiday(s) · {g.employeeIds.length} employee(s)
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
                    {/* Holiday list */}
                    {g.holidays.length > 0 && (
                      <div>
                        <p className="text-sm text-neutral-400 font-medium mb-2">Holiday Dates</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {g.holidays.map((h, idx) => (
                            <div key={idx} className="text-sm text-neutral-300">
                              <span className="font-mono text-neutral-400">{h.date}</span> — {h.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                                removeEmpFromGroup("holiday", g.id, emp.id)
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
                                addEmpToGroup("holiday", g.id, emp.id)
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
