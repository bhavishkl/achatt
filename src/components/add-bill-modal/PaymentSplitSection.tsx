interface PaymentSplitSectionProps {
  paidCash: number | string;
  paidOnline: number | string;
  netPayable: number;
  onChangeCash: (value: number | string) => void;
  onChangeOnline: (value: number | string) => void;
}

const formatAmount = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaymentSplitSection({
  paidCash,
  paidOnline,
  netPayable,
  onChangeCash,
  onChangeOnline,
}: PaymentSplitSectionProps) {
  const cash = Number(paidCash) || 0;
  const online = Number(paidOnline) || 0;
  const collected = cash + online;
  const difference = netPayable - collected;

  return (
    <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-2.5 mb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-blue-300/80">Payment Received</span>
        <button
          type="button"
          onClick={() => {
            onChangeCash(netPayable);
            onChangeOnline(0);
          }}
          className="text-[11px] text-blue-300 hover:text-white border border-blue-900/60 rounded px-1.5 py-0.5 transition-colors"
        >
          All cash
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Cash Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={paidCash}
            onChange={(e) => onChangeCash(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full bg-neutral-950 border border-blue-900/40 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Online Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={paidOnline}
            onChange={(e) => onChangeOnline(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full bg-neutral-950 border border-blue-900/40 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5 text-xs">
        <span className="text-neutral-500">Collected: Rs {formatAmount(collected)}</span>
        {Math.abs(difference) < 0.01 ? (
          <span className="text-emerald-400">Matches net payable</span>
        ) : difference > 0 ? (
          <span className="text-amber-400">Balance: Rs {formatAmount(difference)}</span>
        ) : (
          <span className="text-red-400">Excess: Rs {formatAmount(Math.abs(difference))}</span>
        )}
      </div>
    </div>
  );
}
