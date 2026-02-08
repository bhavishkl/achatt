"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Employee } from "@/lib/types";

const emptyForm = {
  employeeId: "",
  name: "",
  basicSalary: "",
  department: "",
};

export default function EmployeesTab() {
  const employees = useAppStore((s) => s.employees);
  const addEmployee = useAppStore((s) => s.addEmployee);
  const updateEmployee = useAppStore((s) => s.updateEmployee);
  const deleteEmployee = useAppStore((s) => s.deleteEmployee);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.name || !form.basicSalary || !form.department) return;

    if (editingId) {
      updateEmployee(editingId, {
        employeeId: form.employeeId,
        name: form.name,
        basicSalary: Number(form.basicSalary),
        department: form.department,
      });
      setEditingId(null);
    } else {
      addEmployee({
        employeeId: form.employeeId,
        name: form.name,
        basicSalary: Number(form.basicSalary),
        department: form.department,
      });
    }
    setForm(emptyForm);
    setShowForm(false);
  }

  function startEdit(emp: Employee) {
    setForm({
      employeeId: emp.employeeId,
      name: emp.name,
      basicSalary: String(emp.basicSalary),
      department: emp.department,
    });
    setEditingId(emp.id);
    setShowForm(true);
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Employees</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Employee
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 mb-6 space-y-4"
        >
          <h3 className="text-white font-medium">
            {editingId ? "Edit Employee" : "New Employee"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="e.g. EMP-001"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Basic Salary</label>
              <input
                type="number"
                value={form.basicSalary}
                onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                placeholder="30000"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Engineering"
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

      {employees.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-lg mb-1">No employees yet</p>
          <p className="text-sm">Add your first employee to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700 text-neutral-400">
                <th className="text-left py-3 px-3 font-medium">ID</th>
                <th className="text-left py-3 px-3 font-medium">Name</th>
                <th className="text-left py-3 px-3 font-medium">Department</th>
                <th className="text-right py-3 px-3 font-medium">Basic Salary</th>
                <th className="text-right py-3 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="py-3 px-3 text-neutral-300 font-mono">{emp.employeeId}</td>
                  <td className="py-3 px-3 text-white">{emp.name}</td>
                  <td className="py-3 px-3 text-neutral-300">{emp.department}</td>
                  <td className="py-3 px-3 text-right text-neutral-300">
                    ₹{emp.basicSalary.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {confirmDeleteId === emp.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-neutral-400">Delete?</span>
                        <button
                          onClick={() => {
                            deleteEmployee(emp.id);
                            setConfirmDeleteId(null);
                          }}
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
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(emp)}
                          className="text-blue-400 hover:text-blue-300 mr-3 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(emp.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
