import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// GET /api/ipd/wards?companyId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("ipd_wards")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data.map(row => ({
    id: row.id,
    name: row.name,
    totalBeds: row.total_beds,
    ratePerDay: Number(row.rate_per_day),
  })));
}

// POST /api/ipd/wards
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("ipd_wards")
    .insert({ company_id: companyId, name: body.name, total_beds: body.totalBeds, rate_per_day: body.ratePerDay })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, name: data.name, totalBeds: data.total_beds, ratePerDay: Number(data.rate_per_day) }, { status: 201 });
}
