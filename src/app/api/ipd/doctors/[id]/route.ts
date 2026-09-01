import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("ipd_doctors")
    .update({ prefix: body.prefix, name: body.name })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, prefix: data.prefix, name: data.name });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("ipd_doctors").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
