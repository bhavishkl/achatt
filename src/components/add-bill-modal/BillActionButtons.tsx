import { Loader2 } from "lucide-react";

interface BillActionButtonsProps {
  isEditing: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onPrint: () => void;
}

export default function BillActionButtons({ isEditing, isSaving = false, onCancel, onPrint }: BillActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2 mt-3">

      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onPrint}
        disabled={isSaving}
        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-1.5 rounded-lg font-medium transition-colors border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Print Bill
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          isEditing ? "Update Bill" : "Save Bill"
        )}
      </button>
    </div>
  );
}
