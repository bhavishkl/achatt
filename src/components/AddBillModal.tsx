"use client";

import { useEffect, useRef, useState } from "react";
import type { Company } from "@/lib/types";
import { BILLABLE_ITEMS, WARD_BILL_PACKAGES } from "@/lib/constants";
import type { Bill } from "@/types/patient";
import type { AddBillModalProps, BillDraftItem } from "@/components/add-bill-modal/types";
import {
  calculateTotal,
  createItemId,
  getPackageByWard,
  getStoredUserId,
  toDraftItemsFromBill,
} from "@/components/add-bill-modal/utils";
import { buildBillPrintHtml, openBillPrintWindow } from "@/components/add-bill-modal/print";
import PatientInfoCard from "@/components/add-bill-modal/PatientInfoCard";
import WardPackageSection from "@/components/add-bill-modal/WardPackageSection";
import BillItemInputRow from "@/components/add-bill-modal/BillItemInputRow";
import BillItemsList from "@/components/add-bill-modal/BillItemsList";
import BillTotalsRow from "@/components/add-bill-modal/BillTotalsRow";
import BillActionButtons from "@/components/add-bill-modal/BillActionButtons";

export default function AddBillModal({
  isOpen,
  patient,
  existingBill,
  onClose,
  onSaveBill,
}: AddBillModalProps) {
  const [billItems, setBillItems] = useState<BillDraftItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<Company | null>(null);
  const [concession, setConcession] = useState<number | string>(0);
  const [dischargeDate, setDischargeDate] = useState("");
  const [isIpFinalBill, setIsIpFinalBill] = useState(false);

  const [selectedPackageId, setSelectedPackageId] = useState<number | "">(WARD_BILL_PACKAGES[0]?.id ?? "");
  const [packageQty, setPackageQty] = useState<number | string>(1);

  const [inputDesc, setInputDesc] = useState("");
  const [inputRate, setInputRate] = useState<number | string>("");
  const [inputQty, setInputQty] = useState<number | string>(1);
  const descRef = useRef<HTMLInputElement>(null);

  const addItemLine = (description: string, rate: number, quantity: number) => {
    const newItem: BillDraftItem = {
      id: createItemId(),
      description,
      rate,
      quantity,
    };
    setBillItems((prev) => [...prev, newItem]);
  };

  useEffect(() => {
    if (!isOpen) return;

    setBillItems(toDraftItemsFromBill(existingBill));
    setInputDesc("");
    setInputRate("");
    setInputQty(1);
    setPackageQty(1);
    setConcession(existingBill?.concession ?? 0);
    setDischargeDate(existingBill?.dischargeDate ?? patient?.dischargeDate ?? "");
    setIsIpFinalBill(existingBill?.ipBillType === "final");

    const packageFromWard = patient ? getPackageByWard(patient.wardName) : null;
    setSelectedPackageId(packageFromWard?.id ?? WARD_BILL_PACKAGES[0]?.id ?? "");
  }, [isOpen, existingBill, patient]);

  useEffect(() => {
    if (!isOpen) return;

    const userId = getStoredUserId();
    if (!userId) {
      setCompanyProfile(null);
      return;
    }

    const loadCompanyProfile = async () => {
      try {
        const response = await fetch(`/api/user/company?userId=${userId}`);
        const data = await response.json();
        if (!response.ok) {
          setCompanyProfile(null);
          return;
        }
        setCompanyProfile(data.company ?? null);
      } catch {
        setCompanyProfile(null);
      }
    };

    loadCompanyProfile();
  }, [isOpen]);

  const handleDescChange = (value: string) => {
    setInputDesc(value);
    const found = BILLABLE_ITEMS.find((b) => b.name === value);
    if (found) {
      setInputRate(found.rate);
    }
  };

  const addCurrentItem = () => {
    const desc = inputDesc.trim();
    const qty = Number(inputQty);
    if (!desc || !qty) return;

    const matchedPackage = WARD_BILL_PACKAGES.find(
      (pkg) => pkg.name.toLowerCase() === desc.toLowerCase()
    );

    if (matchedPackage) {
      matchedPackage.items.forEach((item) => {
        addItemLine(item.name, item.rate, qty);
      });
      setInputDesc("");
      setInputRate("");
      setInputQty(1);
      descRef.current?.focus();
      return;
    }

    const rate = Number(inputRate);
    if (!rate) return;

    addItemLine(desc, rate, qty);
    setInputDesc("");
    setInputRate("");
    setInputQty(1);
    descRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCurrentItem();
    }
  };

  const addSelectedPackage = () => {
    const qty = Number(packageQty);
    if (!selectedPackageId || !qty) return;

    const selectedPackage = WARD_BILL_PACKAGES.find((pkg) => pkg.id === selectedPackageId);
    if (!selectedPackage) return;

    selectedPackage.items.forEach((item) => {
      addItemLine(item.name, item.rate, qty);
    });
  };

  const removeItem = (id: string) => {
    setBillItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = calculateTotal(billItems);
  const availableAdvance = Math.max(
    0,
    (patient?.advanceBalance ?? 0) + (existingBill?.advanceUsed ?? 0)
  );
  const autoAdvanceUsed = Math.min(availableAdvance, totalAmount);
  const concessionAmount = Math.min(
    Number(concession) || 0,
    Math.max(0, totalAmount - autoAdvanceUsed)
  );
  const netPayable = Math.max(0, totalAmount - autoAdvanceUsed - concessionAmount);

  const handlePrintBill = () => {
    if (!patient || billItems.length === 0) return;

    const billDate = existingBill?.date || new Date().toISOString().split("T")[0];
    const html = buildBillPrintHtml({
      patient,
      items: billItems,
      billDate,
      dischargeDate,
      ipBillType: isIpFinalBill ? "final" : "draft",
      grossAmount: totalAmount,
      advanceUsed: autoAdvanceUsed,
      concession: concessionAmount,
      netAmount: netPayable,
      companyProfile,
    });

    openBillPrintWindow(html);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || billItems.length === 0) return;

    const bill: Bill = {
      id: existingBill?.id || Date.now().toString(),
      date: existingBill?.date || new Date().toISOString().split("T")[0],
      dischargeDate,
      ipBillType: isIpFinalBill ? "final" : "draft",
      grossAmount: totalAmount,
      advanceUsed: autoAdvanceUsed,
      concession: concessionAmount,
      totalAmount: netPayable,
      items: billItems.map((item) => ({
        ...item,
        amount: item.rate * item.quantity,
      })),
    };

    try {
      await onSaveBill(patient.id, bill);
      onClose();
    } catch {
      // Error state is displayed by the parent page.
    }
  };

  const isEditing = !!existingBill;

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-black/80 p-2 sm:p-3 z-50 backdrop-blur-sm overflow-hidden">
      <div className="mx-auto bg-neutral-900 rounded-xl border border-neutral-800 w-full max-w-[1320px] shadow-2xl h-[96vh] flex flex-col p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold mb-2">{isEditing ? "Edit Bill" : "Add Bill"}</h2>

        <div className="mb-3">
          <PatientInfoCard patient={patient} />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-full min-h-0">
            <div className="xl:col-span-5 min-h-0 overflow-y-auto pr-0.5">
              <WardPackageSection
                selectedPackageId={selectedPackageId}
                packageQty={packageQty}
                onSelectPackage={setSelectedPackageId}
                onChangeQty={setPackageQty}
                onAddPackage={addSelectedPackage}
              />

              <BillItemInputRow
                inputDesc={inputDesc}
                inputRate={inputRate}
                inputQty={inputQty}
                descRef={descRef}
                onDescChange={handleDescChange}
                onRateChange={setInputRate}
                onQtyChange={setInputQty}
                onKeyDown={handleInputKeyDown}
              />

              {availableAdvance > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2.5 mb-2 mt-2">
                  <div className="text-sm text-emerald-300">
                    Advance Available: <span className="font-semibold">Rs {availableAdvance.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-2.5 mb-2">
                <label className="block text-xs text-amber-300/80 mb-1">Concession</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={Math.max(0, totalAmount - autoAdvanceUsed)}
                  value={concession}
                  onChange={(e) => setConcession(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-amber-900/40 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-600 outline-none"
                  placeholder="Enter concession amount"
                />
              </div>

              <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-2.5 mb-2">
                <label className="block text-xs text-neutral-400 mb-1">Discharge Date</label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white"
                />
                <label className="flex items-center gap-2 mt-3 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={isIpFinalBill}
                    onChange={(e) => setIsIpFinalBill(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500"
                  />
                  IP Final Bill
                </label>
              </div>
            </div>

            <div className="xl:col-span-7 min-h-0 flex flex-col">
              <BillItemsList items={billItems} onRemoveItem={removeItem} />

              <div className="pt-2 border-t border-neutral-800 mt-2">
                <BillTotalsRow
                  itemCount={billItems.length}
                  grossAmount={totalAmount}
                  advanceUsed={autoAdvanceUsed}
                  concession={concessionAmount}
                  totalAmount={netPayable}
                />

                <BillActionButtons isEditing={isEditing} onCancel={onClose} onPrint={handlePrintBill} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
