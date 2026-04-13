export const INVESTIGATION_CATEGORIES = [
  'Radiology',
  'Cardiology',
  'Hematology',
  'Microbiology',
  'ABG',
] as const;

export type InvestigationCategory = (typeof INVESTIGATION_CATEGORIES)[number] | 'Other';
export type InvestigationCategoryValue = InvestigationCategory | string;

export interface InvestigationEntry {
  id: string;
  date: string;
  category: InvestigationCategoryValue;
  name: string;
  result: string;
}

export interface TreatmentEntry {
  id: string;
  name: string;
  dosage: string;
}

export interface DischargeData {
  patientName: string;
  age: string;
  gender: string;
  ipNo: string;
  admissionDate: string;
  dischargeDate: string;
  dischargeAgainstMedicalAdvice: boolean;
  finalDiagnosis: string;
  clinicalPresentation: string;
  investigations: InvestigationEntry[];
  treatmentGiven: TreatmentEntry[];
  hospitalCourse: string;
  dischargeAdvice: string;
  followUp: string;
}
