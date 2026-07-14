"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Plus, Trash2, Printer, SkipForward } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OpdPatient, OpdVisit, OpdBill, OpdBillItem } from "@/types/opd";
import { OPD_QUICK_SERVICES } from "@/data/opdSeedData";
import { BILLABLE_ITEMS } from "@/lib/constants";
import { buildOpdBillPrintHtml, openPrintWindow } from "@/components/opd/opdPrint";
import { useOpdApi } from "@/hooks/useOpdApi";

type Props = {
  patient: OpdPatient;
  visit: OpdVisit | null;
  onDone: (visit: OpdVisit) => void;
  onSkip: (visit: OpdVisit) => void;
};

let _itemCounter = 0;
const uid = () => `bi-${Date.now()}-${++_itemCounter}`;

export function OpdBilling({ patient, visit, onDone, onSkip }: Props) {
  const [items, setItems] = useState<OpdBillItem[]>([]);
  const [inputDesc, setInputDesc] = useState("");
  const [inputRate, setInputRate] = useState<number | "">("");
  const [inputQty, setInputQty] = useState<number | "">(1);
  const [concession, setConcession] = useState<number | "">(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "other">("cash");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);

  const createOpdVisit = useAppStore((s) => s.createOpdVisit);
  const updateOpdVisitBill = useAppStore((s) => s.updateOpdVisitBill);
  const upsertOpdVisit = useAppStore((s) => s.upsertOpdVisit);
  const getNextBillNo = useAppStore((s) => s.getNextBillNo);
  const { createVisit: apiCreateVisit, updateVisit: apiUpdateVisit } = useOpdApi();

  const getOrCreateVisit = async (): Promise<OpdVisit> => {
    if (visit) return visit;
    // Try API first
    const apiVisit = await apiCreateVisit(patient.id);
    if (apiVisit) {
      upsertOpdVisit(apiVisit);
      return apiVisit;
    }
    // Fallback to local
    return createOpdVisit(patient.id);
  };

  // All available services for autocomplete
  const allServices = useMemo(() => {
    const fromConstants = BILLABLE_ITEMS.map((b) => ({ name: b.name, rate: b.rate }));
    const fromQuick = OPD_QUICK_SERVICES.map((s) => ({ name: s.name, rate: s.rate }));
    const combined = new Map<string, number>();
    [...fromQuick, ...fromConstants].forEach((s) => combined.set(s.name, s.rate));
    return Array.from(combined.entries()).map(([name, rate]) => ({ name, rate }));
  }, []);

  const suggestions = useMemo(() => {
    if (!inputDesc.trim()) return allServices.slice(0, 10);
    const q = inputDesc.toLowerCase();
    return allServices.filter((s) => s.name.toLowerCase().includes(q));
  }, [inputDesc, allServices]);

  const grossAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const concessionVal = typeof concession === "number" ? concession : 0;
  const totalAmount = Math.max(0, grossAmount - concessionVal);

  const addItem = (desc: string, rate: number, qty: number) => {
    const amount = rate * qty;
    setItems((prev) => [...prev, { id: uid(), description: desc, rate, quantity: qty, amount }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    if (!inputDesc.trim() || !inputRate) return;
    addItem(inputDesc.trim(), Number(inputRate), Number(inputQty) || 1);
    setInputDesc("");
    setInputRate("");
    setInputQty(1);
    setShowSuggestions(false);
    descRef.current?.focus();
  };

  const handleQuickAdd = (name: string, rate: number) => {
    addItem(name, rate, 1);
  };

  const handleSelectSuggestion = (name: string, rate: number) => {
    setInputDesc(name);
    setInputRate(rate);
    setShowSuggestions(false);
    // Move focus to qty/add
  };

  const handleSaveAndPrint = async () => {
    const currentVisit = await getOrCreateVisit();
    const today = new Date().toISOString().split("T")[0];
    const billNo = getNextBillNo(today);
    const bill: OpdBill = {
      id: uid(),
      billNo,
      items: [...items],
      grossAmount,
      concession: concessionVal,
      totalAmount,
      paidAmount: totalAmount,
      paymentMode,
      createdAt: new Date().toISOString(),
    };
    // Optimistic update
    updateOpdVisitBill(currentVisit.id, bill);
    // Sync to API
    await apiUpdateVisit(currentVisit.id, { bill });

    // Print
    const html = buildOpdBillPrintHtml({ patient, bill, visit: currentVisit });
    openPrintWindow(html);

    onDone(currentVisit);
  };

  const handleSaveOnly = async () => {
    if (items.length === 0) {
      const currentVisit = await getOrCreateVisit();
      onDone(currentVisit);
      return;
    }
    const currentVisit = await getOrCreateVisit();
    const today = new Date().toISOString().split("T")[0];
    const billNo = getNextBillNo(today);
    const bill: OpdBill = {
      id: uid(),
      billNo,
      items: [...items],
      grossAmount,
      concession: concessionVal,
      totalAmount,
      paidAmount: totalAmount,
      paymentMode,
      createdAt: new Date().toISOString(),
    };
    // Optimistic update
    updateOpdVisitBill(currentVisit.id, bill);
    // Sync to API
    await apiUpdateVisit(currentVisit.id, { bill });
    onDone(currentVisit);
  };

  const handleSkip = async () => {
    const currentVisit = await getOrCreateVisit();
    onSkip(currentVisit);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        {/* Patient Info */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {visit ? `#${visit.tokenNo}` : patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">{patient.name}</p>
            <p className="text-sm text-neutral-400">
              {patient.phone} · {patient.age}y / {patient.gender}
            </p>
          </div>
        </div>

        <h2 className="mb-1 text-lg font-semibold text-white">Payment & OPD Bill</h2>
        <p className="mb-5 text-sm text-neutral-400">Add services and take payment</p>

        {/* Quick Add Buttons */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            {OPD_QUICK_SERVICES.map((s) => (
              <button
                key={s.name}
                onClick={() => handleQuickAdd(s.name, s.rate)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
              >
                {s.name} · ₹{s.rate}
              </button>
            ))}
          </div>
        </div>

        {/* Add Item Row */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              ref={descRef}
              type="text"
              value={inputDesc}
              onChange={(e) => { setInputDesc(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Service description"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s.name, s.rate)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-neutral-500">₹{s.rate}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="number"
            value={inputRate}
            onChange={(e) => setInputRate(e.target.value ? Number(e.target.value) : "")}
            placeholder="Rate"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 sm:w-24"
          />
          <input
            type="number"
            value={inputQty}
            onChange={(e) => setInputQty(e.target.value ? Number(e.target.value) : "")}
            placeholder="Qty"
            min={1}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 sm:w-20"
          />
          <button
            onClick={handleAddItem}
            disabled={!inputDesc.trim() || !inputRate}
            className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="mb-5 rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-800/80">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Rate</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Amount</th>
                  <th className="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/40">
                    <td className="px-4 py-2.5 text-neutral-500">{i + 1}</td>
                    <td className="px-4 py-2.5 text-white">{item.description}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-300">₹{item.rate.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-center text-neutral-300">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-white">₹{item.amount.toFixed(2)}</td>
                    <td className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-500 transition-colors hover:text-red-400"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="mb-5 space-y-2 rounded-xl border border-neutral-800 bg-neutral-800/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Gross Amount</span>
              <span className="text-white">₹{grossAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Concession</span>
              <input
                type="number"
                value={concession}
                onChange={(e) => setConcession(e.target.value ? Number(e.target.value) : "")}
                min={0}
                className="w-28 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-right text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="border-t border-neutral-700 pt-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-white">Net Amount</span>
                <span className="text-lg text-emerald-400">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Mode */}
        {items.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Payment Mode</p>
            <div className="flex gap-2">
              {(["cash", "upi", "card", "other"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    paymentMode === mode
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {items.length > 0 && (
            <>
              <button
                onClick={handleSaveAndPrint}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Printer className="h-4 w-4" />
                Save & Print Bill
              </button>
              <button
                onClick={handleSaveOnly}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                Save Without Print
              </button>
            </>
          )}
          <button
            onClick={handleSkip}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            <SkipForward className="h-4 w-4" />
            Skip Billing
          </button>
        </div>
      </div>
    </div>
  );
}
