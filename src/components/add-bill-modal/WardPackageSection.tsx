import { WARD_BILL_PACKAGES } from "@/lib/constants";

interface WardPackageSectionProps {
  selectedPackageId: string;
  packageQty: number | string;
  onSelectPackage: (value: string) => void;
  onChangeQty: (value: number | string) => void;
  onAddPackage: () => void;
}

export default function WardPackageSection({
  selectedPackageId,
  packageQty,
  onSelectPackage,
  onChangeQty,
  onAddPackage,
}: WardPackageSectionProps) {
  if (WARD_BILL_PACKAGES.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-2.5">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Ward Package</label>
          <select
            value={selectedPackageId}
            onChange={(e) => onSelectPackage(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
          >
            {WARD_BILL_PACKAGES.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium"
        >
          Add Package
        </button>
      </div>
      <p className="text-xs text-neutral-600 mt-1.5">
        Adds all package charges in one action. You can still add line items individually below.
      </p>
    </div>
  );
}
