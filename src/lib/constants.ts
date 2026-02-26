export const DEPARTMENTS = [
    "Human Resources",
    "WARD",
    "OPD",
    "DUTY DOCTOR",
    "Sales",
    "Operations",
    "PHARMACY",
    "Legal",
    "Customer Support",
    "Administration",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const BILLABLE_ITEMS = [
    { id: 1, name: 'General Consultation', rate: 500, category: 'Consultation' },
    { id: 2, name: 'Specialist Consultation', rate: 1000, category: 'Consultation' },
    { id: 3, name: 'General Ward Admission (Per Day)', rate: 2000, category: 'Room Charges' },
    { id: 4, name: 'ICU Charges (Per Day)', rate: 15000, category: 'Room Charges' },
    { id: 5, name: 'Semi Special Bed Charge', rate: 3500, category: 'Ward Charges' },
    { id: 6, name: 'Semi Special Doctor Charge', rate: 1000, category: 'Ward Charges' },
    { id: 7, name: 'Semi Special Duty Doctor Charge', rate: 700, category: 'Ward Charges' },
    { id: 8, name: 'Semi Special Nursing Charges (Per Day)', rate: 500, category: 'Service' },
    { id: 9, name: 'Semi Special NIBP Charge', rate: 300, category: 'Ward Charges' },
    { id: 10, name: 'Complete Blood Count (CBC)', rate: 350, category: 'Lab Test' },
    { id: 11, name: 'X-Ray (Chest/Limb)', rate: 800, category: 'Radiology' },
    { id: 12, name: 'MRI Scan', rate: 8000, category: 'Radiology' },
    { id: 13, name: 'Paracetamol IV', rate: 150, category: 'Pharmacy' },
    { id: 14, name: 'Antibiotics IV', rate: 1200, category: 'Pharmacy' },
    { id: 15, name: 'Gloves/Syringes Kit', rate: 200, category: 'Consumables' },
    { id: 16, name: 'Special Bed Charge', rate: 5000, category: 'Ward Charges' },
    { id: 17, name: 'Special Doctor Charge', rate: 1000, category: 'Ward Charges' },
    { id: 18, name: 'Special Duty Doctor Charge', rate: 700, category: 'Ward Charges' },
    { id: 19, name: 'Special Nursing Charges (Per Day)', rate: 500, category: 'Service' },
    { id: 20, name: 'Special NIBP Charge', rate: 300, category: 'Ward Charges' },
] as const;

export const WARD_BILL_PACKAGES = [
    {
        id: 101,
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
        id: 102,
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
