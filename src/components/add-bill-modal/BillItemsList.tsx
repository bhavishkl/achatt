import type { BillDraftItem } from "@/components/add-bill-modal/types";

interface BillItemsListProps {
  items: BillDraftItem[];
  onRemoveItem: (id: string) => void;
}

export default function BillItemsList({ items, onRemoveItem }: BillItemsListProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-1">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
          No items added yet. Use package or item entry above.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-neutral-950/50 border border-neutral-800 rounded-lg px-3 py-2.5 group hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-neutral-600 font-mono w-6">{index + 1}.</span>
                <span className="text-sm text-white font-medium truncate">{item.description}</span>
                <span className="text-xs text-neutral-500 whitespace-nowrap">
                  Rs {item.rate.toFixed(2)} x {item.quantity}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-neutral-300 whitespace-nowrap">
                  Rs {(item.rate * item.quantity).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                  title="Remove item"
                >
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
