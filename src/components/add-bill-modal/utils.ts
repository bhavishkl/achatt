import { WARD_BILL_PACKAGES } from "@/lib/constants";
import type { Bill } from "@/types/patient";
import type { BillDraftItem } from "@/components/add-bill-modal/types";

export function createItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPackageByWard(wardName: string) {
  const normalizedWard = wardName.toLowerCase();
  return WARD_BILL_PACKAGES.find((pkg) =>
    pkg.wardKeywords.some((keyword) => normalizedWard.includes(keyword))
  );
}

export function getStoredUserId() {
  return sessionStorage.getItem("userId") ?? localStorage.getItem("userId") ?? null;
}

export function toDraftItemsFromBill(existingBill: Bill | null | undefined): BillDraftItem[] {
  if (!existingBill || existingBill.items.length === 0) {
    return [];
  }

  return existingBill.items.map((item) => ({
    id: item.id,
    description: item.description,
    rate: item.rate,
    quantity: item.quantity,
  }));
}

export function calculateTotal(items: BillDraftItem[]) {
  return items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
}
