"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";

type Appointment = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  place: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

type PendingTransfer = {
  appointmentIndex: number;
  fromDate: string;
  toDate: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

const getToday = () => new Date().toISOString().split("T")[0];

export default function AppointmentPage() {
  const companyId = useAppStore((s) => s.companyId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(getToday());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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

  const clearForm = () => {
    setName("");
    setPhone("");
    setPlace("");
    setDate(getToday());
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedName = normalize(name);
    const normalizedPhone = normalize(phone);
    const normalizedPlace = normalize(place);

    const duplicateIndex = appointments.findIndex(
      (appointment) =>
        normalize(appointment.name) === normalizedName &&
        normalize(appointment.phone) === normalizedPhone &&
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
              phone: phone.trim(),
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
        <h1 className="text-2xl font-bold mb-6">Patient Appointments</h1>

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
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 outline-none focus:border-blue-500"
              />
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
          <table className="w-full text-sm">
            <thead className="bg-neutral-800/70 text-neutral-300">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Place</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-neutral-400 text-center">
                    No appointments yet.
                  </td>
                </tr>
              ) : (
                sortedAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-t border-neutral-800">
                    <td className="px-4 py-3">{appointment.date}</td>
                    <td className="px-4 py-3">{appointment.name}</td>
                    <td className="px-4 py-3">{appointment.phone}</td>
                    <td className="px-4 py-3">{appointment.place}</td>
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
