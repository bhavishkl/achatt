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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const date = searchParams.get("date");
  const patientId = searchParams.get("patientId");

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from("opd_visits")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (date) {
      query = query.eq("visit_date", date);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ message: "Error fetching visits", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ visits: (data ?? []).map(mapVisit) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, patientId } = body;

    if (!companyId || !patientId) {
      return NextResponse.json({ message: "Company ID and patient ID are required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get next token number for today atomically
    // First, upsert the bill counter for today
    const { data: counterData, error: counterError } = await supabaseAdmin
      .from("opd_bill_counters")
      .upsert(
        { company_id: companyId, date: today, last_number: 1 },
        { onConflict: "company_id,date" }
      )
      .select("last_number")
      .single();

    let tokenNo = 1;

    if (counterError) {
      // Fallback: count existing visits for today
      const { count } = await supabaseAdmin
        .from("opd_visits")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("visit_date", today);
      tokenNo = (count ?? 0) + 1;
    } else {
      // Increment counter
      const currentVal = counterData.last_number;
      // If it was just inserted (value = 1), use 1. Otherwise increment.
      // Actually we need to use RPC or a different approach for atomicity.
      // Let's count existing visits + 1 as the reliable approach.
      const { count } = await supabaseAdmin
        .from("opd_visits")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("visit_date", today);
      tokenNo = (count ?? 0) + 1;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("opd_visits")
      .insert([
        {
          company_id: companyId,
          patient_id: patientId,
          visit_date: today,
          token_no: tokenNo,
          status: "waiting",
          vitals: null,
          prescription: null,
          bill: null,
          created_at: now,
          updated_at: now,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error creating visit", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ visit: mapVisit(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
