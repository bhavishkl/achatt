import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

function mapPatient(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    age: row.age,
    gender: row.gender,
    address: row.address ?? "",
    bloodGroup: row.blood_group ?? "",
    createdAt: row.created_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("opd_patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ message: "Error fetching patient", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patient: mapPatient(data) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
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
      return NextResponse.json({ message: "Patient data is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (patient.name !== undefined) updatePayload.name = String(patient.name).trim();
    if (patient.phone !== undefined) updatePayload.phone = String(patient.phone).trim();
    if (patient.age !== undefined) updatePayload.age = Number(patient.age);
    if (patient.gender !== undefined) updatePayload.gender = String(patient.gender);
    if (patient.address !== undefined) updatePayload.address = patient.address ? String(patient.address).trim() : null;
    if (patient.bloodGroup !== undefined) updatePayload.blood_group = patient.bloodGroup ? String(patient.bloodGroup).trim() : null;

    const { data, error } = await supabaseAdmin
      .from("opd_patients")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error updating patient", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patient: mapPatient(data) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
