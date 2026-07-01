"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Clock, Phone, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OpdPatient } from "@/types/opd";

type Props = {
  onSelectPatient: (patient: OpdPatient) => void;
  onRegisterNew: (searchText: string) => void;
};

export function PatientSearch({ onSelectPatient, onRegisterNew }: Props) {
  const [query, setQuery] = useState("");
  const opdPatients = useAppStore((s) => s.opdPatients);
  const opdVisits = useAppStore((s) => s.opdVisits);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return opdPatients.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(normalizedQuery);
      const phoneDigits = normalizedQuery.replace(/\D/g, "");
      const phoneMatch = phoneDigits.length >= 3 && p.phone.includes(phoneDigits);
      return nameMatch || phoneMatch;
    });
  }, [opdPatients, normalizedQuery]);

  const recentPatients = useMemo(() => {
    // Get last 5 patients who had recent visits
    const patientLastVisit = new Map<string, string>();
    opdVisits
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((v) => {
        if (!patientLastVisit.has(v.patientId)) {
          patientLastVisit.set(v.patientId, v.visitDate);
        }
      });

    return Array.from(patientLastVisit.entries())
      .slice(0, 5)
      .map(([patientId, lastVisit]) => ({
        patient: opdPatients.find((p) => p.id === patientId),
        lastVisit,
      }))
      .filter((e) => e.patient != null) as { patient: OpdPatient; lastVisit: string }[];
  }, [opdPatients, opdVisits]);

  const getVisitCount = (patientId: string) =>
    opdVisits.filter((v) => v.patientId === patientId).length;

  const getLastVisitDate = (patientId: string) => {
    const visits = opdVisits
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
    return visits[0]?.visitDate || null;
  };

  const showResults = normalizedQuery.length > 0;
  const noResults = showResults && results.length === 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Search Patient</h2>
        <p className="mb-6 text-sm text-neutral-400">
          Search by patient name or phone number
        </p>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter patient name or phone number..."
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="space-y-3">
            {results.map((patient) => {
              const visitCount = getVisitCount(patient.id);
              const lastVisit = getLastVisitDate(patient.id);

              return (
                <div
                  key={patient.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-800/50 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{patient.name}</p>
                      {visitCount > 0 && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                          Returning · {visitCount} visit{visitCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                      <span>
                        {patient.age}y / {patient.gender}
                      </span>
                      {lastVisit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {lastVisit}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Create Visit
                  </button>
                </div>
              );
            })}

            {/* No Results — Register CTA */}
            {noResults && (
              <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-800/30 p-6 text-center">
                <UserPlus className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
                <p className="mb-1 text-sm font-medium text-neutral-300">
                  No patient found for &quot;{query.trim()}&quot;
                </p>
                <p className="mb-4 text-xs text-neutral-500">
                  Register as a new patient to continue
                </p>
                <button
                  onClick={() => onRegisterNew(query)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Register New Patient
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Patients (when no search query) */}
        {!showResults && recentPatients.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Recent Patients
            </p>
            <div className="space-y-2">
              {recentPatients.map(({ patient, lastVisit }) => (
                <button
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-800/30 p-3 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-sm font-bold text-white">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{patient.name}</p>
                    <p className="text-xs text-neutral-500">
                      {patient.phone} · Last visit: {lastVisit}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!showResults && recentPatients.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-800/30 p-8 text-center">
            <User className="mx-auto mb-3 h-12 w-12 text-neutral-600" />
            <p className="mb-1 text-sm font-medium text-neutral-300">No patients yet</p>
            <p className="mb-4 text-xs text-neutral-500">
              Search for a patient or register a new one to get started
            </p>
            <button
              onClick={() => onRegisterNew("")}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Register First Patient
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
