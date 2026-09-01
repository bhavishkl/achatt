"use client";

import { useEffect, useState } from "react";
import { Patient } from "@/types/patient";
import { useAppStore } from "@/lib/store";

interface AddPatientModalProps {
    isOpen: boolean;
    existingPatient?: Patient | null;
    nextRegNo: string;
    onClose: () => void;
    onAddPatient: (patient: Patient) => void;
}

const INITIAL_FORM_DATA = {
    prefix: 'Mr.',
    name: '',
    gender: 'Male',
    age: '',
    admissionDate: '',
    admissionTime: '',
    wardName: '',
    bedNo: '',
    doctorName: '', // added doctorName
    attenderName: '',
    attenderAddress: '',
    attenderMobile: '',
    attenderRelation: '',
};

export default function AddPatientModal({
    isOpen,
    existingPatient,
    nextRegNo,
    onClose,
    onAddPatient,
}: AddPatientModalProps) {
    const { companyId } = useAppStore();
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    
    // IPD Data
    const [wards, setWards] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    const isEditing = !!existingPatient;

    // Fetch IPD data
    useEffect(() => {
        if (!isOpen || !companyId) return;

        const loadIpdData = async () => {
            try {
                const [wardsRes, doctorsRes] = await Promise.all([
                    fetch(`/api/ipd/wards?companyId=${companyId}`),
                    fetch(`/api/ipd/doctors?companyId=${companyId}`)
                ]);
                const wardsData = await wardsRes.json();
                const doctorsData = await doctorsRes.json();
                
                setWards(wardsData || []);
                setDoctors(doctorsData || []);

                // If not editing, auto-select if there is only 1 entry
                if (!existingPatient) {
                    setFormData(prev => ({
                        ...prev,
                        wardName: (wardsData?.length === 1) ? wardsData[0].name : prev.wardName,
                        doctorName: (doctorsData?.length === 1) ? `${doctorsData[0].prefix} ${doctorsData[0].name}` : prev.doctorName,
                    }));
                }
            } catch (error) {
                console.error("Failed to load IPD data", error);
            }
        };
        loadIpdData();
    }, [isOpen, companyId, existingPatient]);

    // Populate form when opening
    useEffect(() => {
        if (isOpen) {
            if (existingPatient) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFormData({
                    prefix: existingPatient.prefix,
                    name: existingPatient.name,
                    gender: existingPatient.gender,
                    age: String(existingPatient.age),
                    admissionDate: existingPatient.admissionDate,
                    admissionTime: existingPatient.admissionTime,
                    wardName: existingPatient.wardName,
                    bedNo: existingPatient.bedNo,
                    doctorName: existingPatient.doctorName ?? '',
                    attenderName: existingPatient.attenderName,
                    attenderAddress: existingPatient.attenderAddress,
                    attenderMobile: existingPatient.attenderMobile,
                    attenderRelation: existingPatient.attenderRelation,
                });
            } else {
                const now = new Date();
                const dateStr = now.toISOString().split('T')[0];
                const timeStr = now.toTimeString().slice(0, 5);
                setFormData(prev => ({
                    ...prev,
                    admissionDate: dateStr,
                    admissionTime: timeStr,
                }));
            }
        } else {
             // reset when closed
             setFormData(INITIAL_FORM_DATA);
        }
    }, [isOpen, existingPatient]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const patient: Patient = {
            id: existingPatient?.id || Date.now().toString(),
            regNo: existingPatient?.regNo || nextRegNo,
            // ipNumber is auto-generated server-side; preserve it on edits
            ipNumber: existingPatient?.ipNumber,
            prefix: formData.prefix,
            name: formData.name,
            gender: formData.gender,
            age: Number(formData.age),
            pincode: existingPatient?.pincode ?? '',
            admissionDate: formData.admissionDate,
            admissionTime: formData.admissionTime,
            hospitalName: existingPatient?.hospitalName ?? 'City General Hospital',
            doctorName: formData.doctorName,
            wardName: formData.wardName,
            bedNo: formData.bedNo,
            attenderName: formData.attenderName,
            attenderAddress: formData.attenderAddress,
            attenderMobile: formData.attenderMobile,
            attenderRelation: formData.attenderRelation,
            diagnosis: existingPatient?.diagnosis ?? '',
            status: existingPatient?.status || 'admitted',
            dischargeDate: existingPatient?.dischargeDate,
            advanceBalance: existingPatient?.advanceBalance ?? 0,
            bills: existingPatient?.bills || [],
        };

        onAddPatient(patient);
        setFormData(INITIAL_FORM_DATA);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 w-full max-w-2xl shadow-2xl my-8">
                <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-2">
                    <h2 className="text-xl font-bold">{isEditing ? 'Edit Patient Details' : 'New Patient Admission'}</h2>
                    {isEditing && existingPatient?.ipNumber && (
                        <span className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm">
                            <span className="text-neutral-400 text-xs uppercase tracking-wide">IP No</span>
                            <span className="font-mono font-semibold text-blue-300">{existingPatient.ipNumber}</span>
                            <span className="text-neutral-600 text-xs">🔒</span>
                        </span>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">

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

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Ref. Doctor</label>
                                <select
                                    required
                                    name="doctorName"
                                    value={formData.doctorName}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                >
                                    <option value="" disabled>Select Doctor</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={`${doc.prefix} ${doc.name}`}>
                                            {doc.prefix} {doc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Ward</label>
                                <select
                                    required
                                    name="wardName"
                                    value={formData.wardName}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                                >
                                    <option value="" disabled>Select Ward</option>
                                    {wards.map(ward => (
                                        <option key={ward.id} value={ward.name}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
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
                            onClick={onClose}
                            className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isEditing ? 'Update Patient' : 'Admit Patient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
