import { DischargeData, InvestigationEntry, TreatmentEntry, INVESTIGATION_CATEGORIES } from '../types';

// ─── Utilities ────────────────────────────────────────────────────────────────

let idCounter = 0;
const uid = () => `parsed-${++idCounter}-${Date.now()}`;

/** Remove common label prefixes and trim */
function strip(text: string, ...labels: string[]): string {
  let s = text.trim();
  for (const label of labels) {
    const re = new RegExp(`^${label}\\s*[-:/~]?\\s*`, 'i');
    s = s.replace(re, '').trim();
  }
  return s;
}

/** date patterns: 21/03/2026 | 21/03/26 | 21-03-2026 */
const DATE_RE = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;

function extractDate(line: string): string | null {
  const m = line.match(DATE_RE);
  return m ? m[1] : null;
}

/** Normalize a date string to DD/MM/YYYY */
function normalizeDate(d: string): string {
  const parts = d.split(/[\/\-\.]/);
  if (parts.length !== 3) return d;
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`;
}

// ─── Section splitter ──────────────────────────────────────────────────────────

const SECTION_HEADERS: Record<string, RegExp> = {
  finalDiagnosis: /^(final\s*diagnosis|diagnosis)\s*[-:/~]?\s*\.?\s*$/i,
  clinicalPresentation:
    /^(clinical\s*presentation|presenting\s*complaints?|chief\s*complaints?|history|clinical\s*history)\s*[-:/~]?\s*\.?\s*$/i,
  investigations: /^(investigation|investigations|lab|laboratory)\s*[-:/~]?\s*\.?\s*$/i,
  treatmentGiven:
    /^(treatment\s*given|treatment|medications?\s*given|medications?|drugs?\s*given)\s*[-:/~]?\s*\.?\s*$/i,
  hospitalCourse:
    /^(course\s*in\s*the?\s*hospital|hospital\s*course|surgical\s*procedure|course|management)\s*[-:\/~]?\s*\.?\s*$/i,
  dischargeAdvice:
    /^(advice?\s*on\s*discharge|discharge\s*advice?|advice?\s*at\s*discharge|advise\s*on\s*discharge|advice)\s*[-:/~]?\s*\.?\s*$/i,
  followUp:
    /^(next\s*follow\s*up|follow\s*up|f\/u|follow-up)\s*[-:/~]?\s*\.?\s*$/i,
};

function detectSectionKey(line: string): string | null {
  const trimmed = line.trim();
  for (const [key, re] of Object.entries(SECTION_HEADERS)) {
    if (re.test(trimmed)) return key;
  }
  return null;
}

// ─── Patient header parser ────────────────────────────────────────────────────

interface PatientInfo {
  patientName: string;
  age: string;
  gender: string;
  ipNo: string;
  admissionDate: string;
  dischargeDate: string;
  dischargeAgainstMedicalAdvice: boolean;
  finalDiagnosis: string;
}

function parsePatientHeader(headerLines: string[]): PatientInfo {
  let patientName = '';
  let age = '';
  let gender = '';
  let ipNo = '';
  let admissionDate = '';
  let dischargeDate = '';
  let dischargeAgainstMedicalAdvice = false;
  let finalDiagnosis = '';

  /**
   * Try to extract age+gender from anywhere within a string.
   * Handles: "64/ Male", "64/Male", "64 Male", "Age: 64/ Male", "Age : 64/ Male"
   */
  const tryExtractAgeGender = (text: string): boolean => {
    // Allow optional "Age" label, then digits, then any separator (/ , space), then gender word
    const m = text.match(
      /(?:age\s*[-:/~]?\s*)?(\d{1,3})\s*(?:y|yr|yrs|year|years)?\s*[\/,]\s*(male|female|m\b|f\b)/i
    );
    if (m) {
      age = m[1];
      gender = m[2].toLowerCase().startsWith('m') ? 'Male' : 'Female';
      return true;
    }
    // Also handle "Age : 64 Male" (space separator, no slash)
    const m2 = text.match(
      /age\s*[-:/~]?\s*(\d{1,3})\s*(?:y|yr|yrs|year|years)?\s+(male|female)\b/i
    );
    if (m2) {
      age = m2[1];
      gender = m2[2].toLowerCase().startsWith('m') ? 'Male' : 'Female';
      return true;
    }
    return false;
  };

  for (const raw of headerLines) {
    const line = raw.trim();
    if (!line) continue;

    // DAMA check
    if (/dama|discharge\s*against\s*medical/i.test(line)) {
      dischargeAgainstMedicalAdvice = true;
      continue;
    }

    // IP Number — handles "IP NUMBER 2636/26" with or without colon/dash
    if (/^ip\s*(?:number|no\.?|#)\s*[-:/]?\s*/i.test(line)) {
      ipNo = line.replace(/^ip\s*(?:number|no\.?|#)\s*[-:/]?\s*/i, '').trim();
      continue;
    }

    // DOA / Admission date
    if (/^d[\/.]?o[\/.]?a\b/i.test(line) || /^date\s*of\s*adm/i.test(line)) {
      const d = extractDate(line);
      if (d) admissionDate = normalizeDate(d);
      continue;
    }

    // DOD / Discharge date
    if (/^d[\/.]?o[\/.]?d\b/i.test(line) || /^date\s*of\s*dis/i.test(line)) {
      const d = extractDate(line);
      if (d) dischargeDate = normalizeDate(d);
      continue;
    }

    // Final diagnosis inline
    if (/^(final\s*)?diagnosis\s*[-:/~]\s*/i.test(line)) {
      finalDiagnosis = strip(line, 'final\\s*diagnosis', 'diagnosis');
      continue;
    }

    // Dedicated "Age ..." line (not part of patient name line)
    if (/^age\s*[-:/~]?\s*\d/i.test(line)) {
      if (!age) tryExtractAgeGender(line);
      continue;
    }

    // Patient Name line — may contain "Age: 64/ Male" embedded on the same line
    // e.g. "Patient Name - Mallanna  . Age : 64/ Male"
    const nameMatch = line.match(/(?:patient\s*name|name)\s*[-:/~]/i);
    if (nameMatch && nameMatch.index !== undefined) {
      const rest = line.slice(nameMatch.index + nameMatch[0].length).trim();

      // Look for an "Age" keyword or a "digits/gender" pattern within the rest
      // Search for "Age" boundary marker: preceded by . , / or whitespace
      const ageMarkerRe = /(?:[.,\/]\s*|\s{2,})(age\s*[-:/~]?\s*\d|\d{1,3}\s*[\/]\s*(?:male|female|m\b|f\b)|\d{1,3}\s*years?)/i;
      const markerMatch = rest.match(ageMarkerRe);
      if (markerMatch && markerMatch.index !== undefined) {
        patientName = rest.slice(0, markerMatch.index).replace(/[.,\s]+$/, '').trim();
        tryExtractAgeGender(rest.slice(markerMatch.index));
      } else {
        patientName = rest;
      }
      continue;
    }

    // Age on its own line as "64/ Male"
    if (!age && /^\d{1,3}\s*[\/]\s*(male|female|m|f)\s*$/i.test(line)) {
      tryExtractAgeGender(line);
      continue;
    }
  }

  return {
    patientName,
    age,
    gender,
    ipNo,
    admissionDate,
    dischargeDate,
    dischargeAgainstMedicalAdvice,
    finalDiagnosis,
  };
}

// ─── Investigation parser ─────────────────────────────────────────────────────

const KNOWN_CATEGORIES = [
  ...INVESTIGATION_CATEGORIES.map((category) => category.toLowerCase()),
  'haematology',
  'pathology',
  'biochemistry',
  'urine',
  'serology',
  'culture',
  'biopsy',
  'histopathology',
  'sonography',
  'usg',
  'mri',
  'ct',
  'x-ray',
  'ultrasound',
];

function isCategoryHeader(line: string): boolean {
  const l = line.trim().toLowerCase();
  return KNOWN_CATEGORIES.includes(l);
}

function normalizeCategoryName(line: string): string {
  const l = line.trim();
  const lower = l.toLowerCase();
  if (lower === 'abg') return 'ABG';
  if (lower === 'usg') return 'USG';
  if (lower === 'ecg') return 'ECG';
  const matched = INVESTIGATION_CATEGORIES.find((category) => category.toLowerCase() === lower);
  if (matched) return matched;
  return l.charAt(0).toUpperCase() + l.slice(1).toLowerCase();
}

function parseInvestigations(lines: string[]): InvestigationEntry[] {
  const results: InvestigationEntry[] = [];
  let currentCategory = 'General';
  let currentDate = '';
  let contentLines: string[] = [];

  const flushBlock = () => {
    if (contentLines.length > 0) {
      results.push({
        id: uid(),
        date: currentDate,
        category: currentCategory,
        name: '',
        result: contentLines.join('\n'),
      });
      contentLines = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Category header
    if (isCategoryHeader(line)) {
      flushBlock();
      currentCategory = normalizeCategoryName(line);
      currentDate = '';
      continue;
    }

    // Standalone date line (only a date, nothing else meaningful after it)
    const dateOnly = extractDate(line);
    if (dateOnly && line.replace(DATE_RE, '').trim().length < 3) {
      flushBlock();
      currentDate = normalizeDate(dateOnly);
      continue;
    }

    // Line that STARTS with a date followed by content, e.g. "21/03/2026 CXR - ..."
    const startsWithDate = line.match(
      /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.*)/
    );
    if (startsWithDate) {
      flushBlock();
      currentDate = normalizeDate(startsWithDate[1]);
      const rest = startsWithDate[2].trim();
      if (rest) contentLines.push(rest);
      continue;
    }

    // Regular content line — belongs to current date block
    contentLines.push(line);
  }

  flushBlock();
  return results;
}


// ─── Treatment parser ─────────────────────────────────────────────────────────

function parseTreatment(lines: string[]): TreatmentEntry[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => ({ id: uid(), name: line, dosage: '' }));
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseDischargeText(raw: string): DischargeData {
  idCounter = 0;

  const allLines = raw.split('\n');

  type SectionName = keyof typeof SECTION_HEADERS | 'header';

  const sections: Record<string, string[]> = {
    header: [],
    finalDiagnosis: [],
    clinicalPresentation: [],
    investigations: [],
    treatmentGiven: [],
    hospitalCourse: [],
    dischargeAdvice: [],
    followUp: [],
  };

  let current: SectionName = 'header';

  for (const line of allLines) {
    const key = detectSectionKey(line);
    if (key) {
      current = key as SectionName;
      continue;
    }
    sections[current].push(line);
  }

  const patientInfo = parsePatientHeader(sections.header);
  const investigations = parseInvestigations(sections.investigations);
  const treatmentGiven = parseTreatment(sections.treatmentGiven.filter((l) => l.trim()));

  const joinSection = (lines: string[]) =>
    lines.map((l) => l.trim()).filter(Boolean).join('\n');

  return {
    patientName: patientInfo.patientName,
    age: patientInfo.age,
    gender: patientInfo.gender,
    ipNo: patientInfo.ipNo,
    admissionDate: patientInfo.admissionDate,
    dischargeDate: patientInfo.dischargeDate,
    dischargeAgainstMedicalAdvice: patientInfo.dischargeAgainstMedicalAdvice,
    finalDiagnosis: patientInfo.finalDiagnosis || joinSection(sections.finalDiagnosis),
    clinicalPresentation: joinSection(sections.clinicalPresentation),
    investigations,
    treatmentGiven,
    hospitalCourse: joinSection(sections.hospitalCourse),
    dischargeAdvice: joinSection(sections.dischargeAdvice),
    followUp: joinSection(sections.followUp),
  };
}
