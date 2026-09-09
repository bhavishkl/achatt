import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { hydratePatient, isMissingColumnError, toTimeValue } from "@/app/api/patients/_utils";

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function toDateOnly(value: unknown) {
  return String(value ?? "").trim().split("T")[0];
}

function toComparable(date: unknown, time: unknown) {
  const dateOnly = toDateOnly(date);
  const normalizedTime = toTimeValue(time) ?? "00:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return NaN;
  return Date.parse(`${dateOnly}T${normalizedTime}:00`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const dischargeDate = body?.dischargeDate;
    const dischargeTime = toTimeValue(body?.dischargeTime);

    if (!isValidIsoDate(dischargeDate)) {
      return NextResponse.json(
        { message: "A valid discharge date (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    if (!dischargeTime) {
      return NextResponse.json(
        { message: "A valid discharge time (HH:mm) is required" },
        { status: 400 }
      );
    }

    const { data: patientRow, error: fetchError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { message: "Error fetching patient", error: fetchError.message },
        { status: 500 }
      );
    }

    if (!patientRow) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    if (patientRow.status === "discharged") {
      return NextResponse.json({ message: "Patient is already discharged" }, { status: 409 });
    }

    const admissionMs = toComparable(String(patientRow.admission_date), patientRow.admission_time);
    const dischargeMs = toComparable(dischargeDate, dischargeTime);
    if (Number.isFinite(admissionMs) && Number.isFinite(dischargeMs) && dischargeMs < admissionMs) {
      return NextResponse.json(
        { message: "Discharge date and time cannot be before admission" },
        { status: 400 }
      );
    }

    const payload = {
      status: "discharged",
      discharge_date: dischargeDate,
      discharge_time: dischargeTime,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabaseAdmin
      .from("patients")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    // `discharge_time` arrives with the migration in sql_command.sql; keep saving without it until then.
    if (isMissingColumnError(error)) {
      const { discharge_time: _dischargeTime, ...fallbackPayload } = payload;
      console.warn("patients.discharge_time is missing — saved without it. Run the migration in sql_command.sql.");
      ({ data, error } = await supabaseAdmin
        .from("patients")
        .update(fallbackPayload)
        .eq("id", id)
        .select("*")
        .single());
    }

    if (error) {
      return NextResponse.json(
        { message: "Error discharging patient", error: error.message },
        { status: 500 }
      );
    }

    const hydratedPatient = await hydratePatient(data);
    return NextResponse.json({ patient: hydratedPatient });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
