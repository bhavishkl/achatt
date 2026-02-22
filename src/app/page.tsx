"use client";

import { useEffect, useState } from "react";
import { Patient, Bill } from "@/types/patient";
import { DUMMY_PATIENTS } from "@/data/patients";
import AdmittedPatientsTable from "@/components/AdmittedPatientsTable";
import DischargedPatientsTable from "@/components/DischargedPatientsTable";
import AddPatientModal from "@/components/AddPatientModal";
import AddBillModal from "@/components/AddBillModal";

const normalizePatient = (p: Patient): Patient => ({
  ...p,
  advanceBalance: p.advanceBalance ?? 0,
  bills: (p.bills ?? []).map((b) => ({
    ...b,
    dischargeDate: b.dischargeDate ?? "",
    ipBillType: b.ipBillType ?? "draft",
    grossAmount: b.grossAmount ?? b.totalAmount,
    advanceUsed: b.advanceUsed ?? 0,
    concession: b.concession ?? 0,
  })),
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<'admission' | 'discharged'>('admission');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Bill Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [advancePatientId, setAdvancePatientId] = useState<string | null>(null);
  const [advanceInput, setAdvanceInput] = useState<number | string>('');

  useEffect(() => {
    const stored = localStorage.getItem('patients');
    if (stored) {
      const parsed = JSON.parse(stored) as Patient[];
      const normalized = parsed.map(normalizePatient);
      setPatients(normalized);
      localStorage.setItem('patients', JSON.stringify(normalized));
    } else {
      const normalized = DUMMY_PATIENTS.map(normalizePatient);
      setPatients(normalized);
      localStorage.setItem('patients', JSON.stringify(normalized));
    }
  }, []);

  const handleSavePatient = (patient: Patient) => {
    let updatedPatients;
    const existingIndex = patients.findIndex(p => p.id === patient.id);
    if (existingIndex >= 0) {
      updatedPatients = [...patients];
      updatedPatients[existingIndex] = patient;
    } else {
      updatedPatients = [...patients, patient];
    }
    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    setEditingPatient(null);
  };

  const openEditPatientModal = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId) || null;
    setEditingPatient(patient);
    setIsAddModalOpen(true);
  };

  const closePatientModal = () => {
    setIsAddModalOpen(false);
    setEditingPatient(null);
  };

  const handleDischarge = (id: string) => {
    const updatedPatients = patients.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'discharged' as const,
          dischargeDate: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });
    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
  };

  const openBillModal = (patientId: string) => {
    setSelectedPatientId(patientId);
    setEditingBill(null);
    setIsBillModalOpen(true);
  };

  const openEditBillModal = (patientId: string, billId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const bill = patient?.bills?.find(b => b.id === billId) || null;
    setSelectedPatientId(patientId);
    setEditingBill(bill);
    setIsBillModalOpen(true);
  };

  const handleSaveBill = (patientId: string, bill: Bill) => {
    const updatedPatients = patients.map(p => {
      if (p.id === patientId) {
        const existingIndex = p.bills?.findIndex(b => b.id === bill.id) ?? -1;
        const previousAdvanceUsed = existingIndex >= 0 ? (p.bills?.[existingIndex]?.advanceUsed ?? 0) : 0;
        const nextAdvanceUsed = bill.advanceUsed ?? 0;
        const nextAdvanceBalance = Math.max(
          0,
          (p.advanceBalance ?? 0) + previousAdvanceUsed - nextAdvanceUsed
        );

        if (existingIndex >= 0) {
          // Update existing bill
          const updatedBills = [...(p.bills || [])];
          updatedBills[existingIndex] = bill;
          return { ...p, bills: updatedBills, advanceBalance: nextAdvanceBalance };
        } else {
          // Add new bill
          return { ...p, bills: [...(p.bills || []), bill], advanceBalance: nextAdvanceBalance };
        }
      }
      return p;
    });

    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    setEditingBill(null);
  };

  const closeBillModal = () => {
    setIsBillModalOpen(false);
    setEditingBill(null);
  };

  const openAdvanceModal = (patientId: string) => {
    setAdvancePatientId(patientId);
    setAdvanceInput('');
  };

  const closeAdvanceModal = () => {
    setAdvancePatientId(null);
    setAdvanceInput('');
  };

  const handleSaveAdvance = () => {
    if (!advancePatientId) return;
    const amount = Number(advanceInput);
    if (!amount || amount <= 0) return;

    const updatedPatients = patients.map((p) =>
      p.id === advancePatientId
        ? { ...p, advanceBalance: (p.advanceBalance ?? 0) + amount }
        : p
    );

    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    closeAdvanceModal();
  };

  const admittedPatients = patients.filter(p => p.status === 'admitted');
  const dischargedPatients = patients.filter(p => p.status === 'discharged');
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  const getNextRegNo = () => {
    const nums = patients
      .map(p => parseInt(p.regNo, 10))
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return String(max + 1).padStart(4, '0');
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Tabs */}
        <div className="flex border-b border-neutral-800 mb-6">
          <button
            onClick={() => setActiveTab('admission')}
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'admission'
              ? 'border-b-2 border-blue-600 text-blue-500'
              : 'text-neutral-400 hover:text-white'
              }`}
          >
            Current Admissions
          </button>
          <button
            onClick={() => setActiveTab('discharged')}
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'discharged'
              ? 'border-b-2 border-green-600 text-green-500'
              : 'text-neutral-400 hover:text-white'
              }`}
          >
            Discharged History
          </button>
        </div>

        {/* Content */}
        {activeTab === 'admission' && (
          <AdmittedPatientsTable
            patients={admittedPatients}
            onDischarge={handleDischarge}
            onAddBill={openBillModal}
            onEditBill={openEditBillModal}
            onEditPatient={openEditPatientModal}
            onAddAdvance={openAdvanceModal}
            onAddNew={() => { setEditingPatient(null); setIsAddModalOpen(true); }}
          />
        )}

        {activeTab === 'discharged' && (
          <DischargedPatientsTable patients={dischargedPatients} onViewBill={openEditBillModal} />
        )}
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        existingPatient={editingPatient}
        nextRegNo={getNextRegNo()}
        onClose={closePatientModal}
        onAddPatient={handleSavePatient}
      />

      <AddBillModal
        isOpen={isBillModalOpen}
        patient={selectedPatient}
        existingBill={editingBill}
        onClose={closeBillModal}
        onSaveBill={handleSaveBill}
      />

      {advancePatientId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Add Advance Amount</h3>
            <p className="text-sm text-neutral-400 mb-4">Enter advance received from patient.</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={advanceInput}
              onChange={(e) => setAdvanceInput(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. 5000"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={closeAdvanceModal}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdvance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
