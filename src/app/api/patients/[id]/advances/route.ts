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
    const userNote = body?.note ? String(body.note).trim() : "";
    const mode = body?.mode === "online" ? "online" : "cash";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "A valid positive advance amount is required" }, { status: 400 });
    }

    const { data: advanceRow, error: insertError } = await supabaseAdmin
      .from("patient_advances")
      .insert([
        {
          patient_id: patientId,
          entry_type: "credit",
          amount,
          // The DB check constraint (patient_advances_source_check) only allows
          // 'manual' and 'bill_adjustment' here, so the payment mode is encoded
          // in the note as a "[Cash]" / "[Online]" prefix (parsed back by the
          // history endpoint) instead of a separate column.
          source: "manual",
          note: `[${mode === "online" ? "Online" : "Cash"}]${userNote ? " " + userNote : ""}`,
          reference_bill_id: null,
        },
      ])
      .select("id, patient_id, entry_type, amount, source, reference_bill_id, note, created_at")
      .single();

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
    return NextResponse.json({
      patient,
      advance: {
        id: String(advanceRow.id),
        createdAt: advanceRow.created_at,
        amount: Number(advanceRow.amount) || amount,
        mode,
        note: userNote,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
