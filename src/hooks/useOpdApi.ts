"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import type {
  OpdPatient,
  OpdVisit,
  OpdVisitStatus,
  Vitals,
  OpdBill,
  Prescription,
  PrescriptionFormatConfig,
} from "@/types/opd";

// ============================================================
// Helper — get companyId from storage (matches company-profile pattern)
// ============================================================
function getCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("companyId") ??
    sessionStorage.getItem("companyId") ??
    null
  );
}

// ============================================================
// Generic fetch wrapper with error handling
// ============================================================
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.message || `HTTP ${res.status}` };
    }
    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
}

// ============================================================
// OPD Patients API
// ============================================================

export async function fetchOpdPatients(companyId: string): Promise<OpdPatient[]> {
  const { data, error } = await apiFetch<{ patients: OpdPatient[] }>(
    `/api/opd-patients?companyId=${companyId}`
  );
  if (error || !data) {
    console.error("fetchOpdPatients error:", error);
    return [];
  }
  return data.patients;
}

export async function apiCreateOpdPatient(
  companyId: string,
  patient: Omit<OpdPatient, "id" | "createdAt">
): Promise<OpdPatient | null> {
  const { data, error } = await apiFetch<{ patient: OpdPatient }>(
    "/api/opd-patients",
    {
      method: "POST",
      body: JSON.stringify({ companyId, patient }),
    }
  );
  if (error || !data) {
    console.error("apiCreateOpdPatient error:", error);
    return null;
  }
  return data.patient;
}

export async function apiUpdateOpdPatient(
  id: string,
  patient: Partial<Omit<OpdPatient, "id" | "createdAt">>
): Promise<OpdPatient | null> {
  const { data, error } = await apiFetch<{ patient: OpdPatient }>(
    `/api/opd-patients/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ patient }),
    }
  );
  if (error || !data) {
    console.error("apiUpdateOpdPatient error:", error);
    return null;
  }
  return data.patient;
}

// ============================================================
// OPD Visits API
// ============================================================

export async function fetchOpdVisits(
  companyId: string,
  date?: string,
  patientId?: string
): Promise<OpdVisit[]> {
  let url = `/api/opd-visits?companyId=${companyId}`;
  if (date) url += `&date=${date}`;
  if (patientId) url += `&patientId=${patientId}`;

  const { data, error } = await apiFetch<{ visits: OpdVisit[] }>(url);
  if (error || !data) {
    console.error("fetchOpdVisits error:", error);
    return [];
  }
  return data.visits;
}

export async function apiCreateOpdVisit(
  companyId: string,
  patientId: string
): Promise<OpdVisit | null> {
  const { data, error } = await apiFetch<{ visit: OpdVisit }>(
    "/api/opd-visits",
    {
      method: "POST",
      body: JSON.stringify({ companyId, patientId }),
    }
  );
  if (error || !data) {
    console.error("apiCreateOpdVisit error:", error);
    return null;
  }
  return data.visit;
}

export async function apiUpdateOpdVisit(
  visitId: string,
  updates: {
    status?: OpdVisitStatus;
    vitals?: Vitals | null;
    bill?: OpdBill | null;
    prescription?: Prescription | null;
  }
): Promise<OpdVisit | null> {
  const { data, error } = await apiFetch<{ visit: OpdVisit }>(
    `/api/opd-visits/${visitId}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
  if (error || !data) {
    console.error("apiUpdateOpdVisit error:", error);
    return null;
  }
  return data.visit;
}

// ============================================================
// Format Settings API
// ============================================================

export async function fetchFormatConfig(
  companyId: string
): Promise<PrescriptionFormatConfig | null> {
  const { data, error } = await apiFetch<{ config: PrescriptionFormatConfig | null }>(
    `/api/company/format-settings?companyId=${companyId}`
  );
  if (error || !data) {
    console.error("fetchFormatConfig error:", error);
    return null;
  }
  return data.config;
}

export async function apiSaveFormatConfig(
  companyId: string,
  config: PrescriptionFormatConfig
): Promise<PrescriptionFormatConfig | null> {
  const { data, error } = await apiFetch<{ config: PrescriptionFormatConfig }>(
    "/api/company/format-settings",
    {
      method: "PUT",
      body: JSON.stringify({ companyId, config }),
    }
  );
  if (error || !data) {
    console.error("apiSaveFormatConfig error:", error);
    return null;
  }
  return data.config;
}

// ============================================================
// Custom Items API
// ============================================================

export type CustomItem = {
  id: string;
  itemType: string;
  name: string;
  metadata: any;
  createdAt: string;
};

export async function fetchCustomItems(
  companyId: string,
  type?: "medicine" | "test" | "diagnosis"
): Promise<CustomItem[]> {
  let url = `/api/opd-custom-items?companyId=${companyId}`;
  if (type) url += `&type=${type}`;

  const { data, error } = await apiFetch<{ items: CustomItem[] }>(url);
  if (error || !data) {
    console.error("fetchCustomItems error:", error);
    return [];
  }
  return data.items;
}

export async function apiAddCustomItem(
  companyId: string,
  itemType: "medicine" | "test" | "diagnosis",
  name: string,
  metadata?: any
): Promise<CustomItem | null> {
  const { data, error } = await apiFetch<{ item: CustomItem }>(
    "/api/opd-custom-items",
    {
      method: "POST",
      body: JSON.stringify({ companyId, itemType, name, metadata }),
    }
  );
  if (error || !data) {
    // Silently handle duplicates
    if (error?.includes("already exists")) return null;
    console.error("apiAddCustomItem error:", error);
    return null;
  }
  return data.item;
}

// ============================================================
// Templates API
// ============================================================

export type PrescriptionTemplate = {
  id: string;
  name: string;
  prescription: Prescription;
  createdAt: string;
};

export async function fetchTemplates(
  companyId: string
): Promise<PrescriptionTemplate[]> {
  const { data, error } = await apiFetch<{ templates: PrescriptionTemplate[] }>(
    `/api/opd-templates?companyId=${companyId}`
  );
  if (error || !data) {
    console.error("fetchTemplates error:", error);
    return [];
  }
  return data.templates;
}

export async function apiSaveTemplate(
  companyId: string,
  name: string,
  prescription: Prescription
): Promise<PrescriptionTemplate | null> {
  const { data, error } = await apiFetch<{ template: PrescriptionTemplate }>(
    "/api/opd-templates",
    {
      method: "POST",
      body: JSON.stringify({ companyId, name, prescription }),
    }
  );
  if (error || !data) {
    console.error("apiSaveTemplate error:", error);
    return null;
  }
  return data.template;
}

export async function apiDeleteTemplate(id: string): Promise<boolean> {
  const { error } = await apiFetch("/api/opd-templates", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (error) {
    console.error("apiDeleteTemplate error:", error);
    return false;
  }
  return true;
}

// ============================================================
// Bill Number API (generates on server via visit creation)
// ============================================================

export function generateBillNo(date: string, counter: number): string {
  return `OPD-${date.replace(/-/g, "")}-${String(counter).padStart(3, "0")}`;
}

// ============================================================
// Hook: useOpdApi — provides companyId-aware API functions
// ============================================================

export function useOpdApi() {
  const storeCompanyId = useAppStore((s) => s.companyId);

  const companyId = storeCompanyId || getCompanyId();

  const loadPatients = useCallback(async () => {
    if (!companyId) return [];
    return fetchOpdPatients(companyId);
  }, [companyId]);

  const loadTodayVisits = useCallback(async () => {
    if (!companyId) return [];
    const today = new Date().toISOString().split("T")[0];
    return fetchOpdVisits(companyId, today);
  }, [companyId]);

  const loadPatientVisits = useCallback(
    async (patientId: string) => {
      if (!companyId) return [];
      return fetchOpdVisits(companyId, undefined, patientId);
    },
    [companyId]
  );

  const createPatient = useCallback(
    async (patient: Omit<OpdPatient, "id" | "createdAt">) => {
      if (!companyId) return null;
      return apiCreateOpdPatient(companyId, patient);
    },
    [companyId]
  );

  const updatePatient = useCallback(
    async (id: string, data: Partial<Omit<OpdPatient, "id" | "createdAt">>) => {
      return apiUpdateOpdPatient(id, data);
    },
    []
  );

  const createVisit = useCallback(
    async (patientId: string) => {
      if (!companyId) return null;
      return apiCreateOpdVisit(companyId, patientId);
    },
    [companyId]
  );

  const updateVisit = useCallback(
    async (
      visitId: string,
      updates: {
        status?: OpdVisitStatus;
        vitals?: Vitals | null;
        bill?: OpdBill | null;
        prescription?: Prescription | null;
      }
    ) => {
      return apiUpdateOpdVisit(visitId, updates);
    },
    []
  );

  const loadFormatConfig = useCallback(async () => {
    if (!companyId) return null;
    return fetchFormatConfig(companyId);
  }, [companyId]);

  const saveFormatConfig = useCallback(
    async (config: PrescriptionFormatConfig) => {
      if (!companyId) return null;
      return apiSaveFormatConfig(companyId, config);
    },
    [companyId]
  );

  const loadCustomItems = useCallback(
    async (type?: "medicine" | "test" | "diagnosis") => {
      if (!companyId) return [];
      return fetchCustomItems(companyId, type);
    },
    [companyId]
  );

  const addCustomItem = useCallback(
    async (itemType: "medicine" | "test" | "diagnosis", name: string, metadata?: any) => {
      if (!companyId) return null;
      return apiAddCustomItem(companyId, itemType, name, metadata);
    },
    [companyId]
  );

  const loadTemplates = useCallback(async () => {
    if (!companyId) return [];
    return fetchTemplates(companyId);
  }, [companyId]);

  const saveTemplate = useCallback(
    async (name: string, prescription: Prescription) => {
      if (!companyId) return null;
      return apiSaveTemplate(companyId, name, prescription);
    },
    [companyId]
  );

  const deleteTemplate = useCallback(async (id: string) => {
    return apiDeleteTemplate(id);
  }, []);

  return {
    companyId,
    loadPatients,
    loadTodayVisits,
    loadPatientVisits,
    createPatient,
    updatePatient,
    createVisit,
    updateVisit,
    loadFormatConfig,
    saveFormatConfig,
    loadCustomItems,
    addCustomItem,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
  };
}
