import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deductions } = body; // Array of { id: string, advanceDeduction: number }

    if (!deductions || !Array.isArray(deductions)) {
      return NextResponse.json({ error: "Invalid deductions array" }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    const results = [];

    // Process each deduction
    for (const d of deductions) {
      if (!d.id || !d.advanceDeduction || d.advanceDeduction <= 0) continue;

      // Fetch current advance amount
      const { data: emp, error: fetchErr } = await supabase
        .from("employees")
        .select("advance_amount")
        .eq("id", d.id)
        .single();

      if (fetchErr) {
        console.error(`Error fetching employee ${d.id}:`, fetchErr);
        continue;
      }

      const currentAdvance = Number(emp?.advance_amount || 0);
      // New advance amount is current minus deduction, but not less than 0
      const newAdvance = Math.max(0, currentAdvance - d.advanceDeduction);

      const { data, error: updateErr } = await supabase
        .from("employees")
        .update({ advance_amount: newAdvance, updated_at: new Date().toISOString() })
        .eq("id", d.id)
        .select()
        .single();

      if (updateErr) {
        console.error(`Error updating employee ${d.id}:`, updateErr);
        continue;
      }
      
      results.push(data);
    }

    return NextResponse.json({ message: "Deductions applied successfully", updatedEmployees: results });
  } catch (error: any) {
    console.error("Error processing deductions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
