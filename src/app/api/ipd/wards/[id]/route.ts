import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("ipd_wards")
    .update({ name: body.name, total_beds: body.totalBeds, rate_per_day: body.ratePerDay })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, name: data.name, totalBeds: data.total_beds, ratePerDay: Number(data.rate_per_day) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("ipd_wards").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
