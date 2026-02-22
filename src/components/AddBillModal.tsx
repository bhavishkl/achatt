"use client";

import { useEffect, useRef, useState } from "react";
import { Patient, Bill, BillItem } from "@/types/patient";
import { BILLABLE_ITEMS, WARD_BILL_PACKAGES } from "@/lib/constants";
import type { Company } from "@/lib/types";

interface AddBillModalProps {
    isOpen: boolean;
    patient: Patient | null;
    existingBill?: Bill | null;
    onClose: () => void;
    onSaveBill: (patientId: string, bill: Bill) => void;
}

function createItemId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPackageByWard(wardName: string) {
    const normalizedWard = wardName.toLowerCase();
    return WARD_BILL_PACKAGES.find((pkg) =>
        pkg.wardKeywords.some((keyword) => normalizedWard.includes(keyword))
    );
}

function getStoredUserId() {
    return sessionStorage.getItem("userId") ?? localStorage.getItem("userId") ?? null;
}

export default function AddBillModal({
    isOpen,
    patient,
    existingBill,
    onClose,
    onSaveBill,
}: AddBillModalProps) {
    const [billItems, setBillItems] = useState<Omit<BillItem, "amount">[]>([]);
    const [companyProfile, setCompanyProfile] = useState<Company | null>(null);

    const [selectedPackageId, setSelectedPackageId] = useState<string>(WARD_BILL_PACKAGES[0]?.id ?? "");
    const [packageQty, setPackageQty] = useState<number | string>(1);

    const [inputDesc, setInputDesc] = useState("");
    const [inputRate, setInputRate] = useState<number | string>("");
    const [inputQty, setInputQty] = useState<number | string>(1);
    const descRef = useRef<HTMLInputElement>(null);

    const addItemLine = (description: string, rate: number, quantity: number) => {
        const newItem: Omit<BillItem, "amount"> = {
            id: createItemId(),
            description,
            rate,
            quantity,
        };
        setBillItems((prev) => [...prev, newItem]);
    };

    useEffect(() => {
        if (isOpen) {
            if (existingBill && existingBill.items.length > 0) {
                setBillItems(
                    existingBill.items.map((item) => ({
                        id: item.id,
                        description: item.description,
                        rate: item.rate,
                        quantity: item.quantity,
                    }))
                );
            } else {
                setBillItems([]);
            }

            setInputDesc("");
            setInputRate("");
            setInputQty(1);
            setPackageQty(1);

            const packageFromWard = patient ? getPackageByWard(patient.wardName) : null;
            setSelectedPackageId(packageFromWard?.id ?? WARD_BILL_PACKAGES[0]?.id ?? "");
        }
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

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addCurrentItem();
        }
    };

    const addCurrentItem = () => {
        const desc = inputDesc.trim();
        const qty = Number(inputQty);
        if (!desc || !qty) return;

        // If a package name is entered, add all package lines in one go.
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

    const calculateTotal = () => {
        return billItems.reduce((sum, item) => sum + item.rate * item.quantity, 0);
    };

    const handlePrintBill = () => {
        if (!patient || billItems.length === 0) return;

        const total = calculateTotal();
        const billDate = existingBill?.date || new Date().toISOString().split("T")[0];
        const companyName = companyProfile?.name || patient.hospitalName || "Hospital";
        const companyAddress = companyProfile?.address || "";
        const companyEmail = companyProfile?.emailId || "";
        const companyMobile1 = companyProfile?.mobileNumber1 || "";
        const companyMobile2 = companyProfile?.mobileNumber2 || "";
        const companyOwner = companyProfile?.ownerName || "";

        const itemsRows = billItems
            .map(
                (item, i) => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.description}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">Rs ${item.rate.toFixed(2)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">Rs ${(item.rate * item.quantity).toFixed(2)}</td>
            </tr>
        `
            )
            .join("");

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - ${patient.name} - ${billDate}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
                .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
                .header p { font-size: 12px; color: #666; }
                .bill-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
                .bill-meta div { line-height: 1.6; }
                .bill-meta .label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                .bill-meta .value { font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                thead th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #d1d5db; }
                thead th:first-child { text-align: center; }
                thead th:nth-child(3), thead th:nth-child(5) { text-align: right; }
                thead th:nth-child(4) { text-align: center; }
                .total-row td { border-top: 2px solid #1a1a1a; padding: 12px; font-size: 15px; font-weight: 700; }
                .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; }
                @media print {
                    body { padding: 16px; }
                    @page { margin: 12mm; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${companyName}</h1>
                <p>Patient Bill / Invoice</p>
                ${companyAddress ? `<p>${companyAddress}</p>` : ""}
                ${companyOwner ? `<p>Owner: ${companyOwner}</p>` : ""}
                ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ""}
                ${(companyMobile1 || companyMobile2) ? `<p>Mobile: ${[companyMobile1, companyMobile2].filter(Boolean).join(", ")}</p>` : ""}
            </div>

            <div class="bill-meta">
                <div>
                    <div class="label">Patient</div>
                    <div class="value">${patient.prefix} ${patient.name}</div>
                    <div>${patient.gender}, ${patient.age} Yrs</div>
                    <div>Reg: ${patient.regNo}</div>
                </div>
                <div>
                    <div class="label">Ward / Bed</div>
                    <div class="value">${patient.wardName} - Bed ${patient.bedNo}</div>
                    <div class="label" style="margin-top:8px">Doctor</div>
                    <div class="value">${patient.doctorName}</div>
                </div>
                <div style="text-align:right">
                    <div class="label">Bill Date</div>
                    <div class="value">${billDate}</div>
                    <div class="label" style="margin-top:8px">Admission</div>
                    <div class="value">${patient.admissionDate}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:40px">#</th>
                        <th>Description</th>
                        <th style="width:100px;text-align:right">Rate</th>
                        <th style="width:60px;text-align:center">Qty</th>
                        <th style="width:120px;text-align:right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    <tr class="total-row">
                        <td colspan="4" style="text-align:right">Total Amount</td>
                        <td style="text-align:right">Rs ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <p>This is a computer-generated bill.</p>
            </div>
        </body>
        </html>
        `;

        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patient || billItems.length === 0) return;

        const totalAmount = calculateTotal();
        const bill: Bill = {
            id: existingBill?.id || Date.now().toString(),
            date: existingBill?.date || new Date().toISOString().split("T")[0],
            totalAmount,
            items: billItems.map((item) => ({
                ...item,
                amount: item.rate * item.quantity,
            })),
        };

        onSaveBill(patient.id, bill);
        onClose();
    };

    const isEditing = !!existingBill;

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 w-full max-w-4xl shadow-2xl h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Bill" : "Add Bill"}</h2>

                <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Patient</label>
                        <div className="font-medium text-white">
                            {patient.prefix} {patient.name}
                        </div>
                        <div className="text-neutral-400 text-xs">{patient.regNo}</div>
                    </div>
                    <div>
                        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Admission</label>
                        <div className="text-neutral-300">
                            {patient.wardName}, Bed {patient.bedNo}
                        </div>
                        <div className="text-neutral-400 text-xs">{patient.admissionDate}</div>
                    </div>
                    <div>
                        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Doctor</label>
                        <div className="text-neutral-300">{patient.doctorName}</div>
                        <div className="text-neutral-400 text-xs">{patient.hospitalName}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    {WARD_BILL_PACKAGES.length > 0 && (
                        <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 mb-3">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-neutral-500 mb-1">Ward Package</label>
                                    <select
                                        value={selectedPackageId}
                                        onChange={(e) => setSelectedPackageId(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
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
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={packageQty}
                                        onChange={(e) =>
                                            setPackageQty(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addSelectedPackage}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium"
                                >
                                    Add Package
                                </button>
                            </div>
                            <p className="text-xs text-neutral-600 mt-2">
                                Adds all package charges in one action. You can still add line items individually below.
                            </p>
                        </div>
                    )}

                    <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 mb-4">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-neutral-500 mb-1">Item / Description</label>
                                <input
                                    ref={descRef}
                                    list="billable-items"
                                    type="text"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                    placeholder="Select or type item/package..."
                                    value={inputDesc}
                                    onChange={(e) => handleDescChange(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <datalist id="billable-items">
                                    {BILLABLE_ITEMS.map((opt) => (
                                        <option key={opt.id} value={opt.name}>
                                            {opt.name} - Rs {opt.rate}
                                        </option>
                                    ))}
                                    {WARD_BILL_PACKAGES.map((pkg) => (
                                        <option key={pkg.id} value={pkg.name}>
                                            {pkg.name} - Package
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="w-28">
                                <label className="block text-xs text-neutral-500 mb-1">Rate</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                    value={inputRate}
                                    onChange={(e) =>
                                        setInputRate(e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="0"
                                />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs text-neutral-500 mb-1">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                    value={inputQty}
                                    onChange={(e) =>
                                        setInputQty(e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="1"
                                />
                            </div>
                            <div className="w-24 text-right text-sm font-medium text-neutral-400 pb-2">
                                Rs {(Number(inputRate) * Number(inputQty) || 0).toFixed(2)}
                            </div>
                        </div>
                        <p className="text-xs text-neutral-600 mt-2">
                            Fill all fields and press{" "}
                            <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400 text-xs border border-neutral-700">
                                Enter
                            </kbd>{" "}
                            to add item or package.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {billItems.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
                                No items added yet. Use package or item entry above.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {billItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-3 group hover:border-neutral-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
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
                                                onClick={() => removeItem(item.id)}
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

                    <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
                        <div className="text-xs text-neutral-500">
                            {billItems.length} item{billItems.length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-right">
                            <span className="text-neutral-400 text-sm uppercase tracking-wider mr-4">
                                Total Bill Amount
                            </span>
                            <span className="text-2xl font-bold text-white">
                                Rs{" "}
                                {calculateTotal().toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePrintBill}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-5 py-2 rounded-lg font-medium transition-colors border border-neutral-700"
                        >
                            Print Bill
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isEditing ? "Update Bill" : "Save Bill"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
