"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { OpdVisit, OpdPatient, Prescription } from "@/types/opd";
import { createEmptyPrescription } from "@/types/opd";
import { ConsultationPad } from "@/components/doctor/ConsultationPad";
import { PrescriptionPreview } from "@/components/doctor/PrescriptionPreview";
import { VisitHistory } from "@/components/doctor/VisitHistory";

const getToday = () => new Date().toISOString().split("T")[0];

const STATUS_ORDER: Record<string, number> = {
  in_consultation: 0,
  vitals_done: 1,
  waiting: 2,
  completed: 3,
};

export default function DoctorPage() {
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription>(createEmptyPrescription());
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "history">("edit");

  const opdVisits = useAppStore((s) => s.opdVisits);
  const opdPatients = useAppStore((s) => s.opdPatients);
  const updateOpdVisitStatus = useAppStore((s) => s.updateOpdVisitStatus);
  const updateOpdVisitPrescription = useAppStore((s) => s.updateOpdVisitPrescription);

  const today = getToday();

  const todayVisits = useMemo(
    () =>
      opdVisits
        .filter((v) => v.visitDate === today)
        .filter((v) => v.status !== "waiting") // Only show patients who have vitals done or beyond
        .sort((a, b) => {
          const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          if (statusDiff !== 0) return statusDiff;
          return a.tokenNo - b.tokenNo;
        }),
    [opdVisits, today],
  );

  const activeVisit = useMemo(
    () => opdVisits.find((v) => v.id === activeVisitId) ?? null,
    [opdVisits, activeVisitId],
  );

  const activePatient = useMemo(
    () => (activeVisit ? opdPatients.find((p) => p.id === activeVisit.patientId) ?? null : null),
    [activeVisit, opdPatients],
  );

  const patientVisitHistory = useMemo(() => {
    if (!activeVisit) return [];
    return opdVisits
      .filter((v) => v.patientId === activeVisit.patientId && v.id !== activeVisit.id)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }, [opdVisits, activeVisit]);

  const getPatient = (id: string) => opdPatients.find((p) => p.id === id);

  const handleSelectVisit = (visit: OpdVisit) => {
    setActiveVisitId(visit.id);
    setPrescription(visit.prescription ?? createEmptyPrescription());
    setViewMode("edit");
    if (visit.status === "vitals_done") {
      updateOpdVisitStatus(visit.id, "in_consultation");
    }
  };

  const handleSavePrescription = () => {
    if (!activeVisitId) return;
    updateOpdVisitPrescription(activeVisitId, prescription);
  };

  const handleCompleteVisit = () => {
    if (!activeVisitId) return;
    updateOpdVisitPrescription(activeVisitId, prescription);
    updateOpdVisitStatus(activeVisitId, "completed");
    setActiveVisitId(null);
    setPrescription(createEmptyPrescription());
    setViewMode("edit");
  };

  const handleLoadFromHistory = (pastPrescription: Prescription) => {
    setPrescription(JSON.parse(JSON.stringify(pastPrescription)));
    setViewMode("edit");
  };

  const queueCounts = useMemo(() => {
    const vd = todayVisits.filter((v) => v.status === "vitals_done").length;
    const ic = todayVisits.filter((v) => v.status === "in_consultation").length;
    const done = todayVisits.filter((v) => v.status === "completed").length;
    return { vitalsDone: vd, inConsultation: ic, completed: done, total: todayVisits.length };
  }, [todayVisits]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 print:p-0">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctor — Consultation</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {queueCounts.vitalsDone} waiting · {queueCounts.inConsultation} in consultation · {queueCounts.completed} completed
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row print:block print:gap-0">
        {/* Patient Queue Panel */}
        <div className="w-full shrink-0 lg:w-72 print:hidden">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Patient Queue</h3>
            <div className="space-y-1.5">
              {todayVisits.map((visit) => {
                const patient = getPatient(visit.patientId);
                if (!patient) return null;
                const isActive = visit.id === activeVisitId;

                const statusBadge =
                  visit.status === "in_consultation"
                    ? { text: "Consulting", cls: "text-purple-400 bg-purple-500/15" }
                    : visit.status === "vitals_done"
                      ? { text: "Ready", cls: "text-blue-400 bg-blue-500/15" }
                      : visit.status === "completed"
                        ? { text: "Done", cls: "text-emerald-400 bg-emerald-500/15" }
                        : { text: "Waiting", cls: "text-amber-400 bg-amber-500/15" };

                return (
                  <button
                    key={visit.id}
                    onClick={() => handleSelectVisit(visit)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-transparent bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-white">
                      {visit.tokenNo}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{patient.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500">
                          {patient.age}y/{patient.gender[0]}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${statusBadge.cls}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {todayVisits.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-500">No patients ready</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Patients appear here after frontdesk records their vitals
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="min-w-0 flex-1">
          {!activeVisit || !activePatient ? (
            <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
              <div className="text-center">
                <p className="text-4xl mb-3">👨‍⚕️</p>
                <p className="text-sm font-medium text-neutral-400">Select a patient to begin consultation</p>
                <p className="mt-1 text-xs text-neutral-600">Choose from the queue on the left</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Patient Header */}
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    #{activeVisit.tokenNo}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{activePatient.name}</p>
                    <p className="text-sm text-neutral-400">
                      {activePatient.age}y / {activePatient.gender} · {activePatient.phone}
                      {patientVisitHistory.length > 0 && (
                        <span className="ml-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                          {patientVisitHistory.length} past visit{patientVisitHistory.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Vitals Summary */}
                {activeVisit.vitals && (
                  <div className="flex flex-wrap gap-2">
                    {activeVisit.vitals.bloodPressureSystolic && activeVisit.vitals.bloodPressureDiastolic && (
                      <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                        BP: {activeVisit.vitals.bloodPressureSystolic}/{activeVisit.vitals.bloodPressureDiastolic}
                      </span>
                    )}
                    {activeVisit.vitals.pulse && (
                      <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                        Pulse: {activeVisit.vitals.pulse}
                      </span>
                    )}
                    {activeVisit.vitals.spo2 && (
                      <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                        SpO2: {activeVisit.vitals.spo2}%
                      </span>
                    )}
                    {activeVisit.vitals.temperature && (
                      <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                        Temp: {activeVisit.vitals.temperature}°{activeVisit.vitals.temperatureUnit}
                      </span>
                    )}
                    {activeVisit.vitals.weight && (
                      <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                        Wt: {activeVisit.vitals.weight}kg
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* View Mode Tabs */}
              <div className="mb-4 flex gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-1 print:hidden">
                {[
                  { key: "edit" as const, label: "Consultation", icon: "📝" },
                  { key: "preview" as const, label: "Preview", icon: "👁" },
                  { key: "history" as const, label: `History (${patientVisitHistory.length})`, icon: "📂" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setViewMode(tab.key)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                      viewMode === tab.key
                        ? "bg-blue-600 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              {viewMode === "edit" && (
                <ConsultationPad
                  prescription={prescription}
                  onChange={setPrescription}
                  onSave={handleSavePrescription}
                  onComplete={handleCompleteVisit}
                />
              )}
              {viewMode === "preview" && (
                <PrescriptionPreview
                  patient={activePatient}
                  visit={activeVisit}
                  prescription={prescription}
                />
              )}
              {viewMode === "history" && (
                <VisitHistory
                  visits={patientVisitHistory}
                  patients={opdPatients}
                  onLoadPrescription={handleLoadFromHistory}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
