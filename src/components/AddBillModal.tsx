"use client";

import { useEffect, useRef, useState } from "react";
import { Patient, Bill, BillItem } from "@/types/patient";
import { BILLABLE_ITEMS } from "@/lib/constants";

interface AddBillModalProps {
    isOpen: boolean;
    patient: Patient | null;
    existingBill?: Bill | null;
    onClose: () => void;
    onSaveBill: (patientId: string, bill: Bill) => void;
}

export default function AddBillModal({
    isOpen,
    patient,
    existingBill,
    onClose,
    onSaveBill,
}: AddBillModalProps) {
    const [billItems, setBillItems] = useState<Omit<BillItem, 'amount'>[]>([]);

    // Single input row state
    const [inputDesc, setInputDesc] = useState('');
    const [inputRate, setInputRate] = useState<number | string>('');
    const [inputQty, setInputQty] = useState<number | string>(1);
    const descRef = useRef<HTMLInputElement>(null);

    // Populate when opening
    useEffect(() => {
        if (isOpen) {
            if (existingBill && existingBill.items.length > 0) {
                setBillItems(existingBill.items.map(item => ({
                    id: item.id,
                    description: item.description,
                    rate: item.rate,
                    quantity: item.quantity,
                })));
            } else {
                setBillItems([]);
            }
            setInputDesc('');
            setInputRate('');
            setInputQty(1);
        }
    }, [isOpen, existingBill]);

    // Auto-fill rate when description matches a known billable item
    const handleDescChange = (value: string) => {
        setInputDesc(value);
        const found = BILLABLE_ITEMS.find(b => b.name === value);
        if (found) {
            setInputRate(found.rate);
        }
    };

    // Add item on Enter
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCurrentItem();
        }
    };

    const addCurrentItem = () => {
        const desc = inputDesc.trim();
        const rate = Number(inputRate);
        const qty = Number(inputQty);
        if (!desc || !rate || !qty) return;

        const newItem: Omit<BillItem, 'amount'> = {
            id: Date.now().toString(),
            description: desc,
            rate,
            quantity: qty,
        };
        setBillItems(prev => [...prev, newItem]);

        // Reset input
        setInputDesc('');
        setInputRate('');
        setInputQty(1);
        descRef.current?.focus();
    };

    const removeItem = (id: string) => {
        setBillItems(prev => prev.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return billItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    };

    const handlePrintBill = () => {
        if (!patient) return;
        if (billItems.length === 0) return;

        const total = calculateTotal();
        const billDate = existingBill?.date || new Date().toISOString().split('T')[0];

        const itemsRows = billItems.map((item, i) => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.description}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">₹${item.rate.toFixed(2)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">₹${(item.rate * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

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
                <h1>${patient.hospitalName}</h1>
                <p>Patient Bill / Invoice</p>
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
                    <div class="value">${patient.wardName} — Bed ${patient.bedNo}</div>
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
                        <th style="width:100px;text-align:right">Rate (₹)</th>
                        <th style="width:60px;text-align:center">Qty</th>
                        <th style="width:120px;text-align:right">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    <tr class="total-row">
                        <td colspan="4" style="text-align:right">Total Amount</td>
                        <td style="text-align:right">₹${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <p>This is a computer-generated bill.</p>
            </div>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
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
        if (!patient) return;
        if (billItems.length === 0) return;

        const totalAmount = calculateTotal();

        const bill: Bill = {
            id: existingBill?.id || Date.now().toString(),
            date: existingBill?.date || new Date().toISOString().split('T')[0],
            totalAmount,
            items: billItems.map(item => ({
                ...item,
                amount: item.rate * item.quantity
            }))
        };

        onSaveBill(patient.id, bill);
        onClose();
    };

    const isEditing = !!existingBill;

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 w-full max-w-4xl shadow-2xl h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Bill' : 'Add Bill'}</h2>

                <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Patient</label>
                        <div className="font-medium text-white">{patient.prefix} {patient.name}</div>
                        <div className="text-neutral-400 text-xs">{patient.regNo}</div>
                    </div>
                    <div>
                        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Admission</label>
                        <div className="text-neutral-300">{patient.wardName}, Bed {patient.bedNo}</div>
                        <div className="text-neutral-400 text-xs">{patient.admissionDate}</div>
                    </div>
                    <div>
                        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Doctor</label>
                        <div className="text-neutral-300">{patient.doctorName}</div>
                        <div className="text-neutral-400 text-xs">{patient.hospitalName}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    {/* Single input row */}
                    <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 mb-4">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-neutral-500 mb-1">Item / Description</label>
                                <input
                                    ref={descRef}
                                    list="billable-items"
                                    type="text"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                    placeholder="Select or type item..."
                                    value={inputDesc}
                                    onChange={(e) => handleDescChange(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <datalist id="billable-items">
                                    {BILLABLE_ITEMS.map((opt) => (
                                        <option key={opt.id} value={opt.name}>{opt.name} - ₹{opt.rate}</option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="w-28">
                                <label className="block text-xs text-neutral-500 mb-1">Rate (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                    value={inputRate}
                                    onChange={(e) => setInputRate(e.target.value === '' ? '' : Number(e.target.value))}
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
                                    onChange={(e) => setInputQty(e.target.value === '' ? '' : Number(e.target.value))}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="1"
                                />
                            </div>
                            <div className="w-24 text-right text-sm font-medium text-neutral-400 pb-2">
                                ₹{(Number(inputRate) * Number(inputQty) || 0).toFixed(2)}
                            </div>
                        </div>
                        <p className="text-xs text-neutral-600 mt-2">Fill all fields and press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400 text-xs border border-neutral-700">Enter</kbd> to add item</p>
                    </div>

                    {/* Added items list */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        {billItems.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
                                No items added yet. Use the input above to add bill items.
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
                                                ₹{item.rate.toFixed(2)} × {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-neutral-300 whitespace-nowrap">
                                                ₹{(item.rate * item.quantity).toFixed(2)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                title="Remove item"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
                        <div className="text-xs text-neutral-500">{billItems.length} item{billItems.length !== 1 ? 's' : ''}</div>
                        <div className="text-right">
                            <span className="text-neutral-400 text-sm uppercase tracking-wider mr-4">Total Bill Amount</span>
                            <span className="text-2xl font-bold text-white">₹{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-5 py-2 rounded-lg font-medium transition-colors border border-neutral-700 flex items-center gap-2"
                        >
                            🖨 Print Bill
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            {isEditing ? 'Update Bill' : 'Save Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
