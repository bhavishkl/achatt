"use client";

import { useState } from "react";
import { Patient } from "@/types/patient";
import { formatDisplayDate } from "@/components/add-bill-modal/utils";

interface AdmittedPatientsTableProps {
  patients: Patient[];
  onDischarge: (id: string) => void;
  onAddBill: (id: string) => void;
  onEditBill: (patientId: string, billId: string) => void;
  onEditPatient: (patientId: string) => void;
  onAddAdvance: (id: string) => void;
  onAddNew: () => void;
}

export default function AdmittedPatientsTable({
  patients,
  onDischarge,
  onAddBill,
  onEditBill,
  onEditPatient,
  onAddAdvance,
  onAddNew,
}: AdmittedPatientsTableProps) {
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Currently Admitted</h2>
          <p className="text-sm text-neutral-400">Manage admitted patients, records, and active bills</p>
        </div>
        <button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
        >
          <span>+</span> New Admission
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Reg No</th>
                <th className="p-4">Patient Info</th>
                <th className="p-4">Ward / Bed</th>
                <th className="p-4">Admission</th>
                <th className="p-4">Attender</th>
                <th className="p-4">Bills</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No admitted patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-neutral-400">{patient.regNo}</div>
                      {patient.ipNumber && (
                        <div className="mt-1 inline-flex items-center gap-1 bg-blue-950/60 border border-blue-800/50 rounded px-1.5 py-0.5">
                          <span className="text-blue-500 text-[10px] uppercase tracking-wide font-medium">IP</span>
                          <span className="font-mono text-blue-300 text-xs">{patient.ipNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">
                        {patient.prefix} {patient.name}
                      </div>
                      <div className="text-neutral-500 text-xs mt-1">
                        {patient.gender}, {patient.age} Yrs
                      </div>
                      
                    </td>
                    <td className="p-4">
                      <div className="text-neutral-300">{patient.wardName}</div>
                      <div className="text-neutral-500 text-xs mt-1">(Bed: {patient.bedNo})</div>
                    </td>
                    <td className="p-4">
                      <div className="text-neutral-300">{formatDisplayDate(patient.admissionDate)}</div>
                      <div className="text-neutral-500 text-xs">{patient.admissionTime}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-neutral-300">{patient.attenderName}</div>
                      <div className="text-neutral-500 text-xs">{patient.attenderRelation}</div>
                      <div className="text-neutral-500 text-xs font-mono">{patient.attenderMobile}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {patient.bills && patient.bills.length > 0 && (
                          <div className="flex flex-col gap-1 mb-1">
                            {patient.bills.map((bill) => (
                              <button
                                key={bill.id}
                                onClick={() => onEditBill(patient.id, bill.id)}
                                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded border border-neutral-700 w-fit flex items-center gap-2 transition-colors"
                              >
                                {bill.billNo && <span className="text-blue-400 font-mono font-medium">#{bill.billNo}</span>}
                                <span className="text-neutral-500">{formatDisplayDate(bill.date)}</span>
                                <span>₹{bill.totalAmount.toLocaleString()}</span>
                                <span className="text-neutral-500">✎</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="text-sm text-neutral-400 font-medium">
                          Total: ₹{patient.bills?.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString() || 0}
                        </span>
                        <button
                          onClick={() => onAddBill(patient.id)}
                          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-blue-400 px-2 py-1 rounded border border-neutral-700 w-fit"
                        >
                          + Add Bill
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuFor(openMenuFor === patient.id ? null : patient.id)}
                            className="h-8 w-8 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                            title="More actions"
                          >
                            ⋮
                          </button>

                          {openMenuFor === patient.id && (
                            <div className="absolute right-0 mt-2 w-44 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20">
                              <button
                                onClick={() => {
                                  onEditPatient(patient.id);
                                  setOpenMenuFor(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-neutral-800 rounded-t-lg"
                              >
                                Edit Patient
                              </button>
                              <button
                                onClick={() => {
                                  onAddAdvance(patient.id);
                                  setOpenMenuFor(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-neutral-800"
                              >
                                Add Advance
                              </button>
                              <button
                                onClick={() => {
                                  onDischarge(patient.id);
                                  setOpenMenuFor(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-b-lg"
                              >
                                Discharge
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
