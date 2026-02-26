import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { advanceAmount } = body;

    if (advanceAmount === undefined) {
      return NextResponse.json({ error: "Advance amount is required" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // First get current advance amount
    const { data: emp, error: fetchErr } = await supabase
      .from("employees")
      .select("advance_amount")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    const currentAdvance = Number(emp?.advance_amount || 0);
    const newAdvance = currentAdvance + Number(advanceAmount);

    const { data, error } = await supabase
      .from("employees")
      .update({ advance_amount: newAdvance, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ employee: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
