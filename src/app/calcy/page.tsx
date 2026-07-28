"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, Edit, Save, X, CreditCard, Wallet, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

type Account = {
  id: string;
  name: string;
  balance: number;
  transactions: Transaction[];
};

type Transaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
};

const STORAGE_KEY = "calcy_accounts";

export default function CalcyPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDesc, setTransactionDesc] = useState("");
  const [showAllAccounts, setShowAllAccounts] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAccounts(parsed);
        if (parsed.length > 0 && !activeAccountId) {
          setActiveAccountId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse accounts", e);
      }
    }
  }, [activeAccountId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const addAccount = () => {
    if (!newAccountName.trim()) return;
    const account: Account = {
      id: crypto.randomUUID(),
      name: newAccountName.trim(),
      balance: parseFloat(newAccountBalance) || 0,
      transactions: [],
    };
    setAccounts((prev) => [...prev, account]);
    setActiveAccountId(account.id);
    setShowAddAccount(false);
    setNewAccountName("");
    setNewAccountBalance("");
  };

  const deleteAccount = (id: string) => {
    if (!confirm("Delete this account and all its transactions?")) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (activeAccountId === id) {
      const remaining = accounts.filter((a) => a.id !== id);
      setActiveAccountId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const renameAccount = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    if (account) {
      setEditingAccountId(id);
      setEditAccountName(account.name);
    }
  };

  const saveRename = (id: string) => {
    if (!editAccountName.trim()) return;
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: editAccountName.trim() } : a))
    );
    setEditingAccountId(null);
    setEditAccountName("");
  };

  const addTransaction = (type: "credit" | "debit") => {
    if (!activeAccount || !transactionAmount || !transactionDesc.trim()) return;
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      description: transactionDesc.trim(),
      date: new Date().toISOString(),
    };

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== activeAccountId) return a;
        const newBalance = type === "credit" ? a.balance + amount : a.balance - amount;
        return {
          ...a,
          balance: newBalance,
          transactions: [transaction, ...a.transactions],
        };
      })
    );

    setTransactionAmount("");
    setTransactionDesc("");
  };

  const deleteTransaction = (accountId: string, transactionId: string) => {
    if (!confirm("Delete this transaction?")) return;
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accountId) return a;
        const tx = a.transactions.find((t) => t.id === transactionId);
        if (!tx) return a;
        const newBalance = tx.type === "credit" ? a.balance - tx.amount : a.balance + tx.amount;
        return {
          ...a,
          balance: newBalance,
          transactions: a.transactions.filter((t) => t.id !== transactionId),
        };
      })
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-white">Calcy</h1>
          <button
            onClick={() => setShowAllAccounts(!showAllAccounts)}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            {showAllAccounts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{showAllAccounts ? "Hide" : "Show"} Accounts</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {showAllAccounts && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">Accounts</h2>
              <button
                onClick={() => setShowAddAccount(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Add Account
              </button>
            </div>

            {showAddAccount && (
              <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Account name"
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    placeholder="Opening balance"
                    className="w-full sm:w-48 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addAccount}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" /> Create
                  </button>
                  <button
                    onClick={() => setShowAddAccount(false)}
                    className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    activeAccountId === account.id
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {editingAccountId === account.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editAccountName}
                          onChange={(e) => setEditAccountName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveRename(account.id)}
                          className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => saveRename(account.id)}
                          className="flex items-center justify-center rounded-xl bg-emerald-600 p-2 text-neutral-900 transition-colors hover:bg-emerald-700"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 p-2 text-neutral-400 transition-colors hover:bg-neutral-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="flex-1 truncate font-medium text-white">{account.name}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => renameAccount(account.id)}
                            className="p-1.5 text-neutral-500 transition-colors hover:text-white"
                            title="Rename"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteAccount(account.id)}
                            className="p-1.5 text-neutral-500 transition-colors hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Balance</p>
                    <p className={`text-2xl font-bold ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveAccountId(account.id)}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      activeAccountId === account.id
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {activeAccountId === account.id ? "Active" : "Open"}
                  </button>
                </div>
              ))}

              {accounts.length === 0 && (
                <div className="col-span-full rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
                  <Wallet className="mx-auto mb-3 h-12 w-12 text-neutral-600" />
                  <p className="text-neutral-400">No accounts yet. Create one to get started.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeAccount && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveAccountId(null)}
                  className="p-2 text-neutral-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="font-medium text-white">{activeAccount.name}</h2>
                  <p className={`text-sm ${activeAccount.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(activeAccount.balance)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => renameAccount(activeAccount.id)}
                  className="p-2 rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  title="Rename"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteAccount(activeAccount.id)}
                  className="p-2 rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="mb-3 text-sm font-semibold text-neutral-400">Credit (Money In)</p>
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={transactionDesc}
                    onChange={(e) => setTransactionDesc(e.target.value)}
                    placeholder="Description (e.g., Salary, Sale)"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => addTransaction("credit")}
                    disabled={!transactionAmount || !transactionDesc.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" /> Add Credit
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="mb-3 text-sm font-semibold text-neutral-400">Debit (Money Out)</p>
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={transactionDesc}
                    onChange={(e) => setTransactionDesc(e.target.value)}
                    placeholder="Description (e.g., Rent, Shopping)"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => addTransaction("debit")}
                    disabled={!transactionAmount || !transactionDesc.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" /> Add Debit
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">Transactions</h3>
              {activeAccount.transactions.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
                  <CreditCard className="mx-auto mb-3 h-12 w-12 text-neutral-600" />
                  <p className="text-neutral-400">No transactions yet. Add your first credit or debit.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-800/80">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Amount</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Type</th>
                          <th className="w-10 px-2 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAccount.transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/40">
                            <td className="px-4 py-3 text-neutral-500">{formatDate(tx.date)}</td>
                            <td className="px-4 py-3 text-white">{tx.description}</td>
                            <td className={`px-4 py-3 text-right font-medium ${tx.type === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                              {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  tx.type === "credit"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-red-500/15 text-red-400"
                                }`}
                              >
                                {tx.type === "credit" ? "Credit" : "Debit"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <button
                                onClick={() => deleteTransaction(activeAccount.id, tx.id)}
                                className="p-1.5 text-neutral-500 transition-colors hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!activeAccount && accounts.length > 0 && !showAllAccounts && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
            <CreditCard className="mx-auto mb-3 h-16 w-16 text-neutral-600" />
            <p className="text-neutral-400">Select an account from the list above to manage transactions.</p>
          </div>
        )}
      </main>
    </div>
  );
}