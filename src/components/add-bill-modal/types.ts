import type { Bill, BillItem, Patient } from "@/types/patient";

export interface AddBillModalProps {
  isOpen: boolean;
  patient: Patient | null;
  existingBill?: Bill | null;
  onClose: () => void;
  onSaveBill: (patientId: string, bill: Bill) => void;
}

export type BillDraftItem = Omit<BillItem, "amount">;
