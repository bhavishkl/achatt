"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { PrescriptionFormatConfig } from "@/types/opd";
import { DEFAULT_FORMAT_CONFIG, DEFAULT_SECTION_HEADINGS, getMergedFormatConfig } from "@/types/opd";
import { X, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

type Props = {
  onClose: () => void;
};

export function PrescriptionFormatSettings({ onClose }: Props) {
  const config = getMergedFormatConfig(useAppStore((s) => s.prescriptionFormatConfig));
  const setConfig = useAppStore((s) => s.setPrescriptionFormatConfig);

  const [local, setLocal] = useState<PrescriptionFormatConfig>(
    JSON.parse(JSON.stringify(config)),
  );

  const moveSection = (index: number, direction: -1 | 1) => {
    const newOrder = [...local.sectionOrder];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setLocal({ ...local, sectionOrder: newOrder });
  };

  const toggleHidden = (key: string) => {
    const hidden = new Set(local.hiddenSections);
    if (hidden.has(key)) {
      hidden.delete(key);
    } else {
      hidden.add(key);
    }
    setLocal({ ...local, hiddenSections: Array.from(hidden) });
  };

  const renameHeading = (key: string, newName: string) => {
    setLocal({
      ...local,
      renamedHeadings: { ...(local.renamedHeadings || {}), [key]: newName },
    });
  };

  const updateClinicHeader = (field: keyof PrescriptionFormatConfig["clinicHeader"], value: string) => {
    setLocal({
      ...local,
      clinicHeader: { ...(local.clinicHeader || {}), [field]: value } as any,
    });
  };

  const handleSave = () => {
    setConfig(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(JSON.parse(JSON.stringify(DEFAULT_FORMAT_CONFIG)));
  };

  const inputCls = "w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Prescription Format Settings</h4>
        <button onClick={onClose} className="text-neutral-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Clinic Header */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Clinic Header</p>
        <div className="space-y-2">
          <input
            type="text"
            value={local.clinicHeader.name}
            onChange={(e) => updateClinicHeader("name", e.target.value)}
            placeholder="Clinic / Hospital Name"
            className={inputCls}
          />
          <input
            type="text"
            value={local.clinicHeader.address}
            onChange={(e) => updateClinicHeader("address", e.target.value)}
            placeholder="Address"
            className={inputCls}
          />
          <input
            type="text"
            value={local.clinicHeader.phone}
            onChange={(e) => updateClinicHeader("phone", e.target.value)}
            placeholder="Phone Number"
            className={inputCls}
          />
        </div>
      </div>

      {/* Section Order & Visibility */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Section Order & Visibility
        </p>
        <div className="space-y-1.5">
          {local.sectionOrder.map((key, i) => {
            const isHidden = local.hiddenSections.includes(key);
            const displayName = local.renamedHeadings[key] || DEFAULT_SECTION_HEADINGS[key] || key;

            return (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  isHidden ? "border-neutral-800 bg-neutral-900 opacity-50" : "border-neutral-700 bg-neutral-800"
                }`}
              >
                <div className="flex gap-1">
                  <button
                    onClick={() => moveSection(i, -1)}
                    disabled={i === 0}
                    className="text-neutral-500 hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(i, 1)}
                    disabled={i === local.sectionOrder.length - 1}
                    className="text-neutral-500 hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => renameHeading(key, e.target.value)}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-0.5 text-sm text-white outline-none focus:border-neutral-600 focus:bg-neutral-700"
                />
                <button
                  onClick={() => toggleHidden(key)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    isHidden
                      ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                      : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  }`}
                >
                  {isHidden ? "Hidden" : "Visible"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Save as Default
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
