"use client";

import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/types";

type CompanyForm = {
  name: string;
  address: string;
  emailId: string;
  mobileNumber1: string;
  mobileNumber2: string;
  ownerName: string;
};

const EMPTY_FORM: CompanyForm = {
  name: "",
  address: "",
  emailId: "",
  mobileNumber1: "",
  mobileNumber2: "",
  ownerName: "",
};

function getStoredUserId() {
  return (
    sessionStorage.getItem("userId") ??
    localStorage.getItem("userId") ??
    null
  );
}

function toForm(company: Company): CompanyForm {
  return {
    name: company.name ?? "",
    address: company.address ?? "",
    emailId: company.emailId ?? "",
    mobileNumber1: company.mobileNumber1 ?? "",
    mobileNumber2: company.mobileNumber2 ?? "",
    ownerName: company.ownerName ?? "",
  };
}

export default function CompanyProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const isEditMode = useMemo(() => !!company, [company]);

  useEffect(() => {
    const uid = getStoredUserId();
    setUserId(uid);

    if (!uid) {
      setError("User session not found. Please sign in again.");
      setIsLoading(false);
      return;
    }

    const loadCompany = async () => {
      setIsLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(`/api/user/company?userId=${uid}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load company profile.");
          return;
        }

        if (data.company) {
          setCompany(data.company);
          setForm(toForm(data.company));
        } else {
          setCompany(null);
          setForm(EMPTY_FORM);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load company profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, []);

  const setField = (key: keyof CompanyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError("User ID is missing.");
      return;
    }

    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/company", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save company profile.");
        return;
      }

      setCompany(data.company);
      setForm(toForm(data.company));
      setMessage(isEditMode ? "Company profile updated." : "Company profile created.");
    } catch (err: any) {
      setError(err.message || "Failed to save company profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !company) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this company profile? This will unlink your account from the company."
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/company", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete company profile.");
        return;
      }

      setCompany(null);
      setForm(EMPTY_FORM);
      setMessage("Company profile deleted.");
    } catch (err: any) {
      setError(err.message || "Failed to delete company profile.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-neutral-400">Loading company profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Company Profile</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage your company details for attendance and reporting.
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            These details are used in patient bill PDF print headers.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300 mb-1">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Company address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Email ID</label>
                <input
                  type="email"
                  value={form.emailId}
                  onChange={(e) => setField("emailId", e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. hr@acme.com"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setField("ownerName", e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Mobile Number 1</label>
                <input
                  type="tel"
                  value={form.mobileNumber1}
                  onChange={(e) => setField("mobileNumber1", e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Primary mobile"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Mobile Number 2</label>
                <input
                  type="tel"
                  value={form.mobileNumber2}
                  onChange={(e) => setField("mobileNumber2", e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Secondary mobile"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-700/40 bg-red-900/20 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-700/40 bg-green-900/20 p-3 text-sm text-green-300">
                {message}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Profile"
                    : "Create Profile"}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete Profile"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
