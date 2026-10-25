import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

const VOIDED_PREFIX = "[Voided]";

/**
 * DELETE /api/patients/advances/:id
 *
 * Soft-deletes ("voids") a manual advance receipt: the note is prefixed with
 * "[Voided]" so every balance calculation (patient advance balance, bill
 * advance availability, summary totals) drops the entry, while the ledger row
 * itself stays in the history log for the hospital owner. Automatic debit
 * entries written by the bill flow are not voidable — they are part of the
 * bill's recorded advance state.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: row, error: fetchError } = await supabaseAdmin
      .from("patient_advances")
      .select("id, patient_id, entry_type, source, note")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ message: fetchError.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ message: "Advance entry not found" }, { status: 404 });
    }
    if (row.entry_type !== "credit") {
      return NextResponse.json(
        { message: "Only manual advance receipts can be deleted — bill adjustments are managed by the bill flow" },
        { status: 400 }
      );
    }
    if (String(row.note ?? "").startsWith(VOIDED_PREFIX)) {
      return NextResponse.json({ message: "This advance entry is already deleted" }, { status: 400 });
    }

    const rawNote = String(row.note ?? "");
    const { error: updateError } = await supabaseAdmin
      .from("patient_advances")
      .update({ note: `${VOIDED_PREFIX}${rawNote ? " " + rawNote : ""}` })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ message: "Error deleting advance", error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Advance deleted",
      patientId: String(row.patient_id),
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
