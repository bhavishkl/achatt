"use client";

import { ReceiptIndianRupee, SquarePen, Wallet } from "lucide-react";
import { Patient } from "@/types/patient";
import { formatDisplayDate, formatDisplayTime } from "@/components/add-bill-modal/utils";

interface AdmittedPatientsTableProps {
  patients: Patient[];
  onAddBill: (id: string) => void;
  onEditPatient: (patientId: string) => void;
  onAddAdvance: (id: string) => void;
  onAddNew: () => void;
}

export default function AdmittedPatientsTable({
  patients,
  onAddBill,
  onEditPatient,
  onAddAdvance,
  onAddNew,
}: AdmittedPatientsTableProps) {
  const actionButtonClass =
    "h-8 w-8 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Currently Admitted</h2>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 border border-blue-800/50 rounded-full px-2.5 py-0.5 text-xs">
              <span className="text-blue-400 uppercase tracking-wide font-medium">Total Admitted</span>
              <span className="font-mono font-semibold text-blue-300">{patients.length}</span>
            </span>
          </div>
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
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
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
                      <div className="text-neutral-500 text-xs">{formatDisplayTime(patient.admissionTime) || patient.admissionTime}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-neutral-300">{patient.attenderName}</div>
                      <div className="text-neutral-500 text-xs">{patient.attenderRelation}</div>
                      <div className="text-neutral-500 text-xs font-mono">{patient.attenderMobile}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => onAddBill(patient.id)}
                          className={`${actionButtonClass} text-blue-400`}
                          title={patient.bills?.length ? "Edit Bill" : "Add Bill"}
                          aria-label={patient.bills?.length ? "Edit Bill" : "Add Bill"}
                        >
                          <ReceiptIndianRupee className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditPatient(patient.id)}
                          className={`${actionButtonClass} text-neutral-300`}
                          title="Edit Patient"
                          aria-label="Edit Patient"
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onAddAdvance(patient.id)}
                          className={`${actionButtonClass} text-emerald-400`}
                          title="Add Advance"
                          aria-label="Add Advance"
                        >
                          <Wallet className="h-4 w-4" />
                        </button>
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
