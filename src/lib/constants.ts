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
    { id: 'semi_special_bed', name: 'Semi Special Bed Charge', rate: 3500, category: 'Ward Charges' },
    { id: 'semi_special_doctor_charge', name: 'Semi Special Doctor Charge', rate: 1000, category: 'Ward Charges' },
    { id: 'semi_special_duty_doctor_charge', name: 'Semi Special Duty Doctor Charge', rate: 700, category: 'Ward Charges' },
    { id: 'semi_special_nursing', name: 'Semi Special Nursing Charges (Per Day)', rate: 500, category: 'Service' },
    { id: 'semi_special_nibp_charge', name: 'Semi Special NIBP Charge', rate: 300, category: 'Ward Charges' },
    { id: 'blood_test', name: 'Complete Blood Count (CBC)', rate: 350, category: 'Lab Test' },
    { id: 'xray', name: 'X-Ray (Chest/Limb)', rate: 800, category: 'Radiology' },
    { id: 'mri', name: 'MRI Scan', rate: 8000, category: 'Radiology' },
    { id: 'med_para', name: 'Paracetamol IV', rate: 150, category: 'Pharmacy' },
    { id: 'med_abx', name: 'Antibiotics IV', rate: 1200, category: 'Pharmacy' },
    { id: 'consumables', name: 'Gloves/Syringes Kit', rate: 200, category: 'Consumables' },
    { id: 'special_bed', name: 'Special Bed Charge', rate: 5000, category: 'Ward Charges' },
    { id: 'special_doctor_charge', name: 'Special Doctor Charge', rate: 1000, category: 'Ward Charges' },
    { id: 'special_duty_doctor_charge', name: 'Special Duty Doctor Charge', rate: 700, category: 'Ward Charges' },
    { id: 'special_nursing', name: 'Special Nursing Charges (Per Day)', rate: 500, category: 'Service' },
    { id: 'special_nibp_charge', name: 'Special NIBP Charge', rate: 300, category: 'Ward Charges' },
] as const;

export const WARD_BILL_PACKAGES = [
    {
        id: 'pkg_semi_special_room',
        name: 'Semi Special Room Package',
        wardKeywords: ['semi special', 'semi-special', 'semispecial'],
        items: [
            { name: 'Semi Special Bed Charge', rate: 3500 },
            { name: 'Doctor Charge', rate: 1000 },
            { name: 'Duty Doctor Charge', rate: 700 },
            { name: 'Nursing Charges (Per Day)', rate: 500 },
            { name: 'NIBP Charge', rate: 300 },
        ],
    },
    {
        id: 'pkg_special_room',
        name: 'Special Room Package',
        wardKeywords: ['special', 'special room', 'specialroom'],
        items: [
            { name: 'Special Bed Charge', rate: 5000 },
            { name: 'Doctor Charge', rate: 1000 },
            { name: 'Duty Doctor Charge', rate: 700 },
            { name: 'Nursing Charges (Per Day)', rate: 500 },
            { name: 'NIBP Charge', rate: 300 },
        ],
    },
] as const;
