import { Loader2 } from "lucide-react";

interface BillActionButtonsProps {
  isEditing: boolean;
  isSaving?: boolean;
  onCancel: () => void;
}

export default function BillActionButtons({ isEditing, isSaving = false, onCancel }: BillActionButtonsProps) {
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
        type="submit"
        disabled={isSaving}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          isEditing ? "Update & Print Bill" : "Save & Print Bill"
        )}
      </button>
    </div>
  );
}
