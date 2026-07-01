// ============================================================
// OPD (Outpatient) Module Types
// ============================================================

// --- Patient Registry (separate from inpatient Patient) ---

export interface OpdPatient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string;
  bloodGroup: string;
  createdAt: string; // ISO
}

// --- Vitals ---

export interface Vitals {
  bloodPressureSystolic: number | "";
  bloodPressureDiastolic: number | "";
  pulse: number | "";
  temperature: number | "";
  temperatureUnit: "F" | "C";
  spo2: number | "";
  weight: number | "";
  height: number | "";
  respiratoryRate: number | "";
  bloodSugar: number | "";
  bloodSugarType: "fasting" | "random" | "pp";
  notes: string;
}

// --- OPD Billing ---

export interface OpdBillItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  amount: number;
}

export interface OpdBill {
  id: string;
  billNo: string;
  items: OpdBillItem[];
  grossAmount: number;
  concession: number;
  totalAmount: number;
  paidAmount: number;
  paymentMode: "cash" | "upi" | "card" | "other";
  createdAt: string;
}

// --- Prescription / Visit Pad ---

export interface MedicineEntry {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

export interface TestEntry {
  id: string;
  name: string;
  category: string;
  notes: string;
}

export interface TestResultEntry {
  id: string;
  testName: string;
  result: string;
  date: string;
  notes: string;
}

export interface CustomSection {
  id: string;
  heading: string;
  content: string;
  order: number;
  visible: boolean;
}

export interface PrescriptionFormatConfig {
  sectionOrder: string[];
  hiddenSections: string[];
  renamedHeadings: Record<string, string>;
  clinicHeader: {
    name: string;
    address: string;
    phone: string;
  };
}

export interface Prescription {
  chiefComplaints: string;
  diagnosis: string;
  testsAdvised: TestEntry[];
  testResults: TestResultEntry[];
  medicines: MedicineEntry[];
  nextVisitDate: string;
  nextVisitReason: string;
  customSections: CustomSection[];
}

// --- OPD Visit ---

export type OpdVisitStatus =
  | "waiting"
  | "vitals_done"
  | "in_consultation"
  | "completed";

export interface OpdVisit {
  id: string;
  patientId: string;
  visitDate: string; // YYYY-MM-DD
  tokenNo: number;
  status: OpdVisitStatus;
  vitals: Vitals | null;
  prescription: Prescription | null;
  bill: OpdBill | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// --- Default Factories ---

export const createEmptyVitals = (): Vitals => ({
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  pulse: "",
  temperature: "",
  temperatureUnit: "F",
  spo2: "",
  weight: "",
  height: "",
  respiratoryRate: "",
  bloodSugar: "",
  bloodSugarType: "random",
  notes: "",
});

export const createEmptyPrescription = (): Prescription => ({
  chiefComplaints: "",
  diagnosis: "",
  testsAdvised: [],
  testResults: [],
  medicines: [],
  nextVisitDate: "",
  nextVisitReason: "",
  customSections: [],
});

export const DEFAULT_FORMAT_CONFIG: PrescriptionFormatConfig = {
  sectionOrder: [
    "chiefComplaints",
    "diagnosis",
    "testsAdvised",
    "testResults",
    "medicines",
    "nextVisit",
  ],
  hiddenSections: [],
  renamedHeadings: {},
  clinicHeader: {
    name: "",
    address: "",
    phone: "",
  },
};

export const getMergedFormatConfig = (config?: Partial<PrescriptionFormatConfig> | null): PrescriptionFormatConfig => {
  return {
    ...DEFAULT_FORMAT_CONFIG,
    ...(config || {}),
    sectionOrder: config?.sectionOrder || DEFAULT_FORMAT_CONFIG.sectionOrder,
    hiddenSections: config?.hiddenSections || DEFAULT_FORMAT_CONFIG.hiddenSections,
    renamedHeadings: { ...DEFAULT_FORMAT_CONFIG.renamedHeadings, ...(config?.renamedHeadings || {}) },
    clinicHeader: { ...DEFAULT_FORMAT_CONFIG.clinicHeader, ...(config?.clinicHeader || {}) },
  };
};

export const DEFAULT_SECTION_HEADINGS: Record<string, string> = {
  chiefComplaints: "Chief Complaints",
  diagnosis: "Diagnosis",
  testsAdvised: "Tests Advised",
  testResults: "Test Results",
  medicines: "Medicines",
  nextVisit: "Next Visit",
};

export const MEDICINE_FREQUENCIES = [
  "1-0-1",
  "0-0-1",
  "1-0-0",
  "1-1-1",
  "1-1-0",
  "0-1-0",
  "0-1-1",
  "1-1-1-1",
  "SOS",
  "Stat",
  "Weekly",
  "As directed",
] as const;

export const MEDICINE_ROUTES = [
  "Oral",
  "IV (Intravenous)",
  "IM (Intramuscular)",
  "SC (Subcutaneous)",
  "Inhaled",
  "Nebulization",
  "Topical",
  "Sublingual",
  "Rectal",
  "Nasal",
] as const;
