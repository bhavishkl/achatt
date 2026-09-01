import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("ipd_services")
    .update({ name: body.name, category: body.category, rate: body.rate, taxable: body.taxable })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, name: data.name, category: data.category, rate: Number(data.rate), taxable: data.taxable });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("ipd_services").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
