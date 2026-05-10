import { ChevronDown } from "lucide-react";
import { TimeSlot } from "./types";
import { formatSessionLabel } from "./utils";

type AppointmentStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  notConfirmed: number;
};

type SessionHeaderProps = {
  activeSession: TimeSlot;
  stats: AppointmentStats;
  onSessionChange: (value: TimeSlot) => void;
};

export function SessionHeader({
  activeSession,
  stats,
  onSessionChange,
}: SessionHeaderProps) {
  return (
    <div className="border-b border-neutral-800 bg-neutral-950/70 px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <select
            value={activeSession}
            onChange={(e) => onSessionChange(e.target.value as TimeSlot)}
            className="appearance-none rounded-md border border-neutral-700 bg-neutral-900 py-1.5 pl-3 pr-8 text-base font-semibold text-white outline-none focus:border-blue-500"
          >
            <option value="morning">{formatSessionLabel("morning")}</option>
            <option value="evening">{formatSessionLabel("evening")}</option>
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-neutral-300">
          <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5">
            {stats.total}
          </span>
          <span className="rounded-full border border-emerald-700/40 bg-emerald-900/20 px-2.5 py-0.5 text-emerald-300">
            ✓ {stats.confirmed}
          </span>
          <span className="rounded-full border border-red-700/40 bg-red-900/20 px-2.5 py-0.5 text-red-300">
            ✗ {stats.cancelled}
          </span>
          <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2.5 py-0.5 text-amber-300">
            ? {stats.notConfirmed}
          </span>
        </div>
      </div>
    </div>
  );
}
