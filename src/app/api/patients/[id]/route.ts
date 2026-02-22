import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { hydratePatient } from "@/app/api/patients/_utils";

function toUpdatePayload(patient: any) {
  return {
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
    updated_at: new Date().toISOString(),
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { patient } = body;

    if (!patient) {
      return NextResponse.json({ message: "Patient payload is required" }, { status: 400 });
    }

    const payload = toUpdatePayload(patient);
    if (!payload.name || !payload.reg_no || !payload.admission_date || !payload.admission_time) {
      return NextResponse.json({ message: "Missing required patient fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("patients")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error updating patient", error: error.message }, { status: 500 });
    }

    const hydratedPatient = await hydratePatient(data);
    return NextResponse.json({ patient: hydratedPatient });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: patientRow, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ message: "Error fetching patient", error: error.message }, { status: 500 });
    }

    const hydratedPatient = await hydratePatient(patientRow);
    return NextResponse.json({ patient: hydratedPatient });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
