"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Save, X, Wallet, TrendingUp, TrendingDown } from "lucide-react";

const ACCOUNTS_STORAGE_KEY = "calcy-accounts";
const TRANSACTIONS_STORAGE_KEY = "calcy-transactions";

interface Account {
  id: string;
  name: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  accountId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function loadAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export default function CalcyPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    const initialAccounts = loadAccounts();
    return initialAccounts.length > 0 ? initialAccounts[0].id : "";
  });
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState("");
  const [txType, setTxType] = useState<"credit" | "debit">("credit");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(todayISO());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;

  const accountTransactions = useMemo(
    () => transactions.filter((t) => t.accountId === selectedAccountId).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedAccountId],
  );

  const balance = useMemo(
    () =>
      accountTransactions.reduce(
        (sum, t) => (t.type === "credit" ? sum + t.amount : sum - t.amount),
        0,
      ),
    [accountTransactions],
  );

  const handleCreateAccount = () => {
    const name = newAccountName.trim();
    if (!name) return;
    const newAccount: Account = { id: uid(), name, createdAt: new Date().toISOString() };
    setAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
    setNewAccountName("");
    setShowNewAccountForm(false);
  };

  const handleDeleteAccount = (id: string) => {
    if (!confirm("Delete this account and all its transactions?")) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setTransactions((prev) => prev.filter((t) => t.accountId !== id));
    if (selectedAccountId === id) {
      setSelectedAccountId("");
    }
  };

  const startEditAccount = (account: Account) => {
    setEditingAccountId(account.id);
    setEditingAccountName(account.name);
  };

  const saveEditAccount = () => {
    const name = editingAccountName.trim();
    if (!name || editingAccountId === null) return;
    setAccounts((prev) => prev.map((a) => (a.id === editingAccountId ? { ...a, name } : a)));
    setEditingAccountId(null);
    setEditingAccountName("");
  };

  const handleAddTransaction = () => {
    if (!selectedAccountId) return;
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    const newTx: Transaction = {
      id: uid(),
      accountId: selectedAccountId,
      type: txType,
      amount,
      description: txDescription.trim(),
      date: txDate,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setTxAmount("");
    setTxDescription("");
    setTxDate(todayISO());
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Calcy</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Manage multiple accounts, track transactions, and view remaining balances. All data is stored locally.
            </p>
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            Back
          </button>
        </div>

        {/* ── Account Management ── */}
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Accounts</h2>

          {accounts.length === 0 ? (
            <div className="py-8 text-center">
              <Wallet className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
              <p className="text-sm text-neutral-400">No accounts yet. Create one to get started.</p>
              <button
                onClick={() => setShowNewAccountForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus size={16} />
                New Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Select Account
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowNewAccountForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                >
                  <Plus size={16} />
                  New
                </button>
              </div>

              {selectedAccount && (
                <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {editingAccountId === selectedAccount.id ? (
                      <>
                        <input
                          type="text"
                          value={editingAccountName}
                          onChange={(e) => setEditingAccountName(e.target.value)}
                          className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={saveEditAccount}
                          className="rounded-lg p-1 text-green-400 hover:bg-neutral-800"
                          aria-label="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800"
                          aria-label="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-medium text-white">{selectedAccount.name}</span>
                        <button
                          onClick={() => startEditAccount(selectedAccount)}
                          className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                          aria-label="Edit account name"
                        >
                          <Edit2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteAccount(selectedAccount.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/20"
                    aria-label="Delete account"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {showNewAccountForm && (
            <div className="mt-4 rounded-xl border border-neutral-700 bg-neutral-950 p-4">
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                New Account Name
              </label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. Cash, Bank, Petty Cash"
                className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAccount();
                  if (e.key === "Escape") setShowNewAccountForm(false);
                }}
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCreateAccount}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewAccountForm(false);
                    setNewAccountName("");
                  }}
                  className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Balance & Transactions ── */}
        {selectedAccount ? (
          <>
            {/* Balance Card */}
            <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
                    Remaining Balance
                  </p>
                  <p
                    className={`mt-2 text-4xl font-bold ${
                      balance >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {balance >= 0 ? "+" : ""}
                    {balance.toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {accountTransactions.length} transaction
                    {accountTransactions.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-full bg-neutral-800 p-4">
                  <Wallet className="h-8 w-8 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Transaction History</h2>

              {accountTransactions.length === 0 ? (
                <div className="py-8 text-center">
                  <TrendingUp className="mx-auto mb-3 h-8 w-8 text-neutral-700" />
                  <p className="text-sm text-neutral-500">No transactions yet. Add one below.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="pb-3 font-medium text-neutral-400">Date</th>
                        <th className="pb-3 font-medium text-neutral-400">Type</th>
                        <th className="pb-3 font-medium text-neutral-400">Description</th>
                        <th className="pb-3 font-medium text-neutral-400 text-right">Amount</th>
                        <th className="pb-3 text-center font-medium text-neutral-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-neutral-800/50">
                          <td className="py-3 text-neutral-300">{tx.date}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                tx.type === "credit"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {tx.type === "credit" ? (
                                <TrendingUp size={12} />
                              ) : (
                                <TrendingDown size={12} />
                              )}
                              {tx.type === "credit" ? "Credit" : "Debit"}
                            </span>
                          </td>
                          <td className="py-3 text-neutral-300">{tx.description || "—"}</td>
                          <td className="py-3 text-right font-medium">
                            <span className={tx.type === "credit" ? "text-emerald-400" : "text-red-400"}>
                              {tx.type === "credit" ? "+" : "-"}
                              {tx.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-400"
                              aria-label="Delete transaction"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Transaction Form */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Add Transaction</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Type
                  </label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType("credit")}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        txType === "credit"
                          ? "bg-emerald-600 text-white"
                          : "border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType("debit")}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        txType === "debit"
                          ? "bg-red-600 text-white"
                          : "border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      Debit
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Description
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Optional note..."
                    className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAddTransaction}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Transaction
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center">
            <Wallet className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
            <p className="text-sm text-neutral-400">
              Select or create an account to view transactions and balance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
