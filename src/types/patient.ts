export interface BillItem {
    id: string;
    description: string;
    rate: number;
    quantity: number;
    amount: number;
}

export interface Bill {
    id: string;
    date: string;
    dischargeDate?: string;
    ipBillType?: "draft" | "final";
    grossAmount?: number;
    advanceUsed?: number;
    concession?: number;
    totalAmount: number;
    items: BillItem[];
}

export interface Patient {
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
    advanceBalance: number;
    bills: Bill[];
}
