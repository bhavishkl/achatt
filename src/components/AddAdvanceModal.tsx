"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Company } from "@/lib/types";
import type { Patient } from "@/types/patient";
import { useAppStore } from "@/lib/store";
import {
  buildAdvanceReceiptHtml,
  advanceReceiptNo,
} from "@/components/advances/receipt";
import {
  openBillPrintWindow,
  openPendingPrintWindow,
} from "@/components/add-bill-modal/print";

export interface AdvanceSavePayload {
  amount: number;
  mode: "cash" | "online";
  note: string;
}

/** What the parent's save handler must resolve with (used for the receipt). */
export interface AdvanceSaveResult {
  patient: Patient;
  advance: { id: string; createdAt: string };
}

interface AddAdvanceModalProps {
  isOpen: boolean;
  patients: Patient[];
  /** Preselected patient; when null the modal shows a patient picker. */
  patient: Patient | null;
  isSaving: boolean;
  onClose: () => void;
  onSaveAdvance: (patientId: string, payload: AdvanceSavePayload) => Promise<AdvanceSaveResult | null>;
}

export default function AddAdvanceModal({
  isOpen,
  patients,
  patient,
  isSaving,
  onClose,
  onSaveAdvance,
}: AddAdvanceModalProps) {
  const { companyId } = useAppStore();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "online">("cash");
  const [note, setNote] = useState("");
  const [companyProfile, setCompanyProfile] = useState<Company | null>(null);
  const [amountError, setAmountError] = useState("");

  const chosenPatient =
    patient ?? patients.find((p) => p.id === selectedPatientId) ?? null;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPatientId(patient?.id ?? "");
    setAmount("");
    setPaymentMode("cash");
    setNote("");
    setAmountError("");
  }, [isOpen, patient]);

  // Same letterhead source the bills use.
  useEffect(() => {
    if (!isOpen || !companyId) return;
    let isMounted = true;
    fetch(`/api/ipd/hospital-info?companyId=${companyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((infoData) => {
        if (isMounted && infoData) {
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
      .catch((err) => console.error("Error loading hospital info for receipt:", err));
    return () => {
      isMounted = false;
    };
  }, [isOpen, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenPatient || isSaving) return;

    const parsedAmount = Number(amount);
    if (amount === "" || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Enter a valid advance amount");
      return;
    }
    setAmountError("");

    // Reserved while the click is still a trusted gesture; filled in once the
    // save succeeds — same approach as the bill modal's print flow.
    const printWindow = openPendingPrintWindow();

    try {
      const result = await onSaveAdvance(chosenPatient.id, {
        amount: parsedAmount,
        mode: paymentMode,
        note: note.trim(),
      });

      if (result?.advance?.id && result.patient) {
        openBillPrintWindow(
          buildAdvanceReceiptHtml({
            patient: result.patient,
            amount: parsedAmount,
            mode: paymentMode,
            note: note.trim(),
            receiptNo: advanceReceiptNo({ id: result.advance.id }),
            createdAt: result.advance.createdAt,
            advanceBalance: result.patient.advanceBalance ?? null,
            companyProfile,
          }),
          printWindow
        );
      } else {
        printWindow?.close();
      }
    } catch {
      // Error state is displayed by the parent page.
      printWindow?.close();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Add Advance Amount</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Record an advance received from the patient — a receipt is printed after saving.
        </p>

        {!patient && (
          <div className="mb-3">
            <label className="block text-sm text-neutral-400 mb-1">Patient</label>
            <select
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prefix} {p.name} — Reg {p.regNo}
                  {p.ipNumber ? ` (IP ${p.ipNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm text-neutral-400 mb-1">
            Advance Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value === "" ? "" : Number(e.target.value));
              if (amountError) setAmountError("");
            }}
            className={`w-full bg-neutral-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              amountError ? "border-red-500" : "border-neutral-800"
            }`}
            placeholder="e.g. 5000"
            aria-label="Advance amount"
          />
          {amountError && <p className="mt-1 text-xs text-red-400">{amountError}</p>}
        </div>

        <div className="mb-3">
          <label className="block text-sm text-neutral-400 mb-1">Payment Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "online"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                aria-label={`Payment mode: ${mode}`}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  paymentMode === mode
                    ? mode === "cash"
                      ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                      : "border-blue-700 bg-blue-950/40 text-blue-300"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                }`}
              >
                {mode === "cash" ? "💵 Cash" : "📱 Online"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-1">
          <label className="block text-sm text-neutral-400 mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="e.g. Part payment, reference no…"
          />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save & Print Receipt"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
