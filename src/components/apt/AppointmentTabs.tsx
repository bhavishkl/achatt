import { formatTabDate } from "./utils";

type AppointmentStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  notConfirmed: number;
};

type AppointmentTabsProps = {
  appointmentDates: string[];
  activeDateTab: string;
  isExporting: boolean;
  hasActiveAppointments: boolean;
  activeStats: AppointmentStats;
  onDateTabChange: (value: string) => void;
  onExportPdf: () => void;
  onSharePdf: () => void;
};

export function AppointmentTabs({
  appointmentDates,
  activeDateTab,
  isExporting,
  hasActiveAppointments,
  activeStats,
  onDateTabChange,
  onExportPdf,
  onSharePdf,
}: AppointmentTabsProps) {
  if (appointmentDates.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-neutral-800 bg-neutral-950/70 px-3 pt-3">
      <div className="flex flex-col gap-3 pb-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-wrap gap-2">
          {appointmentDates.map((appointmentDate) => {
            const isActive = appointmentDate === activeDateTab;

            return (
              <button
                key={appointmentDate}
                type="button"
                onClick={() => onDateTabChange(appointmentDate)}
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
            onClick={onExportPdf}
            disabled={isExporting || !hasActiveAppointments}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? "Working..." : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={onSharePdf}
            disabled={isExporting || !hasActiveAppointments}
            className="rounded-md bg-neutral-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Share
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-3 text-xs text-neutral-300">
        <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1">
          Total: {activeStats.total}
        </span>
        <span className="rounded-full border border-emerald-700/40 bg-emerald-900/20 px-3 py-1 text-emerald-300">
          Confirmed: {activeStats.confirmed}
        </span>
        <span className="rounded-full border border-red-700/40 bg-red-900/20 px-3 py-1 text-red-300">
          Cancelled: {activeStats.cancelled}
        </span>
        <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-3 py-1 text-amber-300">
          Not Confirm: {activeStats.notConfirmed}
        </span>
      </div>
    </div>
  );
}
