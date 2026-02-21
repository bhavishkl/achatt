export const DEPARTMENTS = [
    "Human Resources",
    "WARD",
    "OPD",
    "DUTY DOCTOR",
    "Sales",
    "Operations",
    "IT",
    "Legal",
    "Customer Support",
    "Administration",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const BILLABLE_ITEMS = [
    { id: 'cons_gen', name: 'General Consultation', rate: 500, category: 'Consultation' },
    { id: 'cons_spec', name: 'Specialist Consultation', rate: 1000, category: 'Consultation' },
    { id: 'admit_gen', name: 'General Ward Admission (Per Day)', rate: 2000, category: 'Room Charges' },
    { id: 'admit_icu', name: 'ICU Charges (Per Day)', rate: 15000, category: 'Room Charges' },
    { id: 'nursing', name: 'Nursing Charges (Per Day)', rate: 500, category: 'Service' },
    { id: 'blood_test', name: 'Complete Blood Count (CBC)', rate: 350, category: 'Lab Test' },
    { id: 'xray', name: 'X-Ray (Chest/Limb)', rate: 800, category: 'Radiology' },
    { id: 'mri', name: 'MRI Scan', rate: 8000, category: 'Radiology' },
    { id: 'med_para', name: 'Paracetamol IV', rate: 150, category: 'Pharmacy' },
    { id: 'med_abx', name: 'Antibiotics IV', rate: 1200, category: 'Pharmacy' },
    { id: 'consumables', name: 'Gloves/Syringes Kit', rate: 200, category: 'Consumables' },
] as const;
