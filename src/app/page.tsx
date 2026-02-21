"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BILLABLE_ITEMS } from "@/lib/constants";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface BillItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  amount: number;
}

interface Bill {
  id: string;
  date: string;
  totalAmount: number;
  items: BillItem[];
}

interface Patient {
  id: string;
  // Generated
  regNo: string;
  
  // Patient Details
  prefix: string;
  name: string;
  gender: string;
  age: number;
  pincode: string;
  
  // Admission Details
  admissionDate: string; // YYYY-MM-DD
  admissionTime: string; // HH:mm
  
  // Doctor & Hospital
  hospitalName: string;
  doctorName: string;
  
  // Ward Details
  wardName: string;
  bedNo: string;
  
  // Attender Details
  attenderName: string;
  attenderAddress: string;
  attenderMobile: string;
  attenderRelation: string;

  // Status & Financials
  diagnosis: string; // Kept for backward compatibility/quick view
  status: 'admitted' | 'discharged';
  dischargeDate?: string;
  bills: Bill[];
}

// ----------------------------------------------------------------------
// Dummy Data
// ----------------------------------------------------------------------

const DUMMY_PATIENTS: Patient[] = [
  {
    id: '1',
    regNo: 'REG-20231025-001',
    prefix: 'Mr.',
    name: 'Rajesh Kumar',
    gender: 'Male',
    age: 45,
    pincode: '560001',
    admissionDate: '2023-10-25',
    admissionTime: '10:30',
    hospitalName: 'City General Hospital',
    doctorName: 'Dr. A. Sharma',
    wardName: 'General Ward',
    bedNo: 'G-12',
    attenderName: 'Suresh Kumar',
    attenderAddress: '123 MG Road, Bangalore',
    attenderMobile: '9876543210',
    attenderRelation: 'Brother',
    diagnosis: 'Viral Fever',
    status: 'admitted',
    bills: []
  },
  {
    id: '2',
    regNo: 'REG-20231020-002',
    prefix: 'Mrs.',
    name: 'Priya Singh',
    gender: 'Female',
    age: 32,
    pincode: '110001',
    admissionDate: '2023-10-20',
    admissionTime: '14:15',
    hospitalName: 'City General Hospital',
    doctorName: 'Dr. B. Gupta',
    wardName: 'Semi-Private',
    bedNo: 'SP-05',
    attenderName: 'Amit Singh',
    attenderAddress: '45 Lajpat Nagar, Delhi',
    attenderMobile: '9988776655',
    attenderRelation: 'Husband',
    diagnosis: 'Migraine',
    status: 'discharged',
    dischargeDate: '2023-10-24',
    bills: []
  }
];

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'admission' | 'discharged'>('admission');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Patient Form State
  const [formData, setFormData] = useState({
    prefix: 'Mr.',
    name: '',
    gender: 'Male',
    age: '',
    pincode: '',
    admissionDate: '',
    admissionTime: '',
    hospitalName: 'City General Hospital',
    doctorName: '',
    wardName: '',
    bedNo: '',
    attenderName: '',
    attenderAddress: '',
    attenderMobile: '',
    attenderRelation: '',
    diagnosis: ''
  });

  // Bill Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Bill Items State
  const [billItems, setBillItems] = useState<Omit<BillItem, 'amount'>[]>([
    { id: '1', description: '', rate: 0, quantity: 1 }
  ]);

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

  // Initial setup for date/time in form
  useEffect(() => {
    if (isAddModalOpen) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5); // HH:mm
      setFormData(prev => ({
        ...prev,
        admissionDate: dateStr,
        admissionTime: timeStr
      }));
    }
  }, [isAddModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const newRegNo = `REG-${datePart}-${randomPart}`;

    const newPatient: Patient = {
      id: Date.now().toString(),
      regNo: newRegNo,
      prefix: formData.prefix,
      name: formData.name,
      gender: formData.gender,
      age: Number(formData.age),
      pincode: formData.pincode,
      admissionDate: formData.admissionDate,
      admissionTime: formData.admissionTime,
      hospitalName: formData.hospitalName,
      doctorName: formData.doctorName,
      wardName: formData.wardName,
      bedNo: formData.bedNo,
      attenderName: formData.attenderName,
      attenderAddress: formData.attenderAddress,
      attenderMobile: formData.attenderMobile,
      attenderRelation: formData.attenderRelation,
      diagnosis: formData.diagnosis,
      status: 'admitted',
      bills: []
    };
    
    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    
    setFormData({
      prefix: 'Mr.',
      name: '',
      gender: 'Male',
      age: '',
      pincode: '',
      admissionDate: '',
      admissionTime: '',
      hospitalName: 'City General Hospital',
      doctorName: '',
      wardName: '',
      bedNo: '',
      attenderName: '',
      attenderAddress: '',
      attenderMobile: '',
      attenderRelation: '',
      diagnosis: ''
    });
    setIsAddModalOpen(false);
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
    setBillItems([{ id: Date.now().toString(), description: '', rate: 0, quantity: 1 }]);
    setIsBillModalOpen(true);
  };

  const handleBillItemChange = (id: string, field: keyof Omit<BillItem, 'amount' | 'id'>, value: string | number) => {
    setBillItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If description changed, try to find rate from constants
        if (field === 'description') {
           const foundItem = BILLABLE_ITEMS.find(b => b.name === value);
           if (foundItem) {
             updatedItem.rate = foundItem.rate;
           }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addBillRow = () => {
    setBillItems(prev => [...prev, { id: Date.now().toString(), description: '', rate: 0, quantity: 1 }]);
  };

  const removeBillRow = (id: string) => {
    if (billItems.length > 1) {
      setBillItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    // Filter out empty rows if any
    const validItems = billItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) return;

    const totalAmount = validItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    
    const newBill: Bill = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      totalAmount,
      items: validItems.map(item => ({
        ...item,
        amount: item.rate * item.quantity
      }))
    };

    const updatedPatients = patients.map(p => {
      if (p.id === selectedPatientId) {
        return {
          ...p,
          bills: [...(p.bills || []), newBill]
        };
      }
      return p;
    });

    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    setIsBillModalOpen(false);
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
  
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

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
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'admission'
                ? 'border-b-2 border-blue-600 text-blue-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Current Admissions
          </button>
          <button
            onClick={() => setActiveTab('discharged')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'discharged'
                ? 'border-b-2 border-green-600 text-green-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Discharged History
          </button>
        </div>

        {/* Content */}
        {activeTab === 'admission' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
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
                      <th className="p-4 min-w-[150px]">Doctor / Ward</th>
                      <th className="p-4 min-w-[150px]">Admission Info</th>
                      <th className="p-4 min-w-[150px]">Attender</th>
                      <th className="p-4 min-w-[120px]">Bills</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {admittedPatients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-500">
                          No admitted patients found.
                        </td>
                      </tr>
                    ) : (
                      admittedPatients.map(patient => (
                        <tr key={patient.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4 font-mono text-neutral-400">{patient.regNo}</td>
                          <td className="p-4">
                            <div className="font-medium text-white">
                              {patient.prefix} {patient.name}
                            </div>
                            <div className="text-neutral-500 text-xs mt-1">
                              {patient.gender}, {patient.age} Yrs
                            </div>
                            <div className="text-neutral-500 text-xs">
                              PIN: {patient.pincode}
                            </div>
                          </td>
                          <td className="p-4">
                             <div className="text-neutral-300">{patient.doctorName}</div>
                             <div className="text-neutral-500 text-xs mt-1">
                               {patient.wardName} (Bed: {patient.bedNo})
                             </div>
                             <div className="text-neutral-500 text-xs">
                               {patient.hospitalName}
                             </div>
                          </td>
                          <td className="p-4">
                            <div className="text-neutral-300">{patient.admissionDate}</div>
                            <div className="text-neutral-500 text-xs">{patient.admissionTime}</div>
                            <div className="text-blue-400 text-xs mt-1">{patient.diagnosis}</div>
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
                               <span className="text-sm text-neutral-400">
                                 Total: ₹{patient.bills?.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString() || 0}
                               </span>
                               <button
                                 onClick={() => openBillModal(patient.id)}
                                 className="text-xs bg-neutral-800 hover:bg-neutral-700 text-blue-400 px-2 py-1 rounded border border-neutral-700 w-fit"
                               >
                                 + Add Bill
                               </button>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDischarge(patient.id)}
                              className="text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1 rounded border border-neutral-700 transition-colors"
                            >
                              Discharge
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discharged' && (
          <div>
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-800 text-neutral-400">
                    <tr>
                      <th className="p-4">Reg No</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Diagnosis</th>
                      <th className="p-4">Admitted</th>
                      <th className="p-4">Discharged</th>
                      <th className="p-4">Total Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {dischargedPatients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                          No discharged patients found.
                        </td>
                      </tr>
                    ) : (
                      dischargedPatients.map(patient => (
                        <tr key={patient.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4 font-mono text-neutral-500">{patient.regNo}</td>
                          <td className="p-4 font-medium text-neutral-300">
                            {patient.prefix} {patient.name}
                            <div className="text-xs text-neutral-500">{patient.age} Yrs, {patient.gender}</div>
                          </td>
                          <td className="p-4 text-neutral-400">{patient.diagnosis}</td>
                          <td className="p-4 text-neutral-400">{patient.admissionDate}</td>
                          <td className="p-4 text-green-400">{patient.dischargeDate}</td>
                          <td className="p-4 text-neutral-300">
                            ₹{patient.bills?.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString() || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-xl font-bold mb-6 border-b border-neutral-800 pb-2">New Patient Admission</h2>
            <form onSubmit={handleAddPatient} className="space-y-6">
              
              {/* Section 1: Patient Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Patient Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                     <label className="block text-xs text-neutral-400 mb-1">Prefix</label>
                     <select
                        name="prefix"
                        value={formData.prefix}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                     >
                       <option>Mr.</option>
                       <option>Mrs.</option>
                       <option>Ms.</option>
                       <option>Master</option>
                       <option>Baby</option>
                     </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                    <input
                      required
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Gender</label>
                     <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                     >
                       <option>Male</option>
                       <option>Female</option>
                       <option>Other</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Age</label>
                    <input
                      required
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Pincode</label>
                    <input
                      required
                      name="pincode"
                      type="text"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      placeholder="e.g. 560001"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Admission & Clinical Info */}
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Clinical & Admission</h3>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Admission Date</label>
                      <input
                        required
                        name="admissionDate"
                        type="date"
                        value={formData.admissionDate}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm text-white"
                      />
                   </div>
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Admission Time</label>
                      <input
                        required
                        name="admissionTime"
                        type="time"
                        value={formData.admissionTime}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm text-white"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Hospital Name</label>
                      <input
                        required
                        name="hospitalName"
                        type="text"
                        value={formData.hospitalName}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      />
                   </div>
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Doctor Name</label>
                      <input
                        required
                        name="doctorName"
                        type="text"
                        value={formData.doctorName}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                        placeholder="e.g. Dr. A. Sharma"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Ward Name</label>
                      <input
                        required
                        name="wardName"
                        type="text"
                        value={formData.wardName}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                        placeholder="e.g. General Ward"
                      />
                   </div>
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Bed No</label>
                      <input
                        required
                        name="bedNo"
                        type="text"
                        value={formData.bedNo}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                        placeholder="e.g. 104"
                      />
                   </div>
                </div>
                
                 <div>
                    <label className="block text-xs text-neutral-400 mb-1">Initial Diagnosis / Complaint</label>
                    <input
                      required
                      name="diagnosis"
                      type="text"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      placeholder="e.g. Viral Fever, Accidental Injury"
                    />
                  </div>
              </div>

              {/* Section 3: Attender Details */}
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Attender Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Attender Name</label>
                      <input
                        required
                        name="attenderName"
                        type="text"
                        value={formData.attenderName}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      />
                   </div>
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Relation</label>
                      <input
                        required
                        name="attenderRelation"
                        type="text"
                        value={formData.attenderRelation}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                        placeholder="e.g. Father, Spouse"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Mobile No</label>
                      <input
                        required
                        name="attenderMobile"
                        type="tel"
                        value={formData.attenderMobile}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                        placeholder="10-digit mobile number"
                        pattern="[0-9]{10}"
                      />
                   </div>
                   <div>
                      <label className="block text-xs text-neutral-400 mb-1">Address</label>
                      <input
                        required
                        name="attenderAddress"
                        type="text"
                        value={formData.attenderAddress}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      />
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 w-full max-w-4xl shadow-2xl h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Add Bill</h2>
            
            {selectedPatient && (
              <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-neutral-500 text-xs uppercase tracking-wide">Patient</label>
                  <div className="font-medium text-white">{selectedPatient.prefix} {selectedPatient.name}</div>
                  <div className="text-neutral-400 text-xs">{selectedPatient.regNo}</div>
                </div>
                <div>
                  <label className="block text-neutral-500 text-xs uppercase tracking-wide">Admission</label>
                  <div className="text-neutral-300">{selectedPatient.wardName}, Bed {selectedPatient.bedNo}</div>
                  <div className="text-neutral-400 text-xs">{selectedPatient.admissionDate}</div>
                </div>
                <div>
                  <label className="block text-neutral-500 text-xs uppercase tracking-wide">Doctor</label>
                  <div className="text-neutral-300">{selectedPatient.doctorName}</div>
                  <div className="text-neutral-400 text-xs">{selectedPatient.hospitalName}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveBill} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-800 text-neutral-400 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Item / Description</th>
                      <th className="p-3 w-32">Rate (₹)</th>
                      <th className="p-3 w-24">Qty</th>
                      <th className="p-3 w-32 text-right">Amount (₹)</th>
                      <th className="p-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {billItems.map((item, index) => (
                      <tr key={item.id} className="group">
                        <td className="p-2">
                          <input
                             list="billable-items"
                             type="text"
                             className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none"
                             placeholder="Select or type item..."
                             value={item.description}
                             onChange={(e) => handleBillItemChange(item.id, 'description', e.target.value)}
                             required
                          />
                          <datalist id="billable-items">
                            {BILLABLE_ITEMS.map((opt) => (
                              <option key={opt.id} value={opt.name}>{opt.name} - ₹{opt.rate}</option>
                            ))}
                          </datalist>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none"
                            value={item.rate}
                            onChange={(e) => handleBillItemChange(item.id, 'rate', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none"
                            value={item.quantity}
                            onChange={(e) => handleBillItemChange(item.id, 'quantity', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-neutral-300">
                          ₹{(item.rate * item.quantity).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {billItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBillRow(item.id)}
                              className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addBillRow}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>+</span> Add Item
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
                <div className="text-right flex-1 mr-6">
                  <span className="text-neutral-400 text-sm uppercase tracking-wider mr-4">Total Bill Amount</span>
                  <span className="text-2xl font-bold text-white">₹{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
