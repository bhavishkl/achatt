"use client";

import { useState, useMemo, useRef } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Save, CheckCircle, GripVertical, Eye, EyeOff, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Prescription, MedicineEntry, TestEntry, TestResultEntry, CustomSection } from "@/types/opd";
import { MEDICINE_FREQUENCIES, MEDICINE_ROUTES, DEFAULT_SECTION_HEADINGS, getMergedFormatConfig } from "@/types/opd";
import { PULMONOLOGY_MEDICINES, PULMONOLOGY_TESTS, PULMONOLOGY_DIAGNOSES } from "@/data/opdSeedData";
import { PrescriptionFormatSettings } from "@/components/doctor/PrescriptionFormatSettings";

type Props = {
  prescription: Prescription;
  onChange: (p: Prescription) => void;
  onSave: () => void;
  onComplete: () => void;
};

let _counter = 0;
const uid = () => `rx-${Date.now()}-${++_counter}`;

function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className = "",
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  className?: string;
  onSelect?: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 8);
    const q = value.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={placeholder}
        className={className}
      />
      {show && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(s);
                onSelect?.(s);
                setShow(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConsultationPad({ prescription, onChange, onSave, onComplete }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showFormatSettings, setShowFormatSettings] = useState(false);
  const [followUpNum, setFollowUpNum] = useState("");
  const [followUpUnit, setFollowUpUnit] = useState("days");

  const customMedicines = useAppStore((s) => s.customMedicines);
  const customTests = useAppStore((s) => s.customTests);
  const customDiagnoses = useAppStore((s) => s.customDiagnoses);
  const addCustomMedicine = useAppStore((s) => s.addCustomMedicine);
  const addCustomTest = useAppStore((s) => s.addCustomTest);
  const addCustomDiagnosis = useAppStore((s) => s.addCustomDiagnosis);
  const prescriptionTemplates = useAppStore((s) => s.prescriptionTemplates);
  const savePrescriptionTemplate = useAppStore((s) => s.savePrescriptionTemplate);
  const deletePrescriptionTemplate = useAppStore((s) => s.deletePrescriptionTemplate);
  const formatConfig = getMergedFormatConfig(useAppStore((s) => s.prescriptionFormatConfig));

  const allMedicines = useMemo(() => [...PULMONOLOGY_MEDICINES, ...customMedicines], [customMedicines]);
  const allTests = useMemo(() => [...PULMONOLOGY_TESTS, ...customTests], [customTests]);
  const allDiagnoses = useMemo(() => [...PULMONOLOGY_DIAGNOSES, ...customDiagnoses], [customDiagnoses]);

  const toggle = (key: string) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  const update = <K extends keyof Prescription>(key: K, value: Prescription[K]) => {
    onChange({ ...prescription, [key]: value });
  };

  const handleFollowUpChange = (num: string, unit: string) => {
    setFollowUpNum(num);
    setFollowUpUnit(unit);
    
    if (!num || isNaN(Number(num))) {
      update("nextVisitDate", "");
      return;
    }
    
    const d = new Date();
    const amount = parseInt(num, 10);
    if (unit === "days") d.setDate(d.getDate() + amount);
    if (unit === "weeks") d.setDate(d.getDate() + amount * 7);
    if (unit === "months") d.setMonth(d.getMonth() + amount);
    
    update("nextVisitDate", d.toISOString().split("T")[0]);
  };

  // Medicines
  const addMedicine = () => {
    update("medicines", [
      ...prescription.medicines,
      { id: uid(), name: "", dosage: "", frequency: "1-0-1", duration: "", route: "Oral", instructions: "" },
    ]);
  };
  const updateMedicine = (id: string, data: Partial<MedicineEntry>) => {
    update("medicines", prescription.medicines.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };
  const removeMedicine = (id: string) => {
    update("medicines", prescription.medicines.filter((m) => m.id !== id));
  };

  // Tests
  const addTest = () => {
    update("testsAdvised", [...prescription.testsAdvised, { id: uid(), name: "", category: "", notes: "" }]);
  };
  const updateTest = (id: string, data: Partial<TestEntry>) => {
    update("testsAdvised", prescription.testsAdvised.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };
  const removeTest = (id: string) => {
    update("testsAdvised", prescription.testsAdvised.filter((t) => t.id !== id));
  };

  // Test Results
  const addTestResult = () => {
    update("testResults", [...prescription.testResults, { id: uid(), testName: "", result: "", date: new Date().toISOString().split("T")[0], notes: "" }]);
  };
  const updateTestResult = (id: string, data: Partial<TestResultEntry>) => {
    update("testResults", prescription.testResults.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };
  const removeTestResult = (id: string) => {
    update("testResults", prescription.testResults.filter((t) => t.id !== id));
  };

  // Custom sections
  const addCustomSection = () => {
    update("customSections", [
      ...prescription.customSections,
      { id: uid(), heading: "Custom Section", content: "", order: prescription.customSections.length, visible: true },
    ]);
  };
  const updateCustomSection = (id: string, data: Partial<CustomSection>) => {
    update("customSections", prescription.customSections.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };
  const removeCustomSection = (id: string) => {
    update("customSections", prescription.customSections.filter((s) => s.id !== id));
  };

  // Templates
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    savePrescriptionTemplate(templateName.trim(), prescription);
    setTemplateName("");
  };

  const handleLoadTemplate = (rx: Prescription) => {
    onChange(JSON.parse(JSON.stringify(rx)));
    setShowTemplates(false);
  };

  const inputCls = "w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500";

  const sectionHeading = (key: string) =>
    formatConfig?.renamedHeadings?.[key] || DEFAULT_SECTION_HEADINGS[key] || key;

  return (
    <div className="space-y-4">
      {/* Template & Format Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
        >
          📋 Templates
        </button>
        <button
          onClick={() => setShowFormatSettings(!showFormatSettings)}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
        >
          <Settings className="mr-1 inline h-3 w-3" />
          Format Settings
        </button>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">Prescription Templates</h4>
          {prescriptionTemplates.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {prescriptionTemplates.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-2">
                  <button onClick={() => handleLoadTemplate(t.prescription)} className="text-sm text-blue-400 hover:underline">
                    {t.name}
                  </button>
                  <button onClick={() => deletePrescriptionTemplate(t.id)} className="text-xs text-neutral-500 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Save Current
            </button>
          </div>
        </div>
      )}

      {/* Format Settings */}
      {showFormatSettings && (
        <PrescriptionFormatSettings onClose={() => setShowFormatSettings(false)} />
      )}

      {/* Chief Complaints */}
      <Section title={sectionHeading("chiefComplaints")} sectionKey="chiefComplaints" collapsed={collapsed} onToggle={toggle}>
        <textarea
          value={prescription.chiefComplaints}
          onChange={(e) => update("chiefComplaints", e.target.value)}
          placeholder="Describe chief complaints..."
          rows={3}
          className={`${inputCls} resize-y`}
        />
      </Section>

      {/* Diagnosis */}
      <Section title={sectionHeading("diagnosis")} sectionKey="diagnosis" collapsed={collapsed} onToggle={toggle}>
        <AutocompleteInput
          value={prescription.diagnosis}
          onChange={(v) => update("diagnosis", v)}
          suggestions={allDiagnoses}
          placeholder="Enter diagnosis..."
          className={inputCls}
          onSelect={(v) => addCustomDiagnosis(v)}
        />
      </Section>



      {/* Advice */}
      <Section title="Advice" sectionKey="testResults" collapsed={collapsed} onToggle={toggle} onAdd={addTestResult} count={prescription.testResults.length}>
        <div className="space-y-2">
          {prescription.testResults.map((tr) => (
            <div key={tr.id} className="flex flex-wrap items-start gap-2">
              <AutocompleteInput
                value={tr.testName}
                onChange={(v) => updateTestResult(tr.id, { testName: v })}
                suggestions={allTests}
                placeholder="Test name"
                className={`${inputCls} w-40`}
              />
              <input
                type="text"
                value={tr.result}
                onChange={(e) => updateTestResult(tr.id, { result: e.target.value })}
                placeholder="Result"
                className={`${inputCls} w-32`}
              />

              <input
                type="text"
                value={tr.notes}
                onChange={(e) => updateTestResult(tr.id, { notes: e.target.value })}
                placeholder="Notes"
                className={`${inputCls} flex-1`}
              />
              <button onClick={() => removeTestResult(tr.id)} className="mt-2 text-neutral-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Medicines */}
      <Section title={sectionHeading("medicines")} sectionKey="medicines" collapsed={collapsed} onToggle={toggle} onAdd={addMedicine} count={prescription.medicines.length}>
        <div className="space-y-3">
          {prescription.medicines.map((med, i) => (
            <div key={med.id} className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Medicine #{i + 1}</span>
                <button onClick={() => removeMedicine(med.id)} className="text-neutral-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <AutocompleteInput
                  value={med.name}
                  onChange={(v) => updateMedicine(med.id, { name: v })}
                  suggestions={allMedicines}
                  placeholder="Medicine name"
                  className={inputCls}
                  onSelect={(v) => addCustomMedicine(v)}
                />
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(med.id, { dosage: e.target.value })}
                  placeholder="Dosage (e.g. 500mg)"
                  className={inputCls}
                />
                <select
                  value={med.frequency}
                  onChange={(e) => updateMedicine(med.id, { frequency: e.target.value })}
                  className={inputCls}
                >
                  {MEDICINE_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={med.duration}
                  onChange={(e) => updateMedicine(med.id, { duration: e.target.value })}
                  placeholder="Duration (e.g. 5 days)"
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Next Visit */}
      <Section title={sectionHeading("nextVisit")} sectionKey="nextVisit" collapsed={collapsed} onToggle={toggle}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Follow Up In</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={followUpNum}
                onChange={(e) => handleFollowUpChange(e.target.value, followUpUnit)}
                className={`${inputCls} w-24`}
              />
              <select
                value={followUpUnit}
                onChange={(e) => handleFollowUpChange(followUpNum, e.target.value)}
                className={inputCls}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
            {prescription.nextVisitDate && (
              <div className="mt-1 text-xs text-neutral-400">
                Calculated: {new Date(prescription.nextVisitDate).toLocaleDateString("en-GB")}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Reason</label>
            <input
              type="text"
              value={prescription.nextVisitReason}
              onChange={(e) => update("nextVisitReason", e.target.value)}
              placeholder="Follow-up reason"
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* Custom Sections */}
      {prescription.customSections.map((section) => (
        <div key={section.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={section.heading}
              onChange={(e) => updateCustomSection(section.id, { heading: e.target.value })}
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white outline-none focus:border-blue-500"
            />
            <button
              onClick={() => updateCustomSection(section.id, { visible: !section.visible })}
              className="text-neutral-500 hover:text-white"
              title={section.visible ? "Hide section" : "Show section"}
            >
              {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button onClick={() => removeCustomSection(section.id)} className="text-neutral-500 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={section.content}
            onChange={(e) => updateCustomSection(section.id, { content: e.target.value })}
            placeholder="Section content..."
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </div>
      ))}

      <button
        onClick={addCustomSection}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
      >
        <Plus className="h-4 w-4" />
        Add Custom Section
      </button>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </button>
        <button
          onClick={onComplete}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <CheckCircle className="h-4 w-4" />
          Complete Consultation
        </button>
      </div>
    </div>
  );
}

// Collapsible section wrapper
function Section({
  title,
  sectionKey,
  collapsed,
  onToggle,
  children,
  onAdd,
  count,
}: {
  title: string;
  sectionKey: string;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  onAdd?: () => void;
  count?: number;
}) {
  const isCollapsed = collapsed[sectionKey] ?? false;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(sectionKey)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(sectionKey);
          }
        }}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-800/50 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAdd && !isCollapsed && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              <Plus className="inline h-3 w-3" /> Add
            </button>
          )}
          {isCollapsed ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronUp className="h-4 w-4 text-neutral-500" />}
        </div>
      </div>
      {!isCollapsed && <div className="border-t border-neutral-800 px-4 py-3">{children}</div>}
    </div>
  );
}
