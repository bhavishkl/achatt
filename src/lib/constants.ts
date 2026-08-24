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
    { id: 1, name: 'GENERAL CONSULTATION', rate: 500, category: 'CONSULTATION' },
    { id: 2, name: 'SPECIALIST CONSULTATION', rate: 1000, category: 'CONSULTATION' },
    { id: 3, name: 'GENERAL WARD ADMISSION (PER DAY)', rate: 2000, category: 'ROOM CHARGES' },
    { id: 4, name: 'ICU CHARGES (PER DAY)', rate: 15000, category: 'ROOM CHARGES' },
    { id: 5, name: 'SEMI SPECIAL BED CHARGE', rate: 3500, category: 'WARD CHARGES' },
    { id: 6, name: 'SEMI SPECIAL DOCTOR CHARGE', rate: 1000, category: 'WARD CHARGES' },
    { id: 7, name: 'SEMI SPECIAL DUTY DOCTOR CHARGE', rate: 700, category: 'WARD CHARGES' },
    { id: 8, name: 'SEMI SPECIAL NURSING CHARGES (PER DAY)', rate: 500, category: 'SERVICE' },
    { id: 9, name: 'SEMI SPECIAL NIBP CHARGE', rate: 300, category: 'WARD CHARGES' },
    { id: 10, name: 'COMPLETE BLOOD COUNT (CBC)', rate: 350, category: 'LAB TEST' },
    { id: 11, name: 'X-RAY (CHEST/LIMB)', rate: 800, category: 'RADIOLOGY' },
    { id: 12, name: 'MRI SCAN', rate: 8000, category: 'RADIOLOGY' },
    { id: 13, name: 'PARACETAMOL IV', rate: 150, category: 'PHARMACY' },
    { id: 14, name: 'ANTIBIOTICS IV', rate: 1200, category: 'PHARMACY' },
    { id: 15, name: 'GLOVES/SYRINGES KIT', rate: 200, category: 'CONSUMABLES' },
    { id: 16, name: 'SPECIAL BED CHARGE', rate: 5000, category: 'WARD CHARGES' },
    { id: 17, name: 'SPECIAL DOCTOR CHARGE', rate: 1000, category: 'WARD CHARGES' },
    { id: 18, name: 'SPECIAL DUTY DOCTOR CHARGE', rate: 700, category: 'WARD CHARGES' },
    { id: 19, name: 'SPECIAL NURSING CHARGES (PER DAY)', rate: 500, category: 'SERVICE' },
    { id: 20, name: 'SPECIAL NIBP CHARGE', rate: 300, category: 'WARD CHARGES' },
] as const;

export const WARD_BILL_PACKAGES = [
    {
        id: 101,
        name: 'SEMI SPECIAL ROOM PACKAGE',
        wardKeywords: ['semi special', 'semi-special', 'semispecial'],
        items: [
            { name: 'SEMI SPECIAL BED CHARGE', rate: 3500 },
            { name: 'DOCTOR CHARGE', rate: 1000 },
            { name: 'DUTY DOCTOR CHARGE', rate: 700 },
            { name: 'NURSING CHARGES (PER DAY)', rate: 500 },
            { name: 'NIBP CHARGE', rate: 300 },
        ],
    },
    {
        id: 102,
        name: 'SPECIAL ROOM PACKAGE',
        wardKeywords: ['special', 'special room', 'specialroom'],
        items: [
            { name: 'SPECIAL BED CHARGE', rate: 5000 },
            { name: 'DOCTOR CHARGE', rate: 1000 },
            { name: 'DUTY DOCTOR CHARGE', rate: 700 },
            { name: 'NURSING CHARGES (PER DAY)', rate: 500 },
            { name: 'NIBP CHARGE', rate: 300 },
        ],
    },
] as const;
