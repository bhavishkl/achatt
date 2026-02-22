import type { KeyboardEvent, RefObject } from "react";
import { BILLABLE_ITEMS, WARD_BILL_PACKAGES } from "@/lib/constants";

interface BillItemInputRowProps {
  inputDesc: string;
  inputRate: number | string;
  inputQty: number | string;
  descRef: RefObject<HTMLInputElement | null>;
  onDescChange: (value: string) => void;
  onRateChange: (value: number | string) => void;
  onQtyChange: (value: number | string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

export default function BillItemInputRow({
  inputDesc,
  inputRate,
  inputQty,
  descRef,
  onDescChange,
  onRateChange,
  onQtyChange,
  onKeyDown,
}: BillItemInputRowProps) {
  return (
    <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-2.5">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Item / Description</label>
          <input
            ref={descRef}
            list="billable-items"
            type="text"
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            placeholder="Select or type item/package..."
            value={inputDesc}
            onChange={(e) => onDescChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <datalist id="billable-items">
            {BILLABLE_ITEMS.map((opt) => (
              <option key={opt.id} value={opt.name}>
                {opt.name} - Rs {opt.rate}
              </option>
            ))}
            {WARD_BILL_PACKAGES.map((pkg) => (
              <option key={pkg.id} value={pkg.name}>
                {pkg.name} - Package
              </option>
            ))}
          </datalist>
        </div>
        <div className="w-28">
          <label className="block text-xs text-neutral-500 mb-1">Rate</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            value={inputRate}
            onChange={(e) => onRateChange(e.target.value === "" ? "" : Number(e.target.value))}
            onKeyDown={onKeyDown}
            placeholder="0"
          />
        </div>
        <div className="w-20">
          <label className="block text-xs text-neutral-500 mb-1">Qty</label>
          <input
            type="number"
            min="1"
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            value={inputQty}
            onChange={(e) => onQtyChange(e.target.value === "" ? "" : Number(e.target.value))}
            onKeyDown={onKeyDown}
            placeholder="1"
          />
        </div>
        <div className="w-24 text-right text-sm font-medium text-neutral-400 pb-2">
          Rs {(Number(inputRate) * Number(inputQty) || 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
