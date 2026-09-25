'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Settings2 } from 'lucide-react';
import {
  DcardLayoutSettings,
  DEFAULT_DCARD_LAYOUT_SETTINGS,
} from '@/lib/dcardLayoutSettings';

const PANEL_OPEN_STORAGE_KEY = 'dcard-layout-settings-open';

interface DcardExportSettingsPanelProps {
  settings: DcardLayoutSettings;
  onChange: (settings: DcardLayoutSettings) => void;
  onReset: () => void;
}

const SECTION_LABELS: { key: keyof DcardLayoutSettings['sections']; label: string }[] = [
  { key: 'patientTable', label: 'Patient Info' },
  { key: 'finalDiagnosis', label: 'Final Diagnosis' },
  { key: 'clinicalPresentation', label: 'Clinical Presentation' },
  { key: 'investigations', label: 'Investigations' },
  { key: 'treatmentGiven', label: 'Treatment Given' },
  { key: 'hospitalCourse', label: 'Course In Hospital' },
  { key: 'dischargeAdvice', label: 'Advise On Discharge' },
  { key: 'followUp', label: 'Next Follow Up' },
];

const FONT_SIZE_OPTIONS = [18, 20, 22, 24, 26, 28, 30, 32].map((halfPoints) => ({
  value: halfPoints,
  label: `${halfPoints / 2}pt`,
}));

const MARGIN_FIELDS: { key: keyof DcardLayoutSettings['sections']['finalDiagnosis']['margin']; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
];

/** twips -> cm for display (1cm = 567 twips), rounded to 2 decimals. */
const twipsToCm = (twips: number) => Math.round((twips / 567) * 100) / 100;
/** cm -> twips */
const cmToTwips = (cm: number) => Math.round(cm * 567);

export default function DcardExportSettingsPanel({
  settings,
  onChange,
  onReset,
}: DcardExportSettingsPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPageOpen, setIsPageOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Restore last panel open/closed state.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsPanelOpen(window.localStorage.getItem(PANEL_OPEN_STORAGE_KEY) === 'true');
  }, []);

  const togglePanel = () => {
    setIsPanelOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PANEL_OPEN_STORAGE_KEY, String(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const updatePageMargin = (key: 'top' | 'bottom' | 'left' | 'right', cm: number) => {
    onChange({
      ...settings,
      page: { ...settings.page, [key]: cmToTwips(cm) },
    });
  };

  const updateSection = (
    key: keyof DcardLayoutSettings['sections'],
    updater: (style: DcardLayoutSettings['sections'][typeof key]) => DcardLayoutSettings['sections'][typeof key]
  ) => {
    onChange({
      ...settings,
      sections: {
        ...settings.sections,
        [key]: updater(settings.sections[key]),
      },
    });
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm print:hidden">
      {/* Collapsible header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={isPanelOpen}
          className="flex flex-1 min-w-0 items-center gap-2 text-left hover:opacity-80"
        >
          <Settings2 size={18} className="text-gray-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">Word Export Layout Settings</p>
            <p className="text-xs text-gray-500 truncate">
              Customize font size and margins per section and page margins for the exported .docx. Saved automatically in this browser.
            </p>
          </div>
          {isPanelOpen ? <ChevronUp size={18} className="text-gray-400 ml-auto shrink-0" /> : <ChevronDown size={18} className="text-gray-400 ml-auto shrink-0" />}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          title="Restore default layout"
        >
          <RotateCcw size={14} /> Reset defaults
        </button>
      </div>

      {isPanelOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">

      {/* Page margin */}
      <div className="mt-4 border border-gray-200 rounded-md">
        <button
          type="button"
          onClick={() => setIsPageOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          <span>Page Margins</span>
          <span className="text-xs text-gray-500">
            {twipsToCm(settings.page.top)} / {twipsToCm(settings.page.bottom)} / {twipsToCm(settings.page.left)} / {twipsToCm(settings.page.right)} cm (T/B/L/R)
          </span>
          <span className="text-gray-400">{isPageOpen ? '−' : '+'}</span>
        </button>
        {isPageOpen && (
          <div className="px-4 pb-4 pt-1 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-gray-100">
            {MARGIN_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label} (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={twipsToCm(settings.page[key])}
                  onChange={(e) => updatePageMargin(key, Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-section settings */}
      <div className="mt-3 space-y-2">
        {SECTION_LABELS.map(({ key, label }) => {
          const style = settings.sections[key];
          const isOpen = openSections.has(key);
          return (
            <div key={key} className="border border-gray-200 rounded-md">
              <button
                type="button"
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <span>{label}</span>
                <span className="text-xs text-gray-500">
                  {style.fontSize / 2}pt font
                </span>
                <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                    <select
                      value={style.fontSize}
                      onChange={(e) =>
                        updateSection(key, (style) => ({ ...style, fontSize: Number(e.target.value) }))
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {FONT_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:col-span-1">
                    {MARGIN_FIELDS.map(({ key: marginKey, label: marginLabel }) => (
                      <div key={marginKey}>
                        <label className="block text-xs text-gray-500 mb-1">
                          {marginLabel} (pt)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="500"
                          value={style.margin[marginKey]}
                          onChange={(e) =>
                            updateSection(key, (style) => ({
                              ...style,
                              margin: { ...style.margin, [marginKey]: Number(e.target.value) },
                            }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">≈{twipsToCm(style.margin[marginKey])}cm</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </div>
      )}
    </div>
  );
}
