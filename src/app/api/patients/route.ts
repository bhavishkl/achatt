import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { hydratePatient, hydratePatients } from "@/app/api/patients/_utils";

function toInsertPayload(patient: any, companyId: string) {
  return {
    company_id: companyId,
    reg_no: String(patient.regNo).trim(),
    prefix: String(patient.prefix || "Mr.").trim(),
    name: String(patient.name || "").trim(),
    gender: String(patient.gender || "").trim(),
    age: Number(patient.age),
    pincode: patient.pincode ? String(patient.pincode).trim() : null,
    admission_date: String(patient.admissionDate),
    admission_time: String(patient.admissionTime),
    ward_name: String(patient.wardName || "").trim(),
    bed_no: String(patient.bedNo || "").trim(),
    attender_name: String(patient.attenderName || "").trim(),
    attender_address: String(patient.attenderAddress || "").trim(),
    attender_mobile: String(patient.attenderMobile || "").trim(),
    attender_relation: String(patient.attenderRelation || "").trim(),
    status: patient.status === "discharged" ? "discharged" : "admitted",
    discharge_date: patient.dischargeDate || null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    const { data: patients, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: "Error fetching patients", error: error.message }, { status: 500 });
    }

    const hydratedPatients = await hydratePatients(patients ?? []);
    return NextResponse.json({ patients: hydratedPatients });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, patient } = body;

    if (!companyId || !patient) {
      return NextResponse.json({ message: "Company ID and patient payload are required" }, { status: 400 });
    }

    const payload = toInsertPayload(patient, companyId);
    if (!payload.name || !payload.reg_no || !payload.admission_date || !payload.admission_time) {
      return NextResponse.json({ message: "Missing required patient fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("patients")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error creating patient", error: error.message }, { status: 500 });
    }

    const hydratedPatient = await hydratePatient(data);
    return NextResponse.json({ patient: hydratedPatient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
