type AppointmentAlertsProps = {
  error: string;
  message: string;
  isLoading: boolean;
};

export function AppointmentAlerts({ error, message, isLoading }: AppointmentAlertsProps) {
  return (
    <>
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
    </>
  );
}
