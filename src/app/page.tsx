"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Patient, Bill } from "@/types/patient";
import { DUMMY_PATIENTS } from "@/data/patients";
import AdmittedPatientsTable from "@/components/AdmittedPatientsTable";
import DischargedPatientsTable from "@/components/DischargedPatientsTable";
import AddPatientModal from "@/components/AddPatientModal";
import AddBillModal from "@/components/AddBillModal";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'admission' | 'discharged'>('admission');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Bill Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem('isAuthenticated');
    if (session !== 'true') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);

      const stored = localStorage.getItem('patients');
      if (stored) {
        setPatients(JSON.parse(stored));
      } else {
        setPatients(DUMMY_PATIENTS);
        localStorage.setItem('patients', JSON.stringify(DUMMY_PATIENTS));
      }
    }
  }, [router]);

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
        if (existingIndex >= 0) {
          // Update existing bill
          const updatedBills = [...(p.bills || [])];
          updatedBills[existingIndex] = bill;
          return { ...p, bills: updatedBills };
        } else {
          // Add new bill
          return { ...p, bills: [...(p.bills || []), bill] };
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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </main>
    );
  }

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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Hospital Admission System</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage patient admissions and discharges</p>
          </div>
          <Link href="/attendance" className="text-sm text-blue-400 hover:text-blue-300">
            Go to Staff Attendance &rarr;
          </Link>
        </header>

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
    </main>
  );
}
