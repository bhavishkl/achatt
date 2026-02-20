"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/constants";

const emptyForm = {
  employeeId: "",
  name: "",
  basicSalary: "",
  department: "",
};

export default function EmployeesTab() {
  const companyId = useAppStore((s) => s.companyId);
  const employees = useAppStore((s) => s.employees);
  const setEmployees = useAppStore((s) => s.setEmployees);
  const updateEmployeeStore = useAppStore((s) => s.updateEmployee);
  const deleteEmployeeStore = useAppStore((s) => s.deleteEmployee);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    if (companyId) {
      setLoading(true);
      fetch(`/api/employees?companyId=${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.employees) {
            // Map DB snake_case to Frontend camelCase
            const mapped = data.employees.map((e: any) => ({
              id: e.id,
              employeeId: e.employee_id,
              name: e.name,
              basicSalary: Number(e.basic_salary),
              department: e.department,
              createdAt: e.created_at,
            }));
            setEmployees(mapped);
          }
        })
        .catch((err) => console.error("Error fetching employees:", err))
        .finally(() => setLoading(false));
    }
  }, [companyId, setEmployees]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.name || !form.basicSalary || !form.department || !companyId) return;

    setLoading(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/employees/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: form.employeeId,
            name: form.name,
            basicSalary: Number(form.basicSalary),
            department: form.department,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          // Update store
          updateEmployeeStore(editingId, {
            employeeId: form.employeeId,
            name: form.name,
            basicSalary: Number(form.basicSalary),
            department: form.department,
          });
          setEditingId(null);
          setShowForm(false);
          setForm(emptyForm);
        } else {
          console.error("Failed to update:", data);
          alert("Failed to update employee");
        }
      } else {
        // Create
        const res = await fetch(`/api/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            employeeId: form.employeeId,
            name: form.name,
            basicSalary: Number(form.basicSalary),
            department: form.department,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          const newEmp = data.employee;
          const mappedNewEmp: Employee = {
            id: newEmp.id,
            employeeId: newEmp.employee_id,
            name: newEmp.name,
            basicSalary: Number(newEmp.basic_salary),
            department: newEmp.department,
            createdAt: newEmp.created_at,
          };
          setEmployees([mappedNewEmp, ...employees]);
          setShowForm(false);
          setForm(emptyForm);
        } else {
          console.error("Failed to create:", data);
          alert("Failed to create employee");
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
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        deleteEmployeeStore(id);
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
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
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

      {loading && !employees.length ? (
        <div className="text-center py-12 text-neutral-500">Loading...</div>
      ) : employees.length === 0 ? (
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
                          onClick={() => handleDelete(emp.id)}
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
