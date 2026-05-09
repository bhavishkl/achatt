import { ArrowRightLeft, Check, CircleX, OctagonX, X } from "lucide-react";
import { Appointment, AppointmentStatus } from "./types";
import { formatStatusLabel, getStatusClasses } from "./utils";

type AppointmentTableProps = {
  appointments: Appointment[];
  updatingAppointmentId: string | null;
  transferAppointmentId: string | null;
  transferDate: string;
  onStartTransfer: (appointment: Appointment) => void;
  onTransferDateChange: (value: string) => void;
  onApplyTransfer: (appointment: Appointment) => void;
  onCancelTransfer: () => void;
  onStatusUpdate: (appointment: Appointment, status: AppointmentStatus) => void;
};

export function AppointmentTable({
  appointments,
  updatingAppointmentId,
  transferAppointmentId,
  transferDate,
  onStartTransfer,
  onTransferDateChange,
  onApplyTransfer,
  onCancelTransfer,
  onStatusUpdate,
}: AppointmentTableProps) {
  return (
    <>
      <div className="divide-y divide-neutral-800 md:hidden">
        {appointments.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-neutral-400">No appointments yet.</div>
        ) : (
          appointments.map((appointment, index) => (
            <div key={appointment.id} className="space-y-4 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Appointment {index + 1}</p>
                  <p className="truncate text-base font-semibold text-white">{appointment.name}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(appointment.status)}`}
                >
                  {formatStatusLabel(appointment.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-neutral-950 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Phone</p>
                  <p className="mt-1 text-neutral-100">{appointment.phone}</p>
                </div>
                <div className="rounded-md bg-neutral-950 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Place</p>
                  <p className="mt-1 text-neutral-100">{appointment.place}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onStartTransfer(appointment)}
                  disabled={updatingAppointmentId === appointment.id}
                  aria-label="Transfer appointment"
                  title="Transfer appointment"
                  className="flex items-center justify-center rounded-md bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <ArrowRightLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onStatusUpdate(appointment, "confirmed")}
                  disabled={updatingAppointmentId === appointment.id}
                  aria-label="Confirm appointment"
                  title="Confirm appointment"
                  className="flex items-center justify-center rounded-md bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onStatusUpdate(appointment, "cancelled")}
                  disabled={updatingAppointmentId === appointment.id}
                  aria-label="Cancel appointment"
                  title="Cancel appointment"
                  className="flex items-center justify-center rounded-md bg-red-600 p-2.5 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <OctagonX size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onStatusUpdate(appointment, "not_confirmed")}
                  disabled={updatingAppointmentId === appointment.id}
                  aria-label="Mark as not confirmed"
                  title="Mark as not confirmed"
                  className="flex items-center justify-center rounded-md bg-amber-600 p-2.5 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <CircleX size={14} />
                </button>
              </div>

              {transferAppointmentId === appointment.id && (
                <div className="space-y-2 rounded-md border border-neutral-800 bg-neutral-950 p-3">
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => onTransferDateChange(e.target.value)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onApplyTransfer(appointment)}
                      disabled={updatingAppointmentId === appointment.id}
                      aria-label="Apply transfer"
                      title="Apply transfer"
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={onCancelTransfer}
                      disabled={updatingAppointmentId === appointment.id}
                      aria-label="Close transfer"
                      title="Close transfer"
                      className="rounded-md bg-neutral-700 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-neutral-800/70 text-neutral-300">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Place</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No appointments yet.
                </td>
              </tr>
            ) : (
              appointments.map((appointment, index) => (
                <tr key={appointment.id} className="border-t border-neutral-800">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{appointment.name}</td>
                  <td className="px-4 py-3">{appointment.phone}</td>
                  <td className="px-4 py-3">{appointment.place}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(appointment.status)}`}
                    >
                      {formatStatusLabel(appointment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onStartTransfer(appointment)}
                        disabled={updatingAppointmentId === appointment.id}
                        aria-label="Transfer appointment"
                        title="Transfer appointment"
                        className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <ArrowRightLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusUpdate(appointment, "confirmed")}
                        disabled={updatingAppointmentId === appointment.id}
                        aria-label="Confirm appointment"
                        title="Confirm appointment"
                        className="rounded-md bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusUpdate(appointment, "cancelled")}
                        disabled={updatingAppointmentId === appointment.id}
                        aria-label="Cancel appointment"
                        title="Cancel appointment"
                        className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <OctagonX size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusUpdate(appointment, "not_confirmed")}
                        disabled={updatingAppointmentId === appointment.id}
                        aria-label="Mark as not confirmed"
                        title="Mark as not confirmed"
                        className="rounded-md bg-amber-600 p-2 text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        <CircleX size={14} />
                      </button>
                    </div>
                    {transferAppointmentId === appointment.id && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={transferDate}
                          onChange={(e) => onTransferDateChange(e.target.value)}
                          className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => onApplyTransfer(appointment)}
                          disabled={updatingAppointmentId === appointment.id}
                          aria-label="Apply transfer"
                          title="Apply transfer"
                          className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={onCancelTransfer}
                          disabled={updatingAppointmentId === appointment.id}
                          aria-label="Close transfer"
                          title="Close transfer"
                          className="rounded-md bg-neutral-700 p-2 text-white hover:bg-neutral-600 disabled:opacity-50"
                        >
                          <X size={14} />
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
    </>
  );
}
