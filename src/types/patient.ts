export interface BillItem {
    id: string;
    description: string;
    rate: number;
    quantity: number;
    amount: number;
}

export interface Bill {
    id: string;
    billNo?: string;
    date: string;
    dischargeDate?: string;
    dischargeTime?: string; // HH:mm
    ipBillType?: "draft" | "final";
    grossAmount?: number;
    advanceUsed?: number;
    concession?: number;
    totalAmount: number;
    /** Part of the net amount collected in cash. */
    paidCash?: number;
    /** Part of the net amount collected online (UPI / card / bank transfer). */
    paidOnline?: number;
    items: BillItem[];
}

/** One row of the patient advance ledger (patient_advances table). */
export interface AdvanceEntry {
    id: string;
    patientId: string;
    /** "credit" = advance payment received; "debit" = adjustment against a bill. */
    entryType: "credit" | "debit";
    amount: number;
    /** "cash" | "online" for credits; "adjustment" for bill debits; legacy rows may be "". */
    mode: string;
    note: string;
    referenceBillId?: string;
    /** ISO timestamp of the entry. */
    createdAt: string;
    /** True when the receipt was deleted (voided) — excluded from balances but kept in history. */
    voided?: boolean;
    /** Basic patient info joined at query time, when the patient still exists. */
    patient?: {
        regNo: string;
        ipNumber?: string;
        prefix: string;
        name: string;
        gender: string;
        age: number;
        wardName: string;
        bedNo: string;
        attenderMobile: string;
        status: string;
    } | null;
}

export interface Patient {
    id: string;
    // Generated
    regNo: string;
    ipNumber?: string; // format: e.g. 2818/2026

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
    dischargeTime?: string; // HH:mm
    advanceBalance: number;
    bills: Bill[];
}
