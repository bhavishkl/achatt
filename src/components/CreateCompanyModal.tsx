"use client";

import { useState } from "react";
import type { Company } from "@/lib/types";

interface CreateCompanyModalProps {
  isOpen: boolean;
  userId: string | null;
  onCompanyCreated: (company: Company) => void;
}

export default function CreateCompanyModal({
  isOpen,
  userId,
  onCompanyCreated,
}: CreateCompanyModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("User ID is missing.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: companyName }),
      });

      const data = await response.json();

      if (response.ok) {
        onCompanyCreated(data.company);
      } else {
        setError(data.message || "Failed to create company.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Create Your Company</h2>
        <p className="text-neutral-400 mb-6 text-sm">
          To get started, please enter the name of your company.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-neutral-300 mb-1">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Acme Corp"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create Company"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
