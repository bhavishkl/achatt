"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { OpdVisit } from "@/types/opd";

type Props = {
  visits: OpdVisit[];
  onPatientClick: (visit: OpdVisit) => void;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  waiting: { label: "Waiting", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  vitals_done: { label: "Vitals Done", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  in_consultation: { label: "In Consultation", color: "text-purple-400", bgColor: "bg-purple-500/15" },
  completed: { label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
};

export function OpdQueue({ visits, onPatientClick }: Props) {
  const opdPatients = useAppStore((s) => s.opdPatients);

  const grouped = useMemo(() => {
    const groups: Record<string, OpdVisit[]> = {
      waiting: [],
      vitals_done: [],
      in_consultation: [],
      completed: [],
    };
    visits.forEach((v) => {
      groups[v.status]?.push(v);
    });
    return groups;
  }, [visits]);

  const totalRevenue = useMemo(
    () => visits.reduce((sum, v) => sum + (v.bill?.totalAmount ?? 0), 0),
    [visits],
  );

  const getPatientName = (patientId: string) =>
    opdPatients.find((p) => p.id === patientId)?.name ?? "Unknown";

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h3 className="mb-1 text-sm font-semibold text-white">Today&apos;s Queue</h3>
      <p className="mb-4 text-xs text-neutral-500">
        {visits.length} patients · ₹{totalRevenue.toLocaleString("en-IN")} revenue
      </p>

      <div className="space-y-4">
        {(["waiting", "vitals_done", "in_consultation", "completed"] as const).map((status) => {
          const group = grouped[status] || [];
          if (group.length === 0) return null;
          const config = STATUS_CONFIG[status];

          return (
            <div key={status}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-xs text-neutral-500">{group.length}</span>
              </div>
              <div className="space-y-1">
                {group
                  .sort((a, b) => a.tokenNo - b.tokenNo)
                  .map((visit) => (
                    <button
                      key={visit.id}
                      onClick={() => onPatientClick(visit)}
                      className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-neutral-800/50 px-3 py-2 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-800"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold text-white">
                        {visit.tokenNo}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">
                          {getPatientName(visit.patientId)}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {new Date(visit.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {visit.bill ? ` · ₹${visit.bill.totalAmount}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}

        {visits.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-neutral-500">No patients today</p>
          </div>
        )}
      </div>
    </div>
  );
}
