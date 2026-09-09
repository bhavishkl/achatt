"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Patient } from "@/types/patient";
import {
  currentDateValue,
  currentTimeValue,
  formatDisplayDateTime,
  toTimeInputValue,
} from "@/components/add-bill-modal/utils";

interface DischargePatientModalProps {
  isOpen: boolean;
  patient: Patient | null;
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: (dischargeDate: string, dischargeTime: string) => void | Promise<void>;
}

export default function DischargePatientModal({
  isOpen,
  patient,
  isSaving = false,
  onClose,
  onConfirm,
}: DischargePatientModalProps) {
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeTime, setDischargeTime] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen || !patient) return;
    setDischargeDate(currentDateValue());
    setDischargeTime(currentTimeValue());
    setFormError("");
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const admissionDate = (patient.admissionDate || "").split("T")[0];
  const admissionTime = toTimeInputValue(patient.admissionTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!dischargeDate || !dischargeTime) {
      setFormError("Discharge date and time are required.");
      return;
    }

    if (admissionDate && `${dischargeDate}T${dischargeTime}` < `${admissionDate}T${admissionTime || "00:00"}`) {
      setFormError("Discharge date and time cannot be before admission.");
      return;
    }

    setFormError("");
    try {
      await onConfirm(dischargeDate, dischargeTime);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to discharge patient.";
      setFormError(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-1">Discharge Patient</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Enter the discharge date and time to complete this admission.
        </p>

        <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 mb-5 text-sm">
          <div className="font-medium text-white">
            {patient.prefix} {patient.name}
          </div>
          <div className="text-neutral-500 text-xs mt-0.5">
            {patient.ipNumber ? `IP ${patient.ipNumber}` : `Reg ${patient.regNo}`}
            {" · "}
            {patient.wardName}, Bed {patient.bedNo}
          </div>
          <div className="text-neutral-400 text-xs mt-1">
            Admitted {formatDisplayDateTime(patient.admissionDate, patient.admissionTime)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Discharge Date</label>
              <input
                required
                type="date"
                min={admissionDate || undefined}
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                disabled={isSaving}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Discharge Time</label>
              <input
                required
                type="time"
                min={dischargeDate === admissionDate ? admissionTime || undefined : undefined}
                value={dischargeTime}
                onChange={(e) => setDischargeTime(e.target.value)}
                disabled={isSaving}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
              />
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-400">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Discharging…
                </>
              ) : (
                "Confirm Discharge"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
