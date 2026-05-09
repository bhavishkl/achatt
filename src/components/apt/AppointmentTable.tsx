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
    <table className="w-full text-sm">
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
  );
}
