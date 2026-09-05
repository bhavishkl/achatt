"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { Company } from "@/lib/types";
import type { Bill } from "@/types/patient";
import type { AddBillModalProps, BillDraftItem } from "@/components/add-bill-modal/types";
import { useAppStore } from "@/lib/store";
import {
  calculateTotal,
  createItemId,
  currentTimeValue,
  getPackageByWard,
  toDraftItemsFromBill,
  toTimeInputValue,
  extractPackages,
} from "@/components/add-bill-modal/utils";
import { buildBillPrintHtml, openBillPrintWindow } from "@/components/add-bill-modal/print";
import PatientInfoCard from "@/components/add-bill-modal/PatientInfoCard";
import WardPackageSection from "@/components/add-bill-modal/WardPackageSection";
import BillItemInputRow from "@/components/add-bill-modal/BillItemInputRow";
import BillItemsList from "@/components/add-bill-modal/BillItemsList";
import BillTotalsRow from "@/components/add-bill-modal/BillTotalsRow";
import PaymentSplitSection from "@/components/add-bill-modal/PaymentSplitSection";
import BillActionButtons from "@/components/add-bill-modal/BillActionButtons";

export default function AddBillModal({
  isOpen,
  patient,
  existingBill,
  isSaving = false,
  onClose,
  onSaveBill,
}: AddBillModalProps) {
  const [billItems, setBillItems] = useState<BillDraftItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<Company | null>(null);
  const { companyId } = useAppStore();
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingBillNo, setIsLoadingBillNo] = useState(false);
  const packages = useMemo(() => extractPackages(services), [services]);

  const [concession, setConcession] = useState<number | string>(0);
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeTime, setDischargeTime] = useState("");
  const [paidCash, setPaidCash] = useState<number | string>(0);
  const [paidOnline, setPaidOnline] = useState<number | string>(0);
  const [isIpFinalBill, setIsIpFinalBill] = useState(false);
  const [billNo, setBillNo] = useState("");

  const [selectedPackageId, setSelectedPackageId] = useState<string | "">("");
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
     
    const today = new Date().toISOString().split("T")[0];
    setDischargeDate(existingBill?.dischargeDate || patient?.dischargeDate || today);

    setDischargeTime(
      toTimeInputValue(existingBill?.dischargeTime) ||
        toTimeInputValue(patient?.dischargeTime) ||
        currentTimeValue()
    );

    setPaidCash(existingBill?.paidCash ?? 0);

    setPaidOnline(existingBill?.paidOnline ?? 0);
     
    setIsIpFinalBill(existingBill?.ipBillType === "final");

    if (existingBill?.billNo) {
      setBillNo(existingBill.billNo);
    } else {
      setBillNo("");
      setIsLoadingBillNo(true);
      fetch("/api/bills/next-no")
        .then((res) => res.json())
        .then((data) => {
          if (data?.billNo) setBillNo(data.billNo);
        })
        .catch(console.error)
        .finally(() => setIsLoadingBillNo(false));
    }

    const packageFromWard = patient ? getPackageByWard(patient.wardName, packages) : null;
     
    setSelectedPackageId(prev => prev || (packageFromWard?.id ?? (packages[0]?.id ?? "")));
  }, [isOpen, existingBill, patient, packages]);

  useEffect(() => {
    if (!isOpen || !companyId) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoadingServices(true);
      try {
        const [infoRes, servicesRes] = await Promise.all([
          fetch(`/api/ipd/hospital-info?companyId=${companyId}`),
          fetch(`/api/ipd/services?companyId=${companyId}`),
        ]);

        if (infoRes.ok) {
          const infoData = await infoRes.json();
          if (isMounted && infoData) {
            setCompanyProfile({
              name: infoData.name || "",
              address: [infoData.address, infoData.city, infoData.state, infoData.pincode].filter(Boolean).join(", "),
              emailId: infoData.email || "",
              mobileNumber1: infoData.phone || "",
              mobileNumber2: infoData.altPhone || "",
            } as Company);
          }
        }

        if (servicesRes.ok) {
          const servData = await servicesRes.json();
          if (isMounted && servData) {
            setServices(servData || []);
          }
        }
      } catch (err) {
        console.error("Error loading IPD bill modal data:", err);
      } finally {
        if (isMounted) setIsLoadingServices(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, companyId]);

  const handleDescChange = (value: string) => {
    setInputDesc(value);
    const found = services.find((b) => b.name === value);
    if (found) {
      setInputRate(found.rate);
    }
  };

  const addCurrentItem = () => {
    const desc = inputDesc.trim();
    const qty = Number(inputQty);
    if (!desc || !qty) return;

    const matchedPackage = packages.find(
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

    const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId);
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
  const cashAmount = Math.max(0, Number(paidCash) || 0);
  const onlineAmount = Math.max(0, Number(paidOnline) || 0);

  const handlePrintBill = () => {
    if (!patient || billItems.length === 0) return;

    const billDate = existingBill?.date || new Date().toISOString().split("T")[0];
    const html = buildBillPrintHtml({
      patient,
      items: billItems,
      billDate,
      billNo: billNo || existingBill?.billNo,
      dischargeDate,
      dischargeTime,
      ipBillType: isIpFinalBill ? "final" : "draft",
      grossAmount: totalAmount,
      advanceUsed: autoAdvanceUsed,
      concession: concessionAmount,
      netAmount: netPayable,
      paidCash: cashAmount,
      paidOnline: onlineAmount,
      companyProfile,
    });

    openBillPrintWindow(html);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || billItems.length === 0 || isSaving) return;

    const bill: Bill = {
      id: existingBill?.id || Date.now().toString(),
      billNo: billNo || existingBill?.billNo,
      date: existingBill?.date || new Date().toISOString().split("T")[0],
      dischargeDate,
      dischargeTime,
      ipBillType: isIpFinalBill ? "final" : "draft",
      grossAmount: totalAmount,
      advanceUsed: autoAdvanceUsed,
      concession: concessionAmount,
      totalAmount: netPayable,
      paidCash: cashAmount,
      paidOnline: onlineAmount,
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg sm:text-xl font-bold">{isEditing ? "Edit Bill" : "Add Bill"}</h2>
          {billNo ? (
            <span className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1 text-sm">
              <span className="text-neutral-400 text-xs uppercase tracking-wide">Bill No</span>
              <span className="font-mono font-semibold text-emerald-400">{billNo}</span>
            </span>
          ) : isLoadingBillNo ? (
            <span className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1 text-sm text-neutral-400">
              <span className="text-xs uppercase tracking-wide">Bill No</span>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </span>
          ) : null}
        </div>

        <div className="mb-3">
          <PatientInfoCard patient={patient} />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-full min-h-0">
            <div className="xl:col-span-5 min-h-0 overflow-y-auto pr-0.5">
              <WardPackageSection
                selectedPackageId={selectedPackageId}
                packageQty={packageQty}
                packages={packages}
                isLoading={isLoadingServices}
                onSelectPackage={setSelectedPackageId}
                onChangeQty={setPackageQty}
                onAddPackage={addSelectedPackage}
              />

              <BillItemInputRow
                inputDesc={inputDesc}
                inputRate={inputRate}
                inputQty={inputQty}
                descRef={descRef}
                services={services}
                packages={packages}
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Discharge Date</label>
                    <input
                      type="date"
                      value={dischargeDate}
                      onChange={(e) => setDischargeDate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Discharge Time</label>
                    <input
                      type="time"
                      value={dischargeTime}
                      onChange={(e) => setDischargeTime(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white"
                    />
                  </div>
                </div>
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

              <PaymentSplitSection
                paidCash={paidCash}
                paidOnline={paidOnline}
                netPayable={netPayable}
                onChangeCash={setPaidCash}
                onChangeOnline={setPaidOnline}
              />
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

                <BillActionButtons isEditing={isEditing} isSaving={isSaving} onCancel={onClose} onPrint={handlePrintBill} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
