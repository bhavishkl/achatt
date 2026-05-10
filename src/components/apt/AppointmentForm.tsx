import { TimeSlot } from "./types";
import { formatSessionLabel } from "./utils";

type AppointmentFormProps = {
  name: string;
  phone: string;
  place: string;
  date: string;
  timeSlot: TimeSlot;
  phoneError: string;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  onPlaceChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeSlotChange: (value: TimeSlot) => void;
};

const TIME_SLOTS: TimeSlot[] = ["morning", "evening"];

export function AppointmentForm({
  name,
  phone,
  place,
  date,
  timeSlot,
  phoneError,
  onSubmit,
  onNameChange,
  onPhoneChange,
  onPhoneBlur,
  onPlaceChange,
  onDateChange,
  onTimeSlotChange,
}: AppointmentFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-neutral-300">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-300">Phone Number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={onPhoneBlur}
            required
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            className={`w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500 ${
              phoneError ? "border-red-500" : "border-neutral-700"
            } bg-neutral-950`}
          />
          {phoneError && <span className="mt-1 block text-xs text-red-400">{phoneError}</span>}
          
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-300">Place</span>
          <input
            type="text"
            value={place}
            onChange={(e) => onPlaceChange(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-300">Appointment Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <div className="text-sm">
          <span className="mb-1 block text-neutral-300">Session</span>
          <div className="flex gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSlotChange(slot)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                  timeSlot === slot
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                {formatSessionLabel(slot)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 sm:w-auto"
      >
        Save Appointment
      </button>
    </form>
  );
}
