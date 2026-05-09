import { Appointment, AppointmentStatus } from "./types";

export const formatTabDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatStatusLabel = (status: AppointmentStatus) => {
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

export const getStatusClasses = (status: AppointmentStatus) => {
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

export const getAppointmentStats = (appointments: Appointment[]) => ({
  total: appointments.length,
  confirmed: appointments.filter((appointment) => appointment.status === "confirmed").length,
  cancelled: appointments.filter((appointment) => appointment.status === "cancelled").length,
  notConfirmed: appointments.filter((appointment) => appointment.status === "not_confirmed").length,
});
