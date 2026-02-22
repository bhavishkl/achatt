interface AdvanceSectionProps {
  availableAdvance: number;
  grossAmount: number;
  advanceToDeduct: number | string;
  onChangeAdvanceToDeduct: (value: number | string) => void;
}

export default function AdvanceSection({
  availableAdvance,
  grossAmount,
  advanceToDeduct,
  onChangeAdvanceToDeduct,
}: AdvanceSectionProps) {
  if (availableAdvance <= 0) {
    return null;
  }

  return (
    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="text-sm text-emerald-300">
          Available Advance: <span className="font-semibold">Rs {availableAdvance.toFixed(2)}</span>
        </div>
        <div className="w-52">
          <label className="block text-xs text-emerald-300/80 mb-1">Deduct Advance</label>
          <input
            type="number"
            min="0"
            max={Math.min(availableAdvance, grossAmount)}
            step="0.01"
            value={advanceToDeduct}
            onChange={(e) => onChangeAdvanceToDeduct(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full bg-neutral-950 border border-emerald-900/40 rounded p-2 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-emerald-300/70 mt-2">
        This amount will be deducted from the patient advance and applied to this bill.
      </p>
    </div>
  );
}
