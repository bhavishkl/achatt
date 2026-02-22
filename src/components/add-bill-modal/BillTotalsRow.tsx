interface BillTotalsRowProps {
  itemCount: number;
  grossAmount: number;
  advanceUsed: number;
  concession: number;
  totalAmount: number;
}

export default function BillTotalsRow({ itemCount, grossAmount, advanceUsed, concession, totalAmount }: BillTotalsRowProps) {
  return (
    <div className="pt-2.5 border-t border-neutral-800 flex justify-between items-center">
      <div className="text-xs text-neutral-500">
        {itemCount} item{itemCount !== 1 ? "s" : ""}
      </div>
      <div className="text-right">
        <div className="text-sm text-neutral-400">
          Gross: Rs {grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {advanceUsed > 0 && (
          <div className="text-sm text-emerald-400">
            Advance Deducted: Rs {advanceUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        {concession > 0 && (
          <div className="text-sm text-amber-400">
            Concession: Rs {concession.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <div>
          <span className="text-neutral-400 text-sm uppercase tracking-wider mr-4">
            Net Payable
          </span>
          <span className="text-2xl font-bold text-white">
            Rs{" "}
            {totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
