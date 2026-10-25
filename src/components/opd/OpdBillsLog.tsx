"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OpdBill, OpdPatient, OpdVisit } from "@/types/opd";
import {
  buildOpdBillPrintHtml,
  openPrintWindow,
} from "@/components/opd/opdPrint";
import { useOpdApi } from "@/hooks/useOpdApi";

type Props = {
  onOpenPatient?: (visit: OpdVisit) => void;
};

type Row = {
  visit: OpdVisit;
  bill: OpdBill;
  patient: OpdPatient | undefined;
};

type DateFilter = "today" | "30days" | "all";

export function OpdBillsLog({ onOpenPatient }: Props) {
  const companyId = useAppStore((s) => s.companyId);
  const { loadPatients, loadAllVisits, updateVisit } = useOpdApi();

  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("30days");
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [patients, visits] = await Promise.all([
        loadPatients(),
        loadAllVisits(),
      ]);
      const patientMap = new Map(patients.map((p) => [p.id, p]));
      setRows(
        visits
          .filter((v): v is OpdVisit & { bill: OpdBill } => v.bill != null)
          .map((visit) => ({
            visit,
            bill: visit.bill,
            patient: patientMap.get(visit.patientId),
          }))
      );
    } catch (error) {
      console.error("Failed to load OPD bills log:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, loadPatients, loadAllVisits]);

  useEffect(() => {
    load();
  }, [load]);

  // Hospital profile for reprint letterhead
  useEffect(() => {
    if (!companyId) return;
    let mounted = true;
    fetch(`/api/ipd/hospital-info?companyId=${companyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (mounted) setHospitalInfo(info);
      })
      .catch((error) =>
        console.error("Failed to load hospital information:", error)
      );
    return () => {
      mounted = false;
    };
  }, [companyId]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const cutoff =
      dateFilter === "today"
        ? today
        : dateFilter === "30days"
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : null;

    const q = query.trim().toLowerCase();
    return rows
      .filter(({ bill, visit, patient }) => {
        if (cutoff && visit.visitDate < cutoff) return false;
        if (!q) return true;
        return (
          (patient?.name ?? "").toLowerCase().includes(q) ||
          (patient?.phone ?? "").includes(q) ||
          bill.billNo.toLowerCase().includes(q) ||
          bill.items.some((item) =>
            item.description.toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => (b.bill.createdAt > a.bill.createdAt ? 1 : -1));
  }, [rows, query, dateFilter]);

  // Totals exclude voided bills — they stay in the log but no longer count.
  const active = useMemo(() => filtered.filter((r) => !r.bill.voided), [filtered]);

  const totals = useMemo(() => {
    const gross = active.reduce((sum, r) => sum + r.bill.grossAmount, 0);
    const concession = active.reduce((sum, r) => sum + r.bill.concession, 0);
    const collected = active.reduce((sum, r) => sum + r.bill.totalAmount, 0);
    return { count: active.length, gross, concession, collected };
  }, [active]);

  const handleVoid = async (row: Row) => {
    if (
      !confirm(
        "Delete this bill? It will be removed from totals and collections but kept in the log."
      )
    ) {
      return;
    }
    const updatedBill: OpdBill = {
      ...row.bill,
      voided: true,
      voidedAt: new Date().toISOString(),
    };
    // Local update first, then persist to the visit's bill JSON column.
    setRows((prev) =>
      prev.map((r) => (r.visit.id === row.visit.id ? { ...r, bill: updatedBill } : r))
    );
    const saved = await updateVisit(row.visit.id, { bill: updatedBill });
    if (!saved) {
      console.error("Failed to void OPD bill; reloading log.");
      load();
    }
  };

  const reprint = (row: Row) => {
    if (!row.patient) {
      alert("Patient record for this bill is no longer available.");
      return;
    }
    const html = buildOpdBillPrintHtml({
      patient: row.patient,
      bill: row.bill,
      visit: row.visit,
      hospitalInfo,
    });
    openPrintWindow(html);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto rounded-t-2xl border border-neutral-800 border-b-0 bg-neutral-900/50 p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-white">
              OPD Bills Log
            </h2>
            <p className="text-sm text-neutral-400">
              Browse, search and reprint past OPD bills
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by patient, phone, bill no or service…"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-neutral-700 bg-neutral-800 p-1">
            {(
              [
                { key: "today", label: "Today" },
                { key: "30days", label: "Last 30 days" },
                { key: "all", label: "All" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDateFilter(opt.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateFilter === opt.key
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-800/40 px-4 py-3">
            <p className="text-xs text-neutral-500">Bills</p>
            <p className="text-lg font-semibold text-white">{totals.count}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-800/40 px-4 py-3">
            <p className="text-xs text-neutral-500">Gross</p>
            <p className="text-lg font-semibold text-white">
              ₹{totals.gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-800/40 px-4 py-3">
            <p className="text-xs text-neutral-500">Concession</p>
            <p className="text-lg font-semibold text-amber-400">
              ₹{totals.concession.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-800/40 px-4 py-3">
            <p className="text-xs text-neutral-500">Collected</p>
            <p className="text-lg font-semibold text-emerald-400">
              ₹{totals.collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Bills table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 py-16 text-center">
            <p className="text-sm text-neutral-500">
              {query
                ? "No bills match your search."
                : "No OPD bills yet for this period."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-800/80">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Bill No</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Patient</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Services</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Mode</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Net</th>
                  <th className="w-12 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ visit, bill, patient }) => (
                  <tr
                    key={visit.id}
                    className={`border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/40 ${
                      bill.voided ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-blue-400">
                      {bill.billNo}
                      {bill.voided && (
                        <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-400">
                      {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-white">{patient?.name ?? "Unknown"}</span>
                      <span className="ml-2 text-xs text-neutral-500">
                        {patient?.phone ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-300">
                      {bill.items.map((item) => item.description).join(", ")}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="rounded-full bg-neutral-700/60 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-300">
                        {bill.paymentMode}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium text-white ${
                        bill.voided ? "line-through" : ""
                      }`}
                    >
                      ₹{bill.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {bill.voided ? (
                        <span className="text-[10px] text-neutral-500">Kept in log</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => reprint({ visit, bill, patient })}
                            className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/10 text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                            title="Reprint bill"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleVoid({ visit, bill, patient })}
                            className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                            title="Delete bill (kept in log)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
