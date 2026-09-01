import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("ipd_doctors")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data.map(row => ({ id: row.id, prefix: row.prefix, name: row.name })));
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("ipd_doctors")
    .insert({ company_id: companyId, prefix: body.prefix, name: body.name })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, prefix: data.prefix, name: data.name }, { status: 201 });
}
