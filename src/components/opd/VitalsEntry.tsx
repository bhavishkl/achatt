"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OpdPatient, OpdVisit, Vitals } from "@/types/opd";
import { createEmptyVitals } from "@/types/opd";
import { useOpdApi } from "@/hooks/useOpdApi";

type Props = {
  patient: OpdPatient;
  visit: OpdVisit;
  onDone: () => void;
};

type VitalRange = { low: number; high: number; critical_low?: number; critical_high?: number };

const RANGES: Record<string, VitalRange> = {
  bloodPressureSystolic: { low: 90, high: 140, critical_low: 70, critical_high: 180 },
  bloodPressureDiastolic: { low: 60, high: 90, critical_low: 40, critical_high: 120 },
  pulse: { low: 60, high: 100, critical_low: 40, critical_high: 150 },
  temperatureF: { low: 97, high: 99.5, critical_low: 95, critical_high: 104 },
  temperatureC: { low: 36.1, high: 37.5, critical_low: 35, critical_high: 40 },
  spo2: { low: 95, high: 100, critical_low: 90, critical_high: 101 },
  respiratoryRate: { low: 12, high: 20, critical_low: 8, critical_high: 30 },
  bloodSugar: { low: 70, high: 140, critical_low: 50, critical_high: 300 },
};

function getVitalStatus(key: string, value: number | ""): "normal" | "warning" | "critical" | "none" {
  if (value === "" || value === 0) return "none";
  const range = RANGES[key];
  if (!range) return "none";
  const v = Number(value);
  if (range.critical_low !== undefined && v < range.critical_low) return "critical";
  if (range.critical_high !== undefined && v > range.critical_high) return "critical";
  if (v < range.low || v > range.high) return "warning";
  return "normal";
}

const statusColors: Record<string, string> = {
  normal: "border-emerald-500/50 bg-emerald-500/5",
  warning: "border-amber-500/50 bg-amber-500/5",
  critical: "border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20",
  none: "border-neutral-700 bg-neutral-800",
};

const statusDots: Record<string, string> = {
  normal: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400 animate-pulse",
  none: "bg-neutral-600",
};

export function VitalsEntry({ patient, visit, onDone }: Props) {
  const [vitals, setVitals] = useState<Vitals>(visit.vitals ?? createEmptyVitals());
  const updateOpdVisitVitals = useAppStore((s) => s.updateOpdVisitVitals);
  const { updateVisit: apiUpdateVisit } = useOpdApi();
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof Vitals>(key: K, value: Vitals[K]) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Optimistic local update
    updateOpdVisitVitals(visit.id, vitals);
    // Sync to API
    await apiUpdateVisit(visit.id, { vitals });
    setIsSaving(false);
    onDone();
  };

  const bpSysStatus = getVitalStatus("bloodPressureSystolic", vitals.bloodPressureSystolic);
  const bpDiaStatus = getVitalStatus("bloodPressureDiastolic", vitals.bloodPressureDiastolic);
  const bpStatus = bpSysStatus === "critical" || bpDiaStatus === "critical" ? "critical"
    : bpSysStatus === "warning" || bpDiaStatus === "warning" ? "warning"
    : bpSysStatus === "normal" && bpDiaStatus === "normal" ? "normal" : "none";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        {/* Patient Info */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            #{visit.tokenNo}
          </div>
          <div>
            <p className="font-medium text-white">{patient.name}</p>
            <p className="text-sm text-neutral-400">{patient.age}y / {patient.gender}</p>
          </div>
        </div>

        <h2 className="mb-1 text-lg font-semibold text-white">Record Vitals</h2>
        <p className="mb-6 text-sm text-neutral-400">
          Enter patient vitals — indicators show normal range status
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Blood Pressure */}
          <div className={`col-span-1 rounded-xl border p-4 sm:col-span-2 ${statusColors[bpStatus]}`}>
            <div className="mb-2 flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusDots[bpStatus]}`} />
              <label className="text-sm font-medium text-neutral-300">Blood Pressure</label>
              <span className="ml-auto text-xs text-neutral-500">90-140 / 60-90 mmHg</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={vitals.bloodPressureSystolic}
                onChange={(e) => updateField("bloodPressureSystolic", e.target.value ? Number(e.target.value) : "")}
                placeholder="Systolic"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-center text-white placeholder-neutral-500 outline-none focus:border-blue-500"
              />
              <span className="text-lg text-neutral-500">/</span>
              <input
                type="number"
                value={vitals.bloodPressureDiastolic}
                onChange={(e) => updateField("bloodPressureDiastolic", e.target.value ? Number(e.target.value) : "")}
                placeholder="Diastolic"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-center text-white placeholder-neutral-500 outline-none focus:border-blue-500"
              />
              <span className="text-sm text-neutral-500">mmHg</span>
            </div>
          </div>


          {/* SpO2 */}
          {renderVitalField("SpO2", "spo2", vitals.spo2, (v) => updateField("spo2", v), "%", "≥95%")}

          {/* Weight */}
          <div className={`rounded-xl border p-4 ${statusColors["none"]}`}>
            <div className="mb-2 flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusDots["none"]}`} />
              <label className="text-sm font-medium text-neutral-300">Weight</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={vitals.weight}
                onChange={(e) => updateField("weight", e.target.value ? Number(e.target.value) : "")}
                placeholder="Weight"
                step={0.1}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
              />
              <span className="text-sm text-neutral-500">kg</span>
            </div>
          </div>


        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Notes</label>
          <textarea
            value={vitals.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Additional observations..."
            rows={2}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Check className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Vitals & Complete"}
        </button>
      </div>
    </div>
  );
}

// Helper to render a standard vital field
function renderVitalField(
  label: string,
  rangeKey: string,
  value: number | "",
  onChange: (v: number | "") => void,
  unit: string,
  rangeHint: string,
) {
  const status = getVitalStatus(rangeKey, value);
  return (
    <div className={`rounded-xl border p-4 ${statusColors[status]}`}>
      <div className="mb-2 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${statusDots[status]}`} />
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        <span className="ml-auto text-xs text-neutral-500">{rangeHint}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={label}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
        />
        <span className="text-sm text-neutral-500">{unit}</span>
      </div>
    </div>
  );
}
