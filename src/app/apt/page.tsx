"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppointmentAlerts } from "@/components/apt/AppointmentAlerts";
import { AppointmentForm } from "@/components/apt/AppointmentForm";
import { AppointmentTable } from "@/components/apt/AppointmentTable";
import { AppointmentTabs } from "@/components/apt/AppointmentTabs";
import { TransferConfirmModal } from "@/components/apt/TransferConfirmModal";
import { Appointment, AppointmentStatus, PendingTransfer } from "@/components/apt/types";
import { formatStatusLabel, formatTabDate, getAppointmentStats } from "@/components/apt/utils";
import { useAppStore } from "@/lib/store";

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
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        const statusWeightDiff = getStatusSortWeight(a.status) - getStatusSortWeight(b.status);
        if (statusWeightDiff !== 0) {
          return statusWeightDiff;
        }

        return b.createdAt.localeCompare(a.createdAt);
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

  const getActiveDateLabel = () => (activeDateTab ? formatTabDate(activeDateTab) : "");

  const activeAppointmentStats = useMemo(
    () => getAppointmentStats(activeAppointments),
    [activeAppointments]
  );

  const buildAppointmentsPdf = () => {
    const doc = new jsPDF();
    const title = `Appointments - ${getActiveDateLabel()}`;

    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Total: ${activeAppointmentStats.total}`, 14, 26);
    doc.text(`Confirmed: ${activeAppointmentStats.confirmed}`, 52, 26);
    doc.text(`Cancelled: ${activeAppointmentStats.cancelled}`, 102, 26);
    doc.text(`Not Confirmed: ${activeAppointmentStats.notConfirmed}`, 150, 26);

    autoTable(doc, {
      startY: 32,
      head: [["S.No", "Name", "Phone", "Place", "Status"]],
      body: activeAppointments.map((appointment, index) => [
        index + 1,
        appointment.name,
        appointment.phone,
        appointment.place,
        formatStatusLabel(appointment.status),
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 0.2,
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
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 4) {
          return;
        }

        const appointment = activeAppointments[data.row.index];
        if (!appointment) {
          return;
        }

        switch (appointment.status) {
          case "confirmed":
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
            break;
          case "cancelled":
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
            break;
          case "not_confirmed":
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
            break;
          default:
            data.cell.styles.fillColor = [229, 229, 229];
            data.cell.styles.textColor = [38, 38, 38];
            break;
        }
      },
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
        <AppointmentForm
          name={name}
          phone={phone}
          place={place}
          date={date}
          phoneError={phoneError}
          onSubmit={handleSubmit}
          onNameChange={setName}
          onPhoneChange={handlePhoneChange}
          onPhoneBlur={handlePhoneBlur}
          onPlaceChange={setPlace}
          onDateChange={setDate}
        />

        <AppointmentAlerts error={error} message={message} isLoading={isLoading} />

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
          <AppointmentTabs
            appointmentDates={appointmentDates}
            activeDateTab={activeDateTab}
            isExporting={isExporting}
            hasActiveAppointments={activeAppointments.length > 0}
            activeStats={activeAppointmentStats}
            onDateTabChange={setActiveDateTab}
            onExportPdf={() => void handleExportPdf()}
            onSharePdf={() => void handleSharePdf()}
          />

          <AppointmentTable
            appointments={activeAppointments}
            updatingAppointmentId={updatingAppointmentId}
            transferAppointmentId={transferAppointmentId}
            transferDate={transferDate}
            onStartTransfer={startTransfer}
            onTransferDateChange={setTransferDate}
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
