"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { OpdPatient, OpdVisit } from "@/types/opd";
import { PatientSearch } from "@/components/opd/PatientSearch";
import { PatientRegistration } from "@/components/opd/PatientRegistration";
import { OpdBilling } from "@/components/opd/OpdBilling";
import { VitalsEntry } from "@/components/opd/VitalsEntry";
import { OpdQueue } from "@/components/opd/OpdQueue";

type Step = "search" | "register" | "billing" | "vitals";

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "search", label: "Search Patient", icon: "🔍" },
  { key: "register", label: "Register", icon: "📋" },
  { key: "billing", label: "Payment & Bill", icon: "💳" },
  { key: "vitals", label: "Vitals", icon: "💓" },
];

const getToday = () => new Date().toISOString().split("T")[0];

export default function OpdPage() {
  const [activeStep, setActiveStep] = useState<Step>("search");
  const [selectedPatient, setSelectedPatient] = useState<OpdPatient | null>(null);
  const [activeVisit, setActiveVisit] = useState<OpdVisit | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [carryForwardSearch, setCarryForwardSearch] = useState({ name: "", phone: "" });
  const [editingPatient, setEditingPatient] = useState<OpdPatient | null>(null);

  const opdVisits = useAppStore((s) => s.opdVisits);
  const opdPatients = useAppStore((s) => s.opdPatients);
  const createOpdVisit = useAppStore((s) => s.createOpdVisit);

  const today = getToday();

  const todayVisits = useMemo(
    () => opdVisits.filter((v) => v.visitDate === today),
    [opdVisits, today],
  );

  const queueStats = useMemo(() => {
    const waiting = todayVisits.filter((v) => v.status === "waiting").length;
    const vitalsDone = todayVisits.filter((v) => v.status === "vitals_done").length;
    const inConsult = todayVisits.filter((v) => v.status === "in_consultation").length;
    const completed = todayVisits.filter((v) => v.status === "completed").length;
    return { total: todayVisits.length, waiting, vitalsDone, inConsult, completed };
  }, [todayVisits]);

  const handleSelectExisting = (patient: OpdPatient) => {
    setEditingPatient(patient);
    setActiveStep("register");
  };

  const handleRegisterNew = (searchText: string) => {
    const isPhone = /^[\d+\-\s()]+$/.test(searchText.trim()) && searchText.replace(/\D/g, "").length >= 5;
    setCarryForwardSearch({
      name: isPhone ? "" : searchText.trim(),
      phone: isPhone ? searchText.trim() : "",
    });
    setEditingPatient(null);
    setActiveStep("register");
  };

  const handlePatientRegistered = (patient: OpdPatient) => {
    setSelectedPatient(patient);
    setActiveStep("billing");
  };

  const handleBillingDone = (visit: OpdVisit) => {
    setActiveVisit(visit);
    setActiveStep("vitals");
  };

  const handleVitalsDone = () => {
    setActiveStep("search");
    setSelectedPatient(null);
    setActiveVisit(null);
    setEditingPatient(null);
    setCarryForwardSearch({ name: "", phone: "" });
  };

  const handleQueuePatientClick = (visit: OpdVisit) => {
    const patient = opdPatients.find((p) => p.id === visit.patientId);
    if (!patient) return;
    setSelectedPatient(patient);
    setActiveVisit(visit);

    if (visit.status === "waiting" && !visit.bill) {
      setActiveStep("billing");
    } else if (visit.status === "waiting" || (visit.bill && !visit.vitals)) {
      setActiveStep("vitals");
    } else {
      setActiveStep("vitals");
    }
    setShowQueue(false);
  };

  const handleRestart = () => {
    setActiveStep("search");
    setSelectedPatient(null);
    setActiveVisit(null);
    setEditingPatient(null);
    setCarryForwardSearch({ name: "", phone: "" });
  };

  const activeStepIndex = STEPS.findIndex((s) => s.key === activeStep);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Frontdesk — OPD</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Patient registration, billing, and vitals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Queue Stats Pills */}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400">
              {queueStats.waiting} Waiting
            </span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400">
              {queueStats.vitalsDone} Vitals Done
            </span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              {queueStats.completed} Done
            </span>
          </div>

          <button
            onClick={() => setShowQueue(!showQueue)}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            {showQueue ? "Hide Queue" : `Queue (${queueStats.total})`}
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max items-center gap-1 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-1.5">
          {STEPS.map((step, i) => {
            const isActive = step.key === activeStep;
            const isPast = i < activeStepIndex;
            const isDisabled = i > activeStepIndex;

            return (
              <button
                key={step.key}
                onClick={() => {
                  if (isPast) {
                    // Allow going back only with valid state
                    if (step.key === "search") handleRestart();
                    if (step.key === "register" && selectedPatient) {
                      setEditingPatient(selectedPatient);
                      setActiveStep("register");
                    }
                  }
                }}
                disabled={isDisabled}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : isPast
                      ? "bg-neutral-800 text-emerald-400 hover:bg-neutral-700"
                      : "text-neutral-500 cursor-not-allowed"
                }`}
              >
                <span>{isPast ? "✓" : step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main Content */}
        <div className={`min-w-0 flex-1 ${showQueue ? "lg:max-w-[calc(100%-22rem)]" : ""}`}>
          {activeStep === "search" && (
            <PatientSearch
              onSelectPatient={handleSelectExisting}
              onRegisterNew={handleRegisterNew}
            />
          )}

          {activeStep === "register" && (
            <PatientRegistration
              existingPatient={editingPatient}
              initialName={carryForwardSearch.name}
              initialPhone={carryForwardSearch.phone}
              onRegistered={(patient) => {
                setEditingPatient(null);
                handlePatientRegistered(patient);
              }}
              onBack={() => {
                setEditingPatient(null);
                setActiveStep("search");
              }}
            />
          )}

          {activeStep === "billing" && selectedPatient && (
            <OpdBilling
              patient={selectedPatient}
              visit={activeVisit}
              onDone={handleBillingDone}
              onSkip={handleBillingDone}
            />
          )}

          {activeStep === "vitals" && selectedPatient && activeVisit && (
            <VitalsEntry
              patient={selectedPatient}
              visit={activeVisit}
              onDone={handleVitalsDone}
            />
          )}
        </div>

        {/* Queue Sidebar */}
        {showQueue && (
          <div className="w-full shrink-0 lg:w-80">
            <OpdQueue
              visits={todayVisits}
              onPatientClick={handleQueuePatientClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
