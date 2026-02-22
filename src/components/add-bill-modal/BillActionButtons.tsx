interface BillActionButtonsProps {
  isEditing: boolean;
  onCancel: () => void;
  onPrint: () => void;
}

export default function BillActionButtons({ isEditing, onCancel, onPrint }: BillActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2 mt-3">
      
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-1.5 rounded-lg font-medium transition-colors border border-neutral-700"
      >
        Print Bill
      </button>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-medium transition-colors"
      >
        {isEditing ? "Update Bill" : "Save Bill"}
      </button>
    </div>
  );
}
