"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  balance: number;
  transactions: Transaction[];
  createdAt: string;
}

interface Transaction {
  id: string;
  accountId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}

const STORAGE_KEY = "calcy_accounts";

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const loadAccounts = (): Account[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveAccounts = (accounts: Account[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CalcyPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadAccounts();
    setAccounts(loaded);
    if (loaded.length > 0 && !activeAccountId) {
      setActiveAccountId(loaded[0].id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, isLoaded, activeAccountId]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;

  const handleAddAccount = useCallback(() => {
    if (!newAccountName.trim()) return;
    const newAccount: Account = {
      id: generateId(),
      name: newAccountName.trim(),
      balance: 0,
      transactions: [],
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    setNewAccountName("");
    setIsAddAccountOpen(false);
  }, [newAccountName]);

  const handleDeleteAccount = useCallback(() => {
    if (!accountToDelete) return;
    setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete));
    setAccountToDelete(null);
    setIsDeleteConfirmOpen(false);
  }, [accountToDelete]);

  const handleAddTransaction = useCallback(() => {
    const amount = Number(transactionAmount);
    if (!amount || amount <= 0 || !transactionDescription.trim()) return;

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== activeAccountId) return account;

        const newBalance =
          transactionType === "credit"
            ? account.balance + amount
            : account.balance - amount;

        const newTransaction: Transaction = {
          id: generateId(),
          accountId: account.id,
          type: transactionType,
          amount,
          description: transactionDescription.trim(),
          date: new Date().toISOString(),
          balanceAfter: newBalance,
        };

        return {
          ...account,
          balance: newBalance,
          transactions: [newTransaction, ...account.transactions],
        };
      })
    );

    setTransactionAmount("");
    setTransactionDescription("");
    setIsAddTransactionOpen(false);
  }, [activeAccountId, transactionType, transactionAmount, transactionDescription]);

  const handleSwitchAccount = (accountId: string) => {
    setActiveAccountId(accountId);
  };

  const formatBalance = (balance: number) => {
    const color = balance >= 0 ? "text-green-400" : "text-red-400";
    return <span className={`${color} font-mono text-xl font-semibold`}>{formatCurrency(balance)}</span>;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">←</span>
            <span className="text-base font-semibold sm:text-lg">Back to Dashboard</span>
          </Link>

          <h1 className="text-xl font-bold text-white">Calcy - Multi-Account Ledger</h1>

          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Account List Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <aside className="lg:col-span-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Accounts</h2>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <span className="text-lg">+</span>
                  <span className="hidden sm:inline">Add Account</span>
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p className="text-sm">No accounts yet</p>
                  <p className="text-xs text-neutral-600 mt-1">Create your first account to start tracking</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {accounts.map((account) => (
                    <li
                      key={account.id}
                      onClick={() => handleSwitchAccount(account.id)}
                      className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors cursor-pointer ${
                        activeAccountId === account.id
                          ? "bg-blue-500/10 border border-blue-500/30"
                          : "bg-neutral-950 hover:bg-neutral-900 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{account.name}</p>
                        <p className="truncate text-xs text-neutral-500">{formatBalance(account.balance)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAccountToDelete(account.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-900/30 text-neutral-500 hover:text-red-400"
                        aria-label={`Delete ${account.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Active Account Detail */}
          <section className="lg:col-span-3 space-y-4">
            {activeAccount ? (
              <>
                {/* Account Header */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{activeAccount.name}</h2>
                      <p className="text-sm text-neutral-500 mt-1">Current Balance</p>
                    </div>
                    <div className="text-right">
                      {formatBalance(activeAccount.balance)}
                      <p className="text-xs text-neutral-500 mt-1">
                        {activeAccount.transactions.length} transaction{activeAccount.transactions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setTransactionType("credit");
                        setIsAddTransactionOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600/20 border border-green-600/30 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-600/30 transition-colors"
                    >
                      <span className="text-lg">+</span>
                      Credit
                    </button>
                    <button
                      onClick={() => {
                        setTransactionType("debit");
                        setIsAddTransactionOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600/20 border border-red-600/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      <span className="text-lg">−</span>
                      Debit
                    </button>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="border-b border-neutral-800 px-4 py-3">
                    <h3 className="font-semibold text-white">Transactions</h3>
                  </div>

                  {activeAccount.transactions.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <svg className="mx-auto h-12 w-12 text-neutral-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p className="text-sm">No transactions yet</p>
                      <p className="text-xs text-neutral-600 mt-1">Add a credit or debit to get started</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-neutral-800">
                      {activeAccount.transactions.map((tx) => (
                        <li
                          key={tx.id}
                          className="px-4 py-3 hover:bg-neutral-950/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex-shrink-0 w-9 h-9 rounded-xl items-center justify-center ${
                                  tx.type === "credit"
                                    ? "bg-green-600/20 text-green-400"
                                    : "bg-red-600/20 text-red-400"
                                }`}
                              >
                                {tx.type === "credit" ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">{tx.description}</p>
                                <p className="text-xs text-neutral-500">{formatDate(tx.date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <span
                                className={`font-mono text-sm font-semibold ${
                                  tx.type === "credit" ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {tx.type === "credit" ? "+" : "−"}{formatCurrency(tx.amount)}
                              </span>
                              <span className="font-mono text-xs text-neutral-500 whitespace-nowrap">
                                {formatCurrency(tx.balanceAfter)}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-neutral-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">Select an account</h3>
                <p className="text-neutral-500">Choose an account from the sidebar or create a new one to get started</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Account</h3>
            <input
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Account name (e.g., Savings, Cash, Business)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newAccountName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddTransactionOpen && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {transactionType === "credit" ? "Add Credit" : "Add Debit"}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Current balance: <span className="font-mono font-semibold text-white">{formatCurrency(activeAccount.balance)}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  placeholder="e.g., Salary, Groceries, Rent..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddTransactionOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={!transactionAmount || Number(transactionAmount) <= 0 || !transactionDescription.trim()}
                className={`px-4 py-2 rounded-xl text-white font-medium ${
                  transactionType === "credit"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {transactionType === "credit" ? "Add Credit" : "Add Debit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
            <p className="text-neutral-400 mb-6">
              Are you sure you want to delete <strong className="text-white">"{accounts.find(a => a.id === accountToDelete)?.name}"</strong>?
              This will permanently remove all transactions.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}