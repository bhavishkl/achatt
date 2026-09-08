import { supabaseAdmin } from "@/lib/supabaseAdmin";

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Accepts "HH:mm" / "HH:mm:ss" and returns a Postgres `time` value, or null. */
export function toTimeValue(value: unknown) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/**
 * True when Postgres/PostgREST rejected the write because a column is not there yet
 * (i.e. the migration in sql_command.sql has not been applied on this database).
 */
export function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (message.includes("column") && (message.includes("does not exist") || message.includes("could not find")))
  );
}

export function mapPatientRow(row: any) {
  return {
    id: row.id,
    regNo: row.reg_no,
    ipNumber: row.ip_number ?? undefined,
    prefix: row.prefix,
    name: row.name,
    gender: row.gender,
    age: row.age,
    pincode: row.pincode ?? "",
    admissionDate: row.admission_date,
    admissionTime: row.admission_time,
    hospitalName: "",
    doctorName: row.doctor_name || "",
    wardName: row.ward_name,
    bedNo: row.bed_no,
    attenderName: row.attender_name,
    attenderAddress: row.attender_address,
    attenderMobile: row.attender_mobile,
    attenderRelation: row.attender_relation,
    diagnosis: "",
    status: row.status,
    dischargeDate: row.discharge_date ?? undefined,
    dischargeTime: row.discharge_time ?? undefined,
    advanceBalance: 0,
    bills: [],
  };
}

function mapBillRow(row: any) {
  const items = Array.isArray(row.items_json) ? row.items_json : [];
  return {
    id: String(row.id),
    billNo: row.bill_no ?? undefined,
    date: row.bill_date,
    dischargeDate: row.discharge_date ?? "",
    dischargeTime: row.discharge_time ?? "",
    ipBillType: row.ip_bill_type === "final" ? "final" : "draft",
    grossAmount: toNumber(row.gross_amount),
    advanceUsed: toNumber(row.advance_used),
    concession: toNumber(row.concession),
    totalAmount: toNumber(row.total_amount),
    paidCash: toNumber(row.paid_cash),
    paidOnline: toNumber(row.paid_online),
    items: items.map((item: any, index: number) => ({
      id: String(item?.id ?? `${row.id}-item-${index + 1}`),
      description: String(item?.description ?? ""),
      rate: toNumber(item?.rate),
      quantity: toNumber(item?.quantity),
      amount: toNumber(item?.amount),
    })),
  };
}

export async function getFinancialsByPatientIds(patientIds: string[]) {
  if (patientIds.length === 0) {
    return {
      billsByPatientId: new Map<string, any[]>(),
      advancesByPatientId: new Map<string, number>(),
    };
  }

  const [{ data: bills, error: billsError }, { data: advances, error: advancesError }] = await Promise.all([
    supabaseAdmin
      .from("patient_bills")
      .select("*")
      .in("patient_id", patientIds)
      .order("bill_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("patient_advances")
      .select("patient_id, entry_type, amount")
      .in("patient_id", patientIds),
  ]);

  if (billsError) {
    throw new Error(`Error fetching patient bills: ${billsError.message}`);
  }
  if (advancesError) {
    throw new Error(`Error fetching patient advances: ${advancesError.message}`);
  }

  const billsByPatientId = new Map<string, any[]>();
  for (const row of bills ?? []) {
    const patientId = String(row.patient_id);
    const list = billsByPatientId.get(patientId) ?? [];
    list.push(mapBillRow(row));
    billsByPatientId.set(patientId, list);
  }

  const advancesByPatientId = new Map<string, number>();
  for (const row of advances ?? []) {
    const patientId = String(row.patient_id);
    const sign = row.entry_type === "debit" ? -1 : 1;
    const running = advancesByPatientId.get(patientId) ?? 0;
    advancesByPatientId.set(patientId, running + sign * toNumber(row.amount));
  }

  return { billsByPatientId, advancesByPatientId };
}

export async function hydratePatients(rows: any[]) {
  const patients = (rows ?? []).map(mapPatientRow);
  const patientIds = patients.map((patient) => patient.id);
  const { billsByPatientId, advancesByPatientId } = await getFinancialsByPatientIds(patientIds);

  return patients.map((patient) => ({
    ...patient,
    bills: billsByPatientId.get(patient.id) ?? [],
    advanceBalance: Math.max(0, advancesByPatientId.get(patient.id) ?? 0),
  }));
}

export async function hydratePatient(row: any) {
  const [patient] = await hydratePatients([row]);
  return patient;
}
