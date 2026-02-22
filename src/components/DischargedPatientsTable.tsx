"use client";

import { useState, useMemo } from "react";
import { Patient } from "@/types/patient";

interface DischargedPatientsTableProps {
    patients: Patient[];
    onViewBill: (patientId: string, billId: string) => void;
}

type SortField = 'regNo' | 'name' | 'wardDetails' | 'admissionDate' | 'dischargeDate' | 'totalBill';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

export default function DischargedPatientsTable({
    patients,
    onViewBill,
}: DischargedPatientsTableProps) {
    // Search
    const [search, setSearch] = useState('');

    // Sort
    const [sortField, setSortField] = useState<SortField>('dischargeDate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Date filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [page, setPage] = useState(1);

    // Filters open toggle
    const [filtersOpen, setFiltersOpen] = useState(false);

    const getTotalBill = (p: Patient) =>
        p.bills?.reduce((sum, b) => sum + b.totalAmount, 0) ?? 0;

    // Memoized filtered + sorted list
    const processed = useMemo(() => {
        let list = [...patients];

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.regNo.toLowerCase().includes(q) ||
                p.wardName.toLowerCase().includes(q) ||
                p.bedNo.toLowerCase().includes(q) ||
                p.doctorName.toLowerCase().includes(q) ||
                p.attenderName.toLowerCase().includes(q) ||
                p.attenderMobile.includes(q)
            );
        }

        // Date range filter (on discharge date)
        if (dateFrom) {
            list = list.filter(p => (p.dischargeDate || '') >= dateFrom);
        }
        if (dateTo) {
            list = list.filter(p => (p.dischargeDate || '') <= dateTo);
        }

        // Sort
        list.sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (sortField) {
                case 'regNo':
                    aVal = a.regNo; bVal = b.regNo; break;
                case 'name':
                    aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                case 'wardDetails':
                    aVal = `${a.wardName} ${a.bedNo}`.toLowerCase(); bVal = `${b.wardName} ${b.bedNo}`.toLowerCase(); break;
                case 'admissionDate':
                    aVal = a.admissionDate; bVal = b.admissionDate; break;
                case 'dischargeDate':
                    aVal = a.dischargeDate || ''; bVal = b.dischargeDate || ''; break;
                case 'totalBill':
                    aVal = getTotalBill(a); bVal = getTotalBill(b); break;
            }

            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [patients, search, dateFrom, dateTo, sortField, sortDir]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="text-neutral-600 ml-1">↕</span>;
        return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const hasActiveFilters = search || dateFrom || dateTo;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Search name, reg no, ward, bed, doctor..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-600 outline-none transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter toggle */}
                    <button
                        onClick={() => setFiltersOpen(prev => !prev)}
                        className={`text-sm px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${filtersOpen
                            ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                    >
                        <span>⚙</span> Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        )}
                    </button>

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-neutral-500 hover:text-white transition-colors px-2 py-2"
                        >
                            Clear all
                        </button>
                    )}

                    {/* Result count */}
                    <span className="text-xs text-neutral-500">
                        {processed.length} result{processed.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Filter panel */}
            {filtersOpen && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Discharged From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Discharged To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => { setDateTo(e.target.value); setPage(1); }}
                            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-800 text-neutral-400">
                            <tr>
                                <th className="p-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('regNo')}>
                                    Reg No <SortIcon field="regNo" />
                                </th>
                                <th className="p-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                    Patient <SortIcon field="name" />
                                </th>
                                <th className="p-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('wardDetails')}>
                                    Ward Details <SortIcon field="wardDetails" />
                                </th>
                                <th className="p-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('admissionDate')}>
                                    Admitted <SortIcon field="admissionDate" />
                                </th>
                                <th className="p-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('dischargeDate')}>
                                    Discharged <SortIcon field="dischargeDate" />
                                </th>
                                <th className="p-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('totalBill')}>
                                    Total Bill <SortIcon field="totalBill" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                                        {hasActiveFilters
                                            ? 'No patients match your search or filters.'
                                            : 'No discharged patients found.'}
                                    </td>
                                </tr>
                            ) : (
                                paginated.map(patient => (
                                    <tr key={patient.id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="p-4 font-mono text-neutral-500">{patient.regNo}</td>
                                        <td className="p-4 font-medium text-neutral-300">
                                            {patient.prefix} {patient.name}
                                            <div className="text-xs text-neutral-500">{patient.age} Yrs, {patient.gender}</div>
                                        </td>
                                        <td className="p-4 text-neutral-400">
                                            <div>{patient.wardName}</div>
                                            <div className="text-xs text-neutral-500">Bed: {patient.bedNo}</div>
                                        </td>
                                        <td className="p-4 text-neutral-400">{patient.admissionDate}</td>
                                        <td className="p-4 text-green-400">{patient.dischargeDate}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {patient.bills && patient.bills.length > 0 ? (
                                                    <>
                                                        {patient.bills.map((bill) => (
                                                            <button
                                                                key={bill.id}
                                                                onClick={() => onViewBill(patient.id, bill.id)}
                                                                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded border border-neutral-700 w-fit flex items-center gap-2 transition-colors"
                                                            >
                                                                <span className="text-neutral-500">{bill.date}</span>
                                                                <span>₹{bill.totalAmount.toLocaleString()}</span>
                                                                <span className="text-neutral-500">👁</span>
                                                            </button>
                                                        ))}
                                                        <span className="text-sm text-neutral-400 font-medium">
                                                            Total: ₹{patient.bills.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-neutral-500">No bills</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">
                        Showing {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, processed.length)} of {processed.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={safePage <= 1}
                            onClick={() => setPage(1)}
                            className="px-2 py-1 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            ««
                        </button>
                        <button
                            disabled={safePage <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-2 py-1 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            «
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1]) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, i) =>
                                item === '...' ? (
                                    <span key={`dots-${i}`} className="px-2 text-neutral-600">…</span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => setPage(item)}
                                        className={`px-3 py-1 rounded border transition-colors ${item === safePage
                                            ? 'border-blue-600 bg-blue-600/20 text-blue-400'
                                            : 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                )
                            )
                        }

                        <button
                            disabled={safePage >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-2 py-1 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            »
                        </button>
                        <button
                            disabled={safePage >= totalPages}
                            onClick={() => setPage(totalPages)}
                            className="px-2 py-1 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            »»
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
