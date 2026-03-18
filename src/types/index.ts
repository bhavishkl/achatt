export interface InvestigationEntry {
  id: string;
  date: string;
  category: string;
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
