import { Loader2 } from "lucide-react";

interface WardPackageSectionProps {
  selectedPackageId: string | "";
  packageQty: number | string;
  packages: any[];
  isLoading?: boolean;
  onSelectPackage: (value: string | "") => void;
  onChangeQty: (value: number | string) => void;
  onAddPackage: () => void;
}

export default function WardPackageSection({
  selectedPackageId,
  packageQty,
  packages,
  isLoading = false,
  onSelectPackage,
  onChangeQty,
  onAddPackage,
}: WardPackageSectionProps) {
  return (
    <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-2.5">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Ward Package</label>
          <select
            value={selectedPackageId}
            onChange={(e) => onSelectPackage(e.target.value)}
            disabled={isLoading}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
          >
            {isLoading ? (
              <option value="">Loading packages…</option>
            ) : packages.length === 0 ? (
              <option value="">No packages available</option>
            ) : (
              packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="w-20">
          <label className="block text-xs text-neutral-500 mb-1">Qty</label>
          <input
            type="number"
            min="1"
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            value={packageQty}
            onChange={(e) => onChangeQty(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <button
          type="button"
          onClick={onAddPackage}
          disabled={isLoading || packages.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Add Package
        </button>
      </div>
    </div>
  );
}
