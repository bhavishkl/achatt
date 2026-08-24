import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { hydratePatient } from "@/app/api/patients/_utils";

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function generateIpNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${randomNum}/${year}`;
}

async function generateBillNumber(patientId: string): Promise<string> {
  const { data: existingBills } = await supabaseAdmin
    .from("patient_bills")
    .select("bill_number")
    .eq("patient_id", patientId)
    .not("bill_number", "is", null)
    .order("bill_number", { ascending: false })
    .limit(1);

  if (existingBills && existingBills.length > 0 && existingBills[0].bill_number) {
    const lastNumber = parseInt(existingBills[0].bill_number, 10);
    return String(lastNumber + 1).padStart(3, "0");
  }
  return "001";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const bill = body?.bill;

    if (!bill || !bill.id) {
      return NextResponse.json({ message: "Bill payload with bill.id is required" }, { status: 400 });
    }

    const { data: existingBill, error: existingBillError } = await supabaseAdmin
      .from("patient_bills")
      .select("id, patient_id, advance_used, bill_number")
      .eq("id", String(bill.id))
      .maybeSingle();

    if (existingBillError) {
      return NextResponse.json({ message: "Error reading existing bill", error: existingBillError.message }, { status: 500 });
    }

    if (existingBill && existingBill.patient_id !== patientId) {
      return NextResponse.json({ message: "Bill does not belong to the specified patient" }, { status: 400 });
    }

    // Generate bill number and IP number for final bills
    let billNumber = existingBill?.bill_number || null;
    let ipNumber = null;

    if (bill.ipBillType === "final") {
      if (!billNumber) {
        billNumber = await generateBillNumber(patientId);
      }
      ipNumber = generateIpNumber();
    }

    const payload = {
      id: String(bill.id),
      patient_id: patientId,
      bill_date: String(bill.date),
      discharge_date: bill.dischargeDate || null,
      ip_bill_type: bill.ipBillType === "final" ? "final" : "draft",
      gross_amount: toNumber(bill.grossAmount),
      advance_used: toNumber(bill.advanceUsed),
      concession: toNumber(bill.concession),
      total_amount: toNumber(bill.totalAmount),
      items_json: Array.isArray(bill.items) ? bill.items : [],
      updated_at: new Date().toISOString(),
      bill_number: billNumber,
    };

    const { error: upsertError } = await supabaseAdmin
      .from("patient_bills")
      .upsert(payload, { onConflict: "id" });

    if (upsertError) {
      return NextResponse.json({ message: "Error saving bill", error: upsertError.message }, { status: 500 });
    }

    const previousAdvanceUsed = toNumber(existingBill?.advance_used);
    const nextAdvanceUsed = toNumber(bill.advanceUsed);
    const advanceDiff = nextAdvanceUsed - previousAdvanceUsed;

    if (advanceDiff !== 0) {
      const adjustmentPayload = {
        patient_id: patientId,
        entry_type: advanceDiff > 0 ? "debit" : "credit",
        amount: Math.abs(advanceDiff),
        source: "bill_adjustment",
        reference_bill_id: String(bill.id),
        note: existingBill
          ? "Automatic advance adjustment for bill edit"
          : "Automatic advance deduction for bill",
      };

      const { error: advanceError } = await supabaseAdmin
        .from("patient_advances")
        .insert([adjustmentPayload]);

      if (advanceError) {
        return NextResponse.json({ message: "Bill saved, but advance adjustment failed", error: advanceError.message }, { status: 500 });
      }
    }

    const { data: patientRow, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (patientError) {
      return NextResponse.json({ message: "Bill saved, but patient fetch failed", error: patientError.message }, { status: 500 });
    }

    const patient = await hydratePatient(patientRow);
    
    // If final bill, update patient's IP number
    if (bill.ipBillType === "final" && ipNumber) {
      await supabaseAdmin
        .from("patients")
        .update({ ip_no: ipNumber })
        .eq("id", patientId);
      
      patient.ipNo = ipNumber;
    }

    return NextResponse.json({ patient, billNumber, ipNumber });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
