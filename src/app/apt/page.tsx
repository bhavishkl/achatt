"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAppStore } from "@/lib/store";

type Appointment = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  place: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled" | "not_confirmed";
  createdAt: string;
  updatedAt: string;
};

type PendingTransfer = {
  appointmentIndex: number;
  fromDate: string;
  toDate: string;
};

type AppointmentStatus = Appointment["status"];

const normalize = (value: string) => value.trim().toLowerCase();
const PHONE_ALLOWED_PATTERN = /^[\d+\-\s()]+$/;
const SAME_DIGIT_PHONE_PATTERN = /^(\d)\1{9}$/;

const getToday = () => new Date().toISOString().split("T")[0];

const normalizePhoneNumber = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }

  return digitsOnly;
};

const getPhoneValidationError = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Phone number is required.";
  }

  if (/[A-Za-z]/.test(trimmedValue)) {
    return "Phone number cannot contain letters.";
  }

  if (!PHONE_ALLOWED_PATTERN.test(trimmedValue)) {
    return "Phone number contains invalid characters.";
  }

  const normalizedPhone = normalizePhoneNumber(trimmedValue);

  if (!normalizedPhone) {
    return "Phone number must contain digits.";
  }

  if (normalizedPhone.length < 10) {
    return "Phone number must be at least 10 digits.";
  }

  if (normalizedPhone.length > 10) {
    return "Phone number cannot be more than 10 digits.";
  }

  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    return "Enter a valid 10-digit mobile number.";
  }

  if (SAME_DIGIT_PHONE_PATTERN.test(normalizedPhone)) {
    return "Phone number cannot repeat the same digit 10 times.";
  }

  return "";
};

export default function AppointmentPage() {
  const companyId = useAppStore((s) => s.companyId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(getToday());
  const [activeDateTab, setActiveDateTab] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [transferAppointmentId, setTransferAppointmentId] = useState<string | null>(null);
  const [transferDate, setTransferDate] = useState(getToday());
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(
    null
  );

  useEffect(() => {
    if (!companyId) {
      setAppointments([]);
      return;
    }

    const loadAppointments = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/appointments?companyId=${companyId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load appointments");
        }
        setAppointments((data.appointments ?? []) as Appointment[]);
      } catch (loadError: unknown) {
        const messageText = loadError instanceof Error ? loadError.message : "Failed to load appointments";
        setError(messageText);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAppointments();
  }, [companyId]);

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        if (a.date === b.date) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return a.date.localeCompare(b.date);
      }),
    [appointments]
  );

  const appointmentDates = useMemo(
    () => [...new Set(sortedAppointments.map((appointment) => appointment.date))],
    [sortedAppointments]
  );

  const appointmentsByDate = useMemo(
    () =>
      appointmentDates.map((appointmentDate) => ({
        date: appointmentDate,
        appointments: sortedAppointments.filter((appointment) => appointment.date === appointmentDate),
      })),
    [appointmentDates, sortedAppointments]
  );

  const activeAppointments = useMemo(
    () =>
      appointmentsByDate.find((group) => group.date === activeDateTab)?.appointments ??
      appointmentsByDate[0]?.appointments ??
      [],
    [activeDateTab, appointmentsByDate]
  );

  useEffect(() => {
    if (appointmentDates.length === 0) {
      setActiveDateTab("");
      return;
    }

    if (!appointmentDates.includes(activeDateTab)) {
      setActiveDateTab(appointmentDates[0]);
    }
  }, [activeDateTab, appointmentDates]);

  const clearForm = () => {
    setName("");
    setPhone("");
    setPlace("");
    setDate(getToday());
    setPhoneError("");
  };

  const formatTabDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getActiveDateLabel = () => (activeDateTab ? formatTabDate(activeDateTab) : "");

  const formatStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "cancelled":
        return "Cancelled";
      case "not_confirmed":
        return "Not Confirmed";
      default:
        return "Pending";
    }
  };

  const getStatusClasses = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "border-emerald-700/40 bg-emerald-900/20 text-emerald-300";
      case "cancelled":
        return "border-red-700/40 bg-red-900/20 text-red-300";
      case "not_confirmed":
        return "border-amber-700/40 bg-amber-900/20 text-amber-300";
      default:
        return "border-neutral-700 bg-neutral-800 text-neutral-300";
    }
  };

  const buildAppointmentsPdf = () => {
    const doc = new jsPDF();
    const title = `Appointments - ${getActiveDateLabel()}`;

    doc.setFontSize(16);
    doc.text(title, 14, 18);

    autoTable(doc, {
      startY: 26,
      head: [["Name", "Phone", "Place"]],
      body: activeAppointments.map((appointment) => [
        appointment.name,
        appointment.phone,
        appointment.place,
      ]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [23, 23, 23] },
    });

    return doc;
  };

  const getPdfFileName = () => `appointments_${activeDateTab}.pdf`;

  const handleExportPdf = async () => {
    if (!activeDateTab || activeAppointments.length === 0) {
      setError("No appointments available for export.");
      return;
    }

    setError("");
    setMessage("");
    setIsExporting(true);

    try {
      const doc = buildAppointmentsPdf();
      doc.save(getPdfFileName());
      setMessage(`Exported PDF for ${getActiveDateLabel()}.`);
    } catch (exportError: unknown) {
      const messageText = exportError instanceof Error ? exportError.message : "Failed to export PDF";
      setError(messageText);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    if (!activeDateTab || activeAppointments.length === 0) {
      setError("No appointments available to share.");
      return;
    }

    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setError("Sharing is not supported on this device/browser.");
      return;
    }

    setError("");
    setMessage("");
    setIsExporting(true);

    try {
      const doc = buildAppointmentsPdf();
      const blob = doc.output("blob");
      const file = new File([blob], getPdfFileName(), { type: "application/pdf" });
      const shareData: ShareData = {
        title: `Appointments - ${getActiveDateLabel()}`,
        text: `Appointments for ${getActiveDateLabel()}`,
        files: [file],
      };

      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        throw new Error("This browser cannot share PDF files.");
      }

      await navigator.share(shareData);
      setMessage(`Shared PDF for ${getActiveDateLabel()}.`);
    } catch (shareError: unknown) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        setMessage("Share cancelled.");
      } else {
        const messageText = shareError instanceof Error ? shareError.message : "Failed to share PDF";
        setError(messageText);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmTransfer = () => {
    if (!pendingTransfer) return;

    const { appointmentIndex, fromDate, toDate } = pendingTransfer;
    const existing = appointments[appointmentIndex];
    if (!existing) {
      setPendingTransfer(null);
      return;
    }

    if (!companyId) {
      setError("Company profile is required to manage appointments.");
      return;
    }

    const transfer = async () => {
      try {
        const response = await fetch(`/api/appointments/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            date: toDate,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to transfer appointment");
        }

        const updated = [...appointments];
        updated[appointmentIndex] = data.appointment as Appointment;
        setAppointments(updated);
        setMessage(`Appointment transferred from ${fromDate} to ${toDate}.`);
        setPendingTransfer(null);
        clearForm();
      } catch (transferError: unknown) {
        const messageText =
          transferError instanceof Error ? transferError.message : "Failed to transfer appointment";
        setError(messageText);
      }
    };

    void transfer();
  };

  const handleCancelTransfer = () => {
    setPendingTransfer(null);
    setMessage("Transfer cancelled. Existing appointment kept.");
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);

    if (phoneError) {
      setPhoneError(getPhoneValidationError(value));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneError(getPhoneValidationError(phone));
  };

  const updateAppointmentInState = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((appointment) => (appointment.id === updatedAppointment.id ? updatedAppointment : appointment))
    );
  };

  const handleStatusUpdate = async (appointment: Appointment, status: AppointmentStatus) => {
    if (!companyId) {
      setError("Company profile is required to manage appointments.");
      return;
    }

    setError("");
    setMessage("");
    setUpdatingAppointmentId(appointment.id);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          status,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update appointment status");
      }

      updateAppointmentInState(data.appointment as Appointment);
      setMessage(`${appointment.name} marked as ${formatStatusLabel(status).toLowerCase()}.`);
    } catch (statusError: unknown) {
      const messageText = statusError instanceof Error ? statusError.message : "Failed to update appointment status";
      setError(messageText);
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const startTransfer = (appointment: Appointment) => {
    setTransferAppointmentId(appointment.id);
    setTransferDate(appointment.date);
    setError("");
    setMessage("");
  };

  const cancelRowTransfer = () => {
    setTransferAppointmentId(null);
    setTransferDate(getToday());
  };

  const handleRowTransfer = async (appointment: Appointment) => {
    if (!companyId) {
      setError("Company profile is required to manage appointments.");
      return;
    }

    if (!transferDate) {
      setError("Select a transfer date.");
      return;
    }

    if (transferDate === appointment.date) {
      setError("Choose a different date to transfer this appointment.");
      return;
    }

    setError("");
    setMessage("");
    setUpdatingAppointmentId(appointment.id);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          date: transferDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to transfer appointment");
      }

      updateAppointmentInState(data.appointment as Appointment);
      setTransferAppointmentId(null);
      setTransferDate(getToday());
      setMessage(`Appointment transferred to ${transferDate}.`);
    } catch (transferError: unknown) {
      const messageText = transferError instanceof Error ? transferError.message : "Failed to transfer appointment";
      setError(messageText);
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedName = normalize(name);
    const phoneValidationError = getPhoneValidationError(phone);
    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedPlace = normalize(place);

    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setError(phoneValidationError);
      return;
    }

    setPhoneError("");

    const duplicateIndex = appointments.findIndex(
      (appointment) =>
        normalize(appointment.name) === normalizedName &&
        normalizePhoneNumber(appointment.phone) === normalizedPhone &&
        normalize(appointment.place) === normalizedPlace
    );

    if (duplicateIndex >= 0) {
      const existing = appointments[duplicateIndex];

      if (existing.date === date) {
        setError("Duplicate appointment already exists for this date.");
        return;
      }

      setPendingTransfer({
        appointmentIndex: duplicateIndex,
        fromDate: existing.date,
        toDate: date,
      });
      return;
    }

    if (!companyId) {
      setError("Company profile is required to manage appointments.");
      return;
    }

    const save = async () => {
      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            appointment: {
              name: name.trim(),
              phone: normalizedPhone,
              place: place.trim(),
              date,
            },
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to save appointment");
        }

        setAppointments((prev) => [...prev, data.appointment as Appointment]);
        setMessage("Appointment saved.");
        clearForm();
      } catch (saveError: unknown) {
        const messageText = saveError instanceof Error ? saveError.message : "Failed to save appointment";
        setError(messageText);
      }
    };

    void save();
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="block text-neutral-300 mb-1">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm">
              <span className="block text-neutral-300 mb-1">Phone Number</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={handlePhoneBlur}
                required
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                className={`w-full rounded-md bg-neutral-950 border px-3 py-2 outline-none focus:border-blue-500 ${
                  phoneError ? "border-red-500" : "border-neutral-700"
                }`}
              />
              {phoneError && <span className="mt-1 block text-xs text-red-400">{phoneError}</span>}
              {!phoneError && (
                <span className="mt-1 block text-xs text-neutral-500">
                  Accepts 10-digit mobile numbers and auto-handles `91` country code.
                </span>
              )}
            </label>

            <label className="text-sm">
              <span className="block text-neutral-300 mb-1">Place</span>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                required
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm">
              <span className="block text-neutral-300 mb-1">Appointment Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700"
          >
            Save Appointment
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
            {message}
          </div>
        )}
        {isLoading && <div className="mb-4 text-sm text-neutral-400">Loading appointments...</div>}

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
          {appointmentDates.length > 0 && (
            <div className="border-b border-neutral-800 bg-neutral-950/70 px-3 pt-3">
              <div className="flex flex-col gap-3 pb-3 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {appointmentDates.map((appointmentDate) => {
                    const isActive = appointmentDate === activeDateTab;

                    return (
                      <button
                        key={appointmentDate}
                        type="button"
                        onClick={() => setActiveDateTab(appointmentDate)}
                        className={`rounded-t-md border px-4 py-2 text-sm transition ${
                          isActive
                            ? "border-neutral-700 border-b-neutral-900 bg-neutral-900 text-white"
                            : "border-transparent bg-neutral-800/70 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        }`}
                      >
                        {formatTabDate(appointmentDate)}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExporting || activeAppointments.length === 0}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isExporting ? "Working..." : "Export PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSharePdf}
                    disabled={isExporting || activeAppointments.length === 0}
                    className="rounded-md bg-neutral-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-neutral-800/70 text-neutral-300">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Place</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-neutral-400 text-center">
                    No appointments yet.
                  </td>
                </tr>
              ) : (
                activeAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-t border-neutral-800">
                    <td className="px-4 py-3">{appointment.name}</td>
                    <td className="px-4 py-3">{appointment.phone}</td>
                    <td className="px-4 py-3">{appointment.place}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(appointment.status)}`}>
                        {formatStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startTransfer(appointment)}
                          disabled={updatingAppointmentId === appointment.id}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleStatusUpdate(appointment, "confirmed")}
                          disabled={updatingAppointmentId === appointment.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleStatusUpdate(appointment, "cancelled")}
                          disabled={updatingAppointmentId === appointment.id}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleStatusUpdate(appointment, "not_confirmed")}
                          disabled={updatingAppointmentId === appointment.id}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          Not Confirm
                        </button>
                      </div>
                      {transferAppointmentId === appointment.id && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => void handleRowTransfer(appointment)}
                            disabled={updatingAppointmentId === appointment.id}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={cancelRowTransfer}
                            disabled={updatingAppointmentId === appointment.id}
                            className="rounded-md bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingTransfer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-lg font-semibold mb-2">Transfer Appointment?</h2>
            <p className="text-sm text-neutral-300 mb-5">
              This patient already has an appointment on{" "}
              <span className="font-medium text-white">{pendingTransfer.fromDate}</span>.
              Transfer it to{" "}
              <span className="font-medium text-white">{pendingTransfer.toDate}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelTransfer}
                className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-700 hover:bg-neutral-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
