"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppointmentAlerts } from "@/components/apt/AppointmentAlerts";
import { AppointmentForm } from "@/components/apt/AppointmentForm";
import { AppointmentTable } from "@/components/apt/AppointmentTable";
import { SessionHeader } from "@/components/apt/SessionHeader";
import { TransferConfirmModal } from "@/components/apt/TransferConfirmModal";
import { Appointment, AppointmentStatus, PendingTransfer, TimeSlot } from "@/components/apt/types";
import { formatSessionLabel, formatStatusLabel, formatTabDate, getAppointmentStats } from "@/components/apt/utils";
import { useAppStore, AppState } from "@/lib/store";

const normalize = (value: string) => value.trim().toLowerCase();
const PHONE_ALLOWED_PATTERN = /^[\d+\-\s()]+$/;
const SAME_DIGIT_PHONE_PATTERN = /^(\d)\1{9}$/;
const getStatusSortWeight = (status: AppointmentStatus) => (status === "cancelled" ? 1 : 0);

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

const sortAppointments = (list: Appointment[]) =>
  [...list].sort((a, b) => {
    const statusWeightDiff = getStatusSortWeight(a.status) - getStatusSortWeight(b.status);
    if (statusWeightDiff !== 0) return statusWeightDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });

export default function AppointmentPage() {
  const companyId = useAppStore((s: AppState) => s.companyId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(getToday());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [activeSession, setActiveSession] = useState<TimeSlot>("morning");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [transferAppointmentId, setTransferAppointmentId] = useState<string | null>(null);
  const [transferDate, setTransferDate] = useState(getToday());
  const [transferTimeSlot, setTransferTimeSlot] = useState<TimeSlot>("morning");
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

  // Filter appointments for the selected form date and active session
  const activeSessionAppointments = useMemo(
    () => sortAppointments(appointments.filter((a) => a.date === date && a.timeSlot === activeSession)),
    [appointments, date, activeSession]
  );

  const activeSessionStats = useMemo(() => getAppointmentStats(activeSessionAppointments), [activeSessionAppointments]);

  const clearForm = () => {
    setName("");
    setPhone("");
    setPlace("");
    setDate(getToday());
    setTimeSlot("morning");
    setPhoneError("");
  };

  const allDateAppointments = useMemo(
    () => appointments.filter((a) => a.date === date),
    [appointments, date]
  );

  const addSessionPage = (
    doc: jsPDF,
    sessionSlot: TimeSlot,
    sessionAppointments: Appointment[]
  ) => {
    const dateLabel = formatTabDate(date);
    const sessionLabel = formatSessionLabel(sessionSlot);
    const title = `Appointments - ${dateLabel} - ${sessionLabel}`;
    const stats = getAppointmentStats(sessionAppointments);

    doc.setFontSize(18);
    doc.text(title, 14, 18);
    doc.setFontSize(12);
    doc.text(`Total: ${stats.total}`, 14, 26);
    doc.text(`Confirmed: ${stats.confirmed}`, 45, 26);
    doc.text(`Cancelled: ${stats.cancelled}`, 95, 26);
    doc.text(`Not Confirmed: ${stats.notConfirmed}`, 140, 26);

    if (sessionAppointments.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(120, 120, 120);
      doc.text("No appointments.", 14, 40);
      doc.setTextColor(0, 0, 0);
      return;
    }

    autoTable(doc, {
      startY: 32,
      head: [["S.No", "Name", "Phone", "Place", ""]],
      body: sessionAppointments.map((appointment, index) => [
        index + 1,
        appointment.name,
        appointment.phone,
        appointment.place,
        "",
      ]),
      styles: {
        fontSize: 12,
        cellPadding: 1.5,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [23, 23, 23],
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        4: { cellWidth: 8 },
      },
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 4) return;
        const appointment = sessionAppointments[data.row.index];
        if (!appointment) return;

        switch (appointment.status) {
          case "confirmed":
            data.cell.styles.fillColor = [220, 252, 231];
            break;
          case "cancelled":
            data.cell.styles.fillColor = [254, 226, 226];
            break;
          case "not_confirmed":
            data.cell.styles.fillColor = [254, 243, 199];
            break;
          default:
            data.cell.styles.fillColor = [229, 229, 229];
            break;
        }
      },
    });
  };

  const buildCombinedPdf = () => {
    const doc = new jsPDF();
    const morningList = sortAppointments(allDateAppointments.filter((a) => a.timeSlot === "morning"));
    const eveningList = sortAppointments(allDateAppointments.filter((a) => a.timeSlot === "evening"));

    // Page 1 — Morning
    addSessionPage(doc, "morning", morningList);

    // Page 2 — Evening
    doc.addPage();
    addSessionPage(doc, "evening", eveningList);

    return doc;
  };

  const handleExportPdf = async () => {
    if (allDateAppointments.length === 0) {
      setError("No appointments available for export.");
      return;
    }

    setError("");
    setMessage("");
    setIsExporting(true);

    try {
      const doc = buildCombinedPdf();
      doc.save(`appointments_${date}.pdf`);
      setMessage(`Exported PDF for ${formatTabDate(date)}.`);
    } catch (exportError: unknown) {
      const messageText = exportError instanceof Error ? exportError.message : "Failed to export PDF";
      setError(messageText);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    if (allDateAppointments.length === 0) {
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
      const doc = buildCombinedPdf();
      const blob = doc.output("blob");
      const fileName = `appointments_${date}.pdf`;
      const label = formatTabDate(date);
      const file = new File([blob], fileName, { type: "application/pdf" });
      const shareData: ShareData = {
        title: `Appointments - ${label}`,
        text: `Appointments for ${label}`,
        files: [file],
      };

      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        throw new Error("This browser cannot share PDF files.");
      }

      await navigator.share(shareData);
      setMessage(`Shared PDF for ${label}.`);
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

    const { appointmentIndex, toDate, toTimeSlot } = pendingTransfer;
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
            timeSlot: toTimeSlot,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to transfer appointment");
        }

        const updated = [...appointments];
        updated[appointmentIndex] = data.appointment as Appointment;
        setAppointments(updated);
        setMessage(`Appointment transferred to ${toDate} (${formatSessionLabel(toTimeSlot)}).`);
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
    setTransferTimeSlot(appointment.timeSlot);
    setError("");
    setMessage("");
  };

  const cancelRowTransfer = () => {
    setTransferAppointmentId(null);
    setTransferDate(getToday());
    setTransferTimeSlot("morning");
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

    if (transferDate === appointment.date && transferTimeSlot === appointment.timeSlot) {
      setError("Choose a different date or session to transfer this appointment.");
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
          timeSlot: transferTimeSlot,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to transfer appointment");
      }

      updateAppointmentInState(data.appointment as Appointment);
      setTransferAppointmentId(null);
      setTransferDate(getToday());
      setTransferTimeSlot("morning");
      setMessage(`Appointment transferred to ${transferDate} (${formatSessionLabel(transferTimeSlot)}).`);
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

      if (existing.date === date && existing.timeSlot === timeSlot) {
        setError("Duplicate appointment already exists for this date and session.");
        return;
      }

      setPendingTransfer({
        appointmentIndex: duplicateIndex,
        fromDate: existing.date,
        fromTimeSlot: existing.timeSlot,
        toDate: date,
        toTimeSlot: timeSlot,
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
              timeSlot,
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
    <main className="min-h-screen bg-neutral-950 px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <AppointmentForm
          name={name}
          phone={phone}
          place={place}
          date={date}
          timeSlot={timeSlot}
          phoneError={phoneError}
          onSubmit={handleSubmit}
          onNameChange={setName}
          onPhoneChange={handlePhoneChange}
          onPhoneBlur={handlePhoneBlur}
          onPlaceChange={setPlace}
          onDateChange={setDate}
          onTimeSlotChange={setTimeSlot}
        />

        <AppointmentAlerts error={error} message={message} isLoading={isLoading} />

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isExporting || allDateAppointments.length === 0}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? "Working..." : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={() => void handleSharePdf()}
            disabled={isExporting || allDateAppointments.length === 0}
            className="rounded-md bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Share
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
          <SessionHeader
            activeSession={activeSession}
            stats={activeSessionStats}
            onSessionChange={setActiveSession}
          />
          <AppointmentTable
            appointments={activeSessionAppointments}
            updatingAppointmentId={updatingAppointmentId}
            transferAppointmentId={transferAppointmentId}
            transferDate={transferDate}
            transferTimeSlot={transferTimeSlot}
            onStartTransfer={startTransfer}
            onTransferDateChange={setTransferDate}
            onTransferTimeSlotChange={setTransferTimeSlot}
            onApplyTransfer={(appointment) => void handleRowTransfer(appointment)}
            onCancelTransfer={cancelRowTransfer}
            onStatusUpdate={(appointment, status) => void handleStatusUpdate(appointment, status)}
          />
        </div>
      </div>

      <TransferConfirmModal
        pendingTransfer={pendingTransfer}
        onCancel={handleCancelTransfer}
        onConfirm={handleConfirmTransfer}
      />
    </main>
  );
}
