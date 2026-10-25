import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

/**
 * GET /api/patients/advances?companyId=…
 *
 * Lists every entry of the patient advance ledger for a company (both credits
 * — advance payments received — and debits — automatically-adjusted against
 * bills), joined with basic patient info for searching and receipt reprinting.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ message: "companyId is required" }, { status: 400 });
    }

    const { data: patients, error: patientsError } = await supabaseAdmin
      .from("patients")
      .select(
        "id, reg_no, ip_number, prefix, name, gender, age, ward_name, bed_no, attender_mobile, status"
      )
      .eq("company_id", companyId);

    if (patientsError) {
      return NextResponse.json({ message: patientsError.message }, { status: 500 });
    }

    const patientIds = (patients ?? []).map((p: any) => String(p.id));
    if (patientIds.length === 0) {
      return NextResponse.json({ advances: [] });
    }

    const { data: advances, error: advancesError } = await supabaseAdmin
      .from("patient_advances")
      .select("id, patient_id, entry_type, amount, source, reference_bill_id, note, created_at")
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (advancesError) {
      return NextResponse.json({ message: advancesError.message }, { status: 500 });
    }

    const patientsById = new Map((patients ?? []).map((p: any) => [String(p.id), p]));

    const rows = (advances ?? []).map((row: any) => {
      const source = String(row.source ?? "");
      // Debits are automatic adjustments written by the bill flow; credits are
      // manual receipts whose payment mode is stored as a "[Cash]" / "[Online]"
      // prefix in the note (see the POST route — the source column only allows
      // 'manual' / 'bill_adjustment'). Deleted receipts get an extra "[Voided]"
      // prefix prepended by the DELETE route and stay in the log for the owner.
      let rawNote = String(row.note ?? "");
      const voided = rawNote.startsWith("[Voided]");
      if (voided) rawNote = rawNote.slice("[Voided]".length).trimStart();
      const mode =
        source === "bill_adjustment"
          ? "adjustment"
          : rawNote.startsWith("[Online]")
            ? "online"
            : "cash";
      const note = rawNote.replace(/^\[(Cash|Online)\]\s*/, "");

      const p: any = patientsById.get(String(row.patient_id)) ?? null;

      return {
        id: String(row.id),
        patientId: String(row.patient_id),
        entryType: row.entry_type === "debit" ? "debit" : "credit",
        amount: Number(row.amount) || 0,
        mode,
        note,
        voided,
        referenceBillId: row.reference_bill_id ?? "",
        createdAt: row.created_at ?? "",
        patient: p
          ? {
              regNo: p.reg_no,
              ipNumber: p.ip_number ?? undefined,
              prefix: p.prefix,
              name: p.name,
              gender: p.gender,
              age: p.age,
              wardName: p.ward_name,
              bedNo: p.bed_no,
              attenderMobile: p.attender_mobile,
              status: p.status,
            }
          : null,
      };
    });

    return NextResponse.json({ advances: rows });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
