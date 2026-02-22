"use client";

import { Patient } from "@/types/patient";

interface AdmittedPatientsTableProps {
    patients: Patient[];
    onDischarge: (id: string) => void;
    onAddBill: (id: string) => void;
    onEditBill: (patientId: string, billId: string) => void;
    onEditPatient: (patientId: string) => void;
    onAddNew: () => void;
}

export default function AdmittedPatientsTable({
    patients,
    onDischarge,
    onAddBill,
    onEditBill,
    onEditPatient,
    onAddNew,
}: AdmittedPatientsTableProps) {
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={onAddNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <span>+</span> New Admission
                </button>
            </div>

            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-800 text-neutral-400">
                            <tr>
                                <th className="p-4 min-w-[120px]">Reg No</th>
                                <th className="p-4 min-w-[200px]">Patient Details</th>
                                <th className="p-4 min-w-[150px]">Ward</th>
                                <th className="p-4 min-w-[150px]">Admission Info</th>
                                <th className="p-4 min-w-[150px]">Attender</th>
                                <th className="p-4 min-w-[120px]">Bills</th>
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
                                patients.map(patient => (
                                    <tr key={patient.id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="p-4 font-mono text-neutral-400">{patient.regNo}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-white">
                                                {patient.prefix} {patient.name}
                                            </div>
                                            <div className="text-neutral-500 text-xs mt-1">
                                                {patient.gender}, {patient.age} Yrs
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-neutral-300"> {patient.wardName}</div>
                                            <div className="text-neutral-500 text-xs mt-1">
                                                (Bed: {patient.bedNo})
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-neutral-300">{patient.admissionDate}</div>
                                            <div className="text-neutral-500 text-xs">{patient.admissionTime}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-neutral-300">{patient.attenderName}</div>
                                            <div className="text-neutral-500 text-xs">
                                                {patient.attenderRelation}
                                            </div>
                                            <div className="text-neutral-500 text-xs font-mono">
                                                {patient.attenderMobile}
                                            </div>
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
                                                                <span className="text-neutral-500">{bill.date}</span>
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
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onEditPatient(patient.id)}
                                                    className="text-sm bg-neutral-800 hover:bg-neutral-700 text-blue-400 px-3 py-1 rounded border border-neutral-700 transition-colors"
                                                >
                                                    ✎ Edit
                                                </button>
                                                <button
                                                    onClick={() => onDischarge(patient.id)}
                                                    className="text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1 rounded border border-neutral-700 transition-colors"
                                                >
                                                    Discharge
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
