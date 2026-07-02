"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import type { OpdVisit, OpdPatient, Prescription } from "@/types/opd";

type Props = {
  visits: OpdVisit[];
  patients: OpdPatient[];
  onLoadPrescription: (prescription: Prescription) => void;
};

export function VisitHistory({ visits, patients, onLoadPrescription }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (visits.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
        <p className="text-sm text-neutral-500">No previous visits for this patient</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => {
        const isExpanded = expandedId === visit.id;
        const rx = visit.prescription;

        return (
          <div
            key={visit.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : visit.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-white">
                  #{visit.tokenNo}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {new Date(visit.visitDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {rx?.diagnosis || "No diagnosis recorded"}
                    {rx?.medicines && rx.medicines.length > 0
                      ? ` · ${rx.medicines.length} medicine${rx.medicines.length > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    visit.status === "completed"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {visit.status.replace("_", " ")}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-neutral-800 px-4 py-3">
                {/* Vitals */}
                {visit.vitals && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                      Vitals
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {visit.vitals.bloodPressureSystolic && visit.vitals.bloodPressureDiastolic && (
                        <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                          BP: {visit.vitals.bloodPressureSystolic}/{visit.vitals.bloodPressureDiastolic}
                        </span>
                      )}
                      {visit.vitals.pulse && (
                        <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                          Pulse: {visit.vitals.pulse}
                        </span>
                      )}
                      {visit.vitals.temperature && (
                        <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                          Temp: {visit.vitals.temperature}°{visit.vitals.temperatureUnit}
                        </span>
                      )}
                      {visit.vitals.spo2 && (
                        <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                          SpO2: {visit.vitals.spo2}%
                        </span>
                      )}
                      {visit.vitals.weight && (
                        <span className="rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                          Wt: {visit.vitals.weight}kg
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Prescription Details */}
                {rx ? (
                  <div className="space-y-3">
                    {rx.chiefComplaints && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Chief Complaints</p>
                        <p className="text-sm text-neutral-300">{rx.chiefComplaints}</p>
                      </div>
                    )}
                    {rx.diagnosis && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Diagnosis</p>
                        <p className="text-sm text-neutral-300">{rx.diagnosis}</p>
                      </div>
                    )}
                    {rx.medicines.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Medicines</p>
                        <div className="mt-1 space-y-1">
                          {rx.medicines.map((med, i) => (
                            <p key={med.id} className="text-sm text-neutral-300">
                              {i + 1}. <span className="font-medium text-white">{med.name}</span>{" "}
                              — {med.frequency.split(" (")[0]} — {[med.timing, med.routine, med.duration].filter(Boolean).join(" - ")}
                              {med.instructions ? ` (${med.instructions})` : ""}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {rx.nextVisitDate && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Next Visit</p>
                        <p className="text-sm text-neutral-300">
                          {new Date(rx.nextVisitDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {rx.nextVisitReason ? ` — ${rx.nextVisitReason}` : ""}
                        </p>
                      </div>
                    )}

                    {/* Copy button */}
                    <button
                      onClick={() => onLoadPrescription(rx)}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-neutral-700"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy to Current Visit
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No prescription recorded</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
