"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OpdPatient } from "@/types/opd";

type Props = {
  existingPatient?: OpdPatient | null;
  initialName: string;
  initialPhone: string;
  onRegistered: (patient: OpdPatient) => void;
  onBack: () => void;
};

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
};

const validatePhone = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "Phone number is required.";
  if (/[A-Za-z]/.test(trimmed)) return "Phone number cannot contain letters.";
  const norm = normalizePhone(trimmed);
  if (norm.length < 10) return "Phone number must be at least 10 digits.";
  if (norm.length > 10) return "Phone number cannot be more than 10 digits.";
  if (!/^[6-9]\d{9}$/.test(norm)) return "Enter a valid 10-digit mobile number.";
  if (/^(\d)\1{9}$/.test(norm)) return "Phone number cannot repeat the same digit.";
  return "";
};

export function PatientRegistration({ existingPatient, initialName, initialPhone, onRegistered, onBack }: Props) {
  const [name, setName] = useState(existingPatient?.name || initialName);
  const [phone, setPhone] = useState(existingPatient?.phone || initialPhone);
  const [age, setAge] = useState<number | "">(existingPatient?.age || "");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">(existingPatient?.gender || "Male");
  const [address, setAddress] = useState(existingPatient?.address || "");
  const [bloodGroup, setBloodGroup] = useState(existingPatient?.bloodGroup || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addOpdPatient = useAppStore((s) => s.addOpdPatient);
  const updateOpdPatient = useAppStore((s) => s.updateOpdPatient);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Patient name is required.";
    const phoneErr = validatePhone(phone);
    if (phoneErr) newErrors.phone = phoneErr;
    if (!age || age < 0 || age > 150) newErrors.age = "Enter a valid age (0-150).";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (existingPatient) {
      updateOpdPatient(existingPatient.id, {
        name: name.trim(),
        phone: normalizePhone(phone.trim()),
        age: Number(age),
        gender,
        address: address.trim(),
        bloodGroup,
      });
      onRegistered({
        ...existingPatient,
        name: name.trim(),
        phone: normalizePhone(phone.trim()),
        age: Number(age),
        gender,
        address: address.trim(),
        bloodGroup,
      });
    } else {
      const patient = addOpdPatient({
        name: name.trim(),
        phone: normalizePhone(phone.trim()),
        age: Number(age),
        gender,
        address: address.trim(),
        bloodGroup,
      });
      onRegistered(patient);
    }
  };

  const fieldClasses = (field: string) =>
    `w-full rounded-xl border ${
      errors[field] ? "border-red-500" : "border-neutral-700"
    } bg-neutral-800 px-4 py-3 text-white placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {existingPatient ? "Edit Patient Details" : "Register New Patient"}
            </h2>
            <p className="text-sm text-neutral-400">Fill in patient details to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Patient Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="Full name"
              className={fieldClasses("name")}
              autoFocus={!initialName}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { 
                let val = e.target.value;
                if (val.replace(/\D/g, "").length > 10) {
                  const digits = val.replace(/\D/g, "");
                  if (digits.length === 12 && digits.startsWith("91")) {
                    val = digits.slice(2);
                  } else {
                    return;
                  }
                }
                setPhone(val); 
                setErrors((p) => ({ ...p, phone: "" })); 
              }}
              placeholder="10-digit mobile number"
              className={fieldClasses("phone")}
              autoFocus={!!initialName && !initialPhone}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
          </div>

          {/* Age + Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Age <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => { setAge(e.target.value ? Number(e.target.value) : ""); setErrors((p) => ({ ...p, age: "" })); }}
                placeholder="Age"
                min={0}
                max={150}
                className={fieldClasses("age")}
              />
              {errors.age && <p className="mt-1 text-xs text-red-400">{errors.age}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Gender</label>
              <div className="flex gap-1 rounded-xl border border-neutral-700 bg-neutral-800 p-1">
                {(["Male", "Female", "Other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                      gender === g
                        ? "bg-blue-600 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {g[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional"
              className={fieldClasses("address")}
            />
          </div>

          {/* Blood Group */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none transition-colors focus:border-blue-500"
            >
              <option value="">Select (optional)</option>
              {BLOOD_GROUPS.filter(Boolean).map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            {existingPatient ? "Update Patient & Continue" : "Register & Continue to Billing →"}
          </button>
        </form>
      </div>
    </div>
  );
}
