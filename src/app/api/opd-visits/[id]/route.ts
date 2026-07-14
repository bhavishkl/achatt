import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

function mapVisit(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitDate: row.visit_date,
    tokenNo: row.token_no,
    status: row.status,
    vitals: row.vitals ?? null,
    prescription: row.prescription ?? null,
    bill: row.bill ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("opd_visits")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ message: "Error fetching visit", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ visit: mapVisit(data) });
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Support partial updates for each field
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.vitals !== undefined) updatePayload.vitals = body.vitals;
    if (body.prescription !== undefined) updatePayload.prescription = body.prescription;
    if (body.bill !== undefined) updatePayload.bill = body.bill;

    // If vitals are being set and status should auto-change
    if (body.vitals !== undefined && body.status === undefined) {
      updatePayload.status = "vitals_done";
    }

    const { data, error } = await supabaseAdmin
      .from("opd_visits")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error updating visit", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ visit: mapVisit(data) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
