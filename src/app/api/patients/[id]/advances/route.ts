import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { hydratePatient } from "@/app/api/patients/_utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "A valid positive advance amount is required" }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from("patient_advances")
      .insert([
        {
          patient_id: patientId,
          entry_type: "credit",
          amount,
          source: "manual",
          note: body?.note ? String(body.note) : null,
          reference_bill_id: null,
        },
      ]);

    if (insertError) {
      return NextResponse.json({ message: "Error saving advance", error: insertError.message }, { status: 500 });
    }

    const { data: patientRow, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (patientError) {
      return NextResponse.json({ message: "Advance saved, but patient fetch failed", error: patientError.message }, { status: 500 });
    }

    const patient = await hydratePatient(patientRow);
    return NextResponse.json({ patient });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
