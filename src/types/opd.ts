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
  timing?: string;
  routine?: string;
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
  printOffsets?: {
    enableAbsolutePositioning: boolean;
    pageMargin: { top: number; right: number; bottom: number; left: number };
    patientInfo: {
      name: { top: number; left: number };
      age: { top: number; left: number };
      gender: { top: number; left: number };
      date: { top: number; left: number };
      weight: { top: number; left: number };
      bp: { top: number; left: number };
      spo2: { top: number; left: number };
    };
  };
}

export interface Prescription {
  chiefComplaints: string;
  diagnosis: string;
  testsAdvised: TestEntry[];
  respiratoryExamination: string;
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
  respiratoryExamination: "",
  testResults: [{ id: `tr-${Date.now()}`, testName: "", result: "", date: "" }],
  medicines: [{ id: `rx-${Date.now()}`, name: "", timing: "", routine: "", frequency: "1-0-1", duration: "", route: "Oral", instructions: "" }],
  nextVisitDate: "",
  nextVisitReason: "",
  customSections: [],
});

export const DEFAULT_FORMAT_CONFIG: PrescriptionFormatConfig = {
  sectionOrder: [
    "chiefComplaints",
    "diagnosis",
    "testsAdvised",
    "respiratoryExamination",
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
  printOffsets: {
    enableAbsolutePositioning: false,
    pageMargin: { top: 0, right: 0, bottom: 0, left: 0 },
    patientInfo: {
      name: { top: 0, left: 0 },
      age: { top: 0, left: 0 },
      gender: { top: 0, left: 0 },
      date: { top: 0, left: 0 },
      weight: { top: 0, left: 0 },
      bp: { top: 0, left: 0 },
      spo2: { top: 0, left: 0 },
    },
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
    printOffsets: config?.printOffsets ? {
      enableAbsolutePositioning: config.printOffsets.enableAbsolutePositioning,
      pageMargin: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.pageMargin, ...config.printOffsets.pageMargin },
      patientInfo: {
        name: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.name, ...config.printOffsets.patientInfo?.name },
        age: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.age, ...config.printOffsets.patientInfo?.age },
        gender: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.gender, ...config.printOffsets.patientInfo?.gender },
        date: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.date, ...config.printOffsets.patientInfo?.date },
        weight: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.weight, ...config.printOffsets.patientInfo?.weight },
        bp: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.bp, ...config.printOffsets.patientInfo?.bp },
        spo2: { ...DEFAULT_FORMAT_CONFIG.printOffsets!.patientInfo.spo2, ...config.printOffsets.patientInfo?.spo2 },
      }
    } : DEFAULT_FORMAT_CONFIG.printOffsets,
  };
};

export const DEFAULT_SECTION_HEADINGS: Record<string, string> = {
  chiefComplaints: "Chief Complaints",
  diagnosis: "Diagnosis",
  testsAdvised: "Tests Advised",
  respiratoryExamination: "Respiratory Examination",
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
