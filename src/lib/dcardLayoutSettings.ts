/**
 * User-configurable layout settings for the Dcard Word (.docx) export.
 * All values are stored in twips-friendly units:
 *  - font sizes are in half-points (docx convention, 22 = 11pt)
 *  - margins are in twips (1cm ≈ 567 twips, 1 inch = 1440 twips)
 */
export interface DcardSectionStyle {
  /** Half-points, e.g. 22 = 11pt. */
  fontSize: number;
  /** Space around the section content, in twips (map to table cell margins). */
  margin: DcardSectionMargin;
}

export interface DcardSectionMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DcardLayoutSettings {
  /** Overall page margins in twips. */
  page: DcardSectionMargin;
  sections: {
    patientTable: DcardSectionStyle;
    finalDiagnosis: DcardSectionStyle;
    clinicalPresentation: DcardSectionStyle;
    investigations: DcardSectionStyle;
    treatmentGiven: DcardSectionStyle;
    hospitalCourse: DcardSectionStyle;
    dischargeAdvice: DcardSectionStyle;
    followUp: DcardSectionStyle;
  };
}

export const DEFAULT_DCARD_LAYOUT_SETTINGS: DcardLayoutSettings = {
  page: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
  sections: {
    patientTable: {
      fontSize: 22,
      margin: { top: 40, bottom: 40, left: 80, right: 80 },
    },
    finalDiagnosis: {
      fontSize: 22,
      margin: { top: 80, bottom: 80, left: 100, right: 100 },
    },
    clinicalPresentation: {
      fontSize: 22,
      margin: { top: 80, bottom: 80, left: 100, right: 100 },
    },
    investigations: {
      fontSize: 22,
      margin: { top: 40, bottom: 40, left: 80, right: 80 },
    },
    treatmentGiven: {
      fontSize: 22,
      margin: { top: 40, bottom: 40, left: 80, right: 80 },
    },
    hospitalCourse: {
      fontSize: 22,
      margin: { top: 80, bottom: 80, left: 100, right: 100 },
    },
    dischargeAdvice: {
      fontSize: 22,
      margin: { top: 80, bottom: 80, left: 100, right: 100 },
    },
    followUp: {
      fontSize: 22,
      margin: { top: 80, bottom: 80, left: 100, right: 100 },
    },
  },
};

const LAYOUT_SETTINGS_STORAGE_KEY = 'dcard-layout-settings';

export function loadDcardLayoutSettings(): DcardLayoutSettings {
  if (typeof window === 'undefined') return DEFAULT_DCARD_LAYOUT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(LAYOUT_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_DCARD_LAYOUT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DcardLayoutSettings>;
    return mergeWithDefaults(parsed);
  } catch {
    return DEFAULT_DCARD_LAYOUT_SETTINGS;
  }
}

export function saveDcardLayoutSettings(settings: DcardLayoutSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAYOUT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); settings just won't persist.
  }
}

export function clearDcardLayoutSettings(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LAYOUT_SETTINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Deep-merges a partial stored settings object over the defaults. */
export function mergeWithDefaults(
  partial: Partial<DcardLayoutSettings> | null | undefined
): DcardLayoutSettings {
  const base = DEFAULT_DCARD_LAYOUT_SETTINGS;
  if (!partial) return structuredClone(base);

  const merged = structuredClone(base);
  if (partial.page) {
    merged.page = { ...merged.page, ...partial.page };
  }
  if (partial.sections) {
    for (const key of Object.keys(merged.sections) as (keyof DcardLayoutSettings['sections'])[]) {
      const saved = partial.sections[key];
      if (saved) {
        merged.sections[key] = {
          fontSize: saved.fontSize ?? merged.sections[key].fontSize,
          margin: { ...merged.sections[key].margin, ...saved.margin },
        };
      }
    }
  }
  return merged;
}
