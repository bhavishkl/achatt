import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("ipd_services")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data.map(row => ({
    id: row.id, name: row.name, category: row.category, rate: Number(row.rate), taxable: row.taxable,
  })));
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("ipd_services")
    .insert({ company_id: companyId, name: body.name, category: body.category, rate: body.rate, taxable: body.taxable ?? false })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, name: data.name, category: data.category, rate: Number(data.rate), taxable: data.taxable }, { status: 201 });
}
