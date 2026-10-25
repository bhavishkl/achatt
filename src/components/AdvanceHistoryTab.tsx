"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PrinterIcon, RefreshCw, Trash2 } from "lucide-react";
import type { Company } from "@/lib/types";
import type { AdvanceEntry, Patient } from "@/types/patient";
import { useAppStore } from "@/lib/store";
import {
  advanceReceiptNo,
  advanceModeLabel,
  buildAdvanceReceiptHtml,
} from "@/components/advances/receipt";
import { openBillPrintWindow } from "@/components/add-bill-modal/print";

const MODE_BADGES: Record<string, string> = {
  cash: "border-emerald-800/50 bg-emerald-950/60 text-emerald-300",
  online: "border-blue-800/50 bg-blue-950/60 text-blue-300",
  adjustment: "border-amber-800/50 bg-amber-950/60 text-amber-300",
  "": "border-neutral-800 bg-neutral-950/60 text-neutral-400",
};

interface AdvanceHistoryTabProps {
  patients: Patient[];
  /** Bumped by the parent after every new advance so the list refreshes. */
  reloadKey?: number;
  onAddAdvance: () => void;
  /** Called after a receipt is voided so the parent can refresh balances. */
  onChanged?: () => void;
}

export default function AdvanceHistoryTab({ reloadKey = 0, onAddAdvance, onChanged }: AdvanceHistoryTabProps) {
  const { companyId } = useAppStore();
  const [entries, setEntries] = useState<AdvanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyProfile, setCompanyProfile] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "cash" | "online" | "adjustment">("all");

  useEffect(() => {
    if (!companyId) {
      setEntries([]);
      return;
    }
    let isMounted = true;
    setIsLoading(true);
    setError("");
    fetch(`/api/patients/advances?companyId=${companyId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load advance history");
        if (isMounted) setEntries(data.advances as AdvanceEntry[]);
      })
      .catch((err: any) => {
        if (isMounted) setError(err.message || "Failed to load advance history");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [companyId, reloadKey, refreshTick]);

  // Letterhead for reprints.
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/ipd/hospital-info?companyId=${companyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((infoData) => {
        if (infoData) {
          setCompanyProfile({
            name: infoData.name || "",
            address: [infoData.address, infoData.city, infoData.state, infoData.pincode]
              .filter(Boolean)
              .join(", "),
            emailId: infoData.email || "",
            mobileNumber1: infoData.phone || "",
            mobileNumber2: infoData.altPhone || "",
          } as Company);
        }
      })
      .catch(() => {});
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const entryDate = (entry.createdAt || "").slice(0, 10);
      if (dateFrom && entryDate < dateFrom) return false;
      if (dateTo && entryDate > dateTo) return false;
      if (modeFilter !== "all" && entry.mode !== modeFilter) return false;
      if (!q) return true;

      const patient = entry.patient;
      const haystack = [
        advanceReceiptNo(entry),
        entry.note,
        entry.mode,
        patient?.prefix,
        patient?.name,
        patient?.regNo,
        patient?.ipNumber,
        patient?.wardName,
        patient?.bedNo,
        patient?.attenderMobile,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, search, dateFrom, dateTo, modeFilter]);

  const totals = useMemo(() => {
    // Voided receipts stay visible in the log but no longer count anywhere.
    const received = filtered
      .filter((e) => e.entryType === "credit" && !e.voided)
      .reduce((s, e) => s + e.amount, 0);
    const adjusted = filtered.filter((e) => e.entryType === "debit").reduce((s, e) => s + e.amount, 0);
    return { received, adjusted, net: received - adjusted };
  }, [filtered]);

  const handleDelete = async (entry: AdvanceEntry) => {
    if (deletingId) return;
    if (
      !window.confirm(
        `Delete this advance receipt?` +
          `\n\n${entry.patient ? `${entry.patient.prefix} ${entry.patient.name}` : "Patient"} — ₹${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` +
          `\n\nIt will be removed from the patient's advance balance but kept here in the history log.`
      )
    ) {
      return;
    }
    setDeletingId(entry.id);
    try {
      const res = await fetch(`/api/patients/advances/${entry.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete advance");
      setRefreshTick((t) => t + 1);
      onChanged?.();
    } catch (err: any) {
      setError(err.message || "Failed to delete advance");
    } finally {
      setDeletingId(null);
    }
  };

  const printReceipt = (entry: AdvanceEntry) => {
    if (!entry.patient) return;
    const patient: Patient = {
      id: entry.patientId,
      regNo: entry.patient.regNo,
      ipNumber: entry.patient.ipNumber,
      prefix: entry.patient.prefix,
      name: entry.patient.name,
      gender: entry.patient.gender,
      age: entry.patient.age,
      pincode: "",
      admissionDate: "",
      admissionTime: "",
      hospitalName: "",
      doctorName: "",
      wardName: entry.patient.wardName,
      bedNo: entry.patient.bedNo,
      attenderName: "",
      attenderAddress: "",
      attenderMobile: entry.patient.attenderMobile,
      attenderRelation: "",
      diagnosis: "",
      status: entry.patient.status === "discharged" ? "discharged" : "admitted",
      advanceBalance: 0,
      bills: [],
    };
    openBillPrintWindow(
      buildAdvanceReceiptHtml({
        patient,
        amount: entry.amount,
        mode: entry.mode,
        note: entry.note,
        receiptNo: advanceReceiptNo(entry),
        createdAt: entry.createdAt,
        advanceBalance: null,
        companyProfile,
      })
    );
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "-";
    return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Advance History</h2>
          <p className="text-sm text-neutral-400">
            Search receipts and adjustments across all admissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
              setModeFilter("all");
            }}
            className="h-9 w-9 inline-flex items-center justify-center rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Clear filters"
            aria-label="Clear filters"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onAddAdvance}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <span>+</span> Add Advance
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total Received (filtered)</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">₹{totals.received.toLocaleString()}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Adjusted Against Bills</p>
          <p className="mt-1 text-xl font-semibold text-amber-400">₹{totals.adjusted.toLocaleString()}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Net Advance Balance</p>
          <p className="mt-1 text-xl font-semibold text-blue-400">₹{totals.net.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, Reg No, IP No, mobile, receipt no…"
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 sm:col-span-2"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 shrink-0">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 shrink-0">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 sm:col-span-2"
        >
          <option value="all">All payments (Cash + Online + Adjustments)</option>
          <option value="cash">Cash only</option>
          <option value="online">Online only</option>
          <option value="adjustment">Bill adjustments only</option>
        </select>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Receipt No</th>
                <th className="p-4">Type</th>
                <th className="p-4">Mode</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Note</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {error ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : isLoading && entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    <Loader2 className="h-4 w-4 inline animate-spin mr-2" />
                    Loading advance history…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    {entries.length === 0 ? "No advances recorded yet." : "No entries match the current filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isCredit = entry.entryType === "credit";
                  const isVoided = !!entry.voided;
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-neutral-800/50 transition-colors ${isVoided ? "opacity-50" : ""}`}
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-neutral-300">{formatDateTime(entry.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        {entry.patient ? (
                          <>
                            <div className="font-medium text-white">
                              {entry.patient.prefix} {entry.patient.name}
                            </div>
                            <div className="text-neutral-500 text-xs">
                              Reg {entry.patient.regNo}
                              {entry.patient.ipNumber ? ` · IP ${entry.patient.ipNumber}` : ""} ·{" "}
                              {entry.patient.status === "admitted" ? "Admitted" : "Discharged"}
                            </div>
                            <div className="text-neutral-500 text-xs font-mono">
                              {entry.patient.wardName} · Bed {entry.patient.bedNo} · 📞 {entry.patient.attenderMobile || "-"}
                            </div>
                          </>
                        ) : (
                          <span className="text-neutral-500">Patient record deleted</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isCredit ? (
                          <span className={`font-mono text-xs border border-neutral-800 bg-neutral-950/60 text-neutral-300 rounded px-2 py-1 ${isVoided ? "line-through" : ""}`}>
                            {advanceReceiptNo(entry)}
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            isVoided
                              ? "border-red-800/50 bg-red-950/60 text-red-300"
                              : isCredit
                                ? "border-emerald-800/50 bg-emerald-950/60 text-emerald-300"
                                : "border-amber-800/50 bg-amber-950/60 text-amber-300"
                          }`}
                        >
                          {isVoided ? "Deleted" : isCredit ? "Received" : "Bill Adjustment"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${MODE_BADGES[entry.mode] ?? MODE_BADGES[""]}`}
                        >
                          {advanceModeLabel(entry.mode)}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-right font-medium whitespace-nowrap ${
                          isVoided ? "text-neutral-500 line-through" : isCredit ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {isCredit ? "+" : "−"} ₹{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-neutral-400 max-w-[220px] truncate" title={entry.note}>
                        {entry.note || "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {isCredit && !isVoided && entry.patient && (
                            <button
                              onClick={() => printReceipt(entry)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-blue-400 transition-colors"
                              title="Print receipt"
                              aria-label="Print receipt"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>
                          )}
                          {isCredit && !isVoided && (
                            <button
                              onClick={() => void handleDelete(entry)}
                              disabled={deletingId === entry.id}
                              className="h-8 w-8 inline-flex items-center justify-center rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Delete receipt (kept in history)"
                              aria-label="Delete receipt"
                            >
                              {deletingId === entry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {isVoided && (
                            <span className="text-neutral-600 text-xs self-center">Kept in log</span>
                          )}
                          {!isCredit && !isVoided && (
                            <span className="text-neutral-600 text-xs self-center">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
