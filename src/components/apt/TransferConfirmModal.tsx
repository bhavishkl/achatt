import { PendingTransfer } from "./types";
import { formatSessionLabel } from "./utils";

type TransferConfirmModalProps = {
  pendingTransfer: PendingTransfer | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function TransferConfirmModal({
  pendingTransfer,
  onCancel,
  onConfirm,
}: TransferConfirmModalProps) {
  if (!pendingTransfer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="mb-2 text-lg font-semibold">Transfer Appointment?</h2>
        <p className="mb-5 text-sm text-neutral-300">
          This patient already has an appointment on{" "}
          <span className="font-medium text-white">{pendingTransfer.fromDate} ({formatSessionLabel(pendingTransfer.fromTimeSlot)})</span>. Transfer it
          to <span className="font-medium text-white">{pendingTransfer.toDate} ({formatSessionLabel(pendingTransfer.toTimeSlot)})</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
