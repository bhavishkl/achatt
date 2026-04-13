import { DischargeData } from '../types';

export const blankTemplate: DischargeData = {
  patientName: '',
  age: '',
  gender: '',
  ipNo: '',
  admissionDate: new Date().toISOString().split('T')[0],
  dischargeDate: new Date().toISOString().split('T')[0],
  dischargeAgainstMedicalAdvice: false,
  finalDiagnosis: '',
  clinicalPresentation: '',
  investigations: [],
  treatmentGiven: [],
  hospitalCourse: 'Conservative management.',
  dischargeAdvice: 'Attached to file',
  followUp: 'After one month'
};

export const standardTemplate: DischargeData = {
  patientName: 'Shrinivas',
  age: '44',
  gender: 'Male',
  ipNo: '2625/26',
  admissionDate: '2026-03-14',
  dischargeDate: '2026-03-18',
  dischargeAgainstMedicalAdvice: false,
  finalDiagnosis: '1. B/L Basal Pneumonitis',
  clinicalPresentation: 'Patient having Complaints of Dyspnoea on exacerbation, cough with expectoration, fever, along with generalized body weakness. With the above complaints patient approached our hospital for further management.',
  investigations: [
    { id: 'inv_1', category: 'RADIOLOGY', date: '2026-03-14', name: 'CXR', result: 'b/l basal pneumonitis' },
    { id: 'inv_2', category: 'RADIOLOGY', date: '2026-03-16', name: 'HRCT THORAX', result: 'Ground glass to increased attenuation area with minimal air bronchograms within it seen involving the both lung lower lobe.... PNEUMONITIS' },
    { id: 'inv_3', category: 'CARDIOLOGY', date: '2026-03-14', name: 'ECG', result: 'N' },
    { id: 'inv_4', category: 'CARDIOLOGY', date: '2026-03-16', name: 'Cardiology', result: 'Normal IVC 1.6' },
    { id: 'inv_5', category: 'HAEMATOLOGY', date: '2026-03-14', name: 'CBC, LFT, RFT, Electrolytes, Viral Markers', result: 'Platelets- 1.08 lakh, AEC-N, ESR-N, CRP-N, LFT- SGPT 45.5, RFT-N, Sr.electrolytes-N, HIV 1&2- Nr, HbsAg- N.' },
    { id: 'inv_6', category: 'HAEMATOLOGY', date: '2026-03-17', name: 'CBC, Electrolytes, Creatinine', result: 'Platelets- 1.28 Lakh, Sr.electrolytes- K+ 3.09, Sr.creatinine -N' },
    { id: 'inv_7', category: 'MICROBIOLOGY', date: '2026-03-14', name: 'Sputum for culture and sensitivity', result: 'No growth' },
  ],
  treatmentGiven: [
    { id: 'tx_1', name: 'Inj-Pantop infusion', dosage: '@4ml/hr' },
    { id: 'tx_2', name: 'Inj- Pantop 40mg', dosage: 'iv/tid' },
    { id: 'tx_3', name: 'Inj-Emset 4mg', dosage: 'iv/bd' },
    { id: 'tx_4', name: 'Inj-Fytobact 1.5 gm', dosage: 'iv/tid' },
    { id: 'tx_5', name: 'Tab-Zithral 500mg', dosage: '(0-0-1)' },
    { id: 'tx_6', name: 'Inj- Hydrocort 100mg', dosage: 'iv/tid' },
    { id: 'tx_7', name: 'Inj- Spirodine 100mg', dosage: 'iv/bd' },
    { id: 'tx_8', name: 'Neb-D+B', dosage: 'tid' },
    { id: 'tx_9', name: 'Syp-Tossex', dosage: '10 ml/tid' },
    { id: 'tx_10', name: 'Syp-Lactihip plus', dosage: '10ml/hs' },
    { id: 'tx_11', name: 'Tab- Fluvir 75mg', dosage: '(1-0-1)' },
    { id: 'tx_12', name: 'Inj-pct 100 ml', dosage: 'iv/stat' },
    { id: 'tx_13', name: 'Tab-Telekast- F', dosage: '(0-0-1)' },
    { id: 'tx_14', name: 'Inj & Optineuron', dosage: '2cc im/of' },
    { id: 'tx_15', name: 'Tab-Thiamine 100 mg', dosage: '(1-1-1)' },
    { id: 'tx_16', name: 'Syp-Mucaine gel', dosage: '10ml/tid' },
    { id: 'tx_17', name: 'Nasal saline spray', dosage: 'tid' },
    { id: 'tx_18', name: 'Syp-Potklor', dosage: '10ml/tid' }
  ],
  hospitalCourse: 'Conservative management.',
  dischargeAdvice: 'Attached to the file.',
  followUp: 'R/A 1 Month.'
};

export const dischargeTemplates: Record<string, { name: string; data: DischargeData }> = {
  blank: { name: 'Blank Template', data: blankTemplate },
  standard: { name: 'Standard (Pneumonitis)', data: standardTemplate }
};
