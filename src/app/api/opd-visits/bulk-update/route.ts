import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { companyId, updates } = body as { companyId: string, updates: { id: string, tokenNo: number }[] };

    if (!companyId || !Array.isArray(updates)) {
      return NextResponse.json({ message: "Company ID and updates array are required" }, { status: 400 });
    }

    // Supabase does not have a native bulk update that accepts an array of different values in a single query easily 
    // without upserting everything (which requires all fields).
    // So we update them individually in parallel, which is fine for small queues.
    
    const promises = updates.map((update) => 
      supabaseAdmin
        .from("opd_visits")
        .update({ token_no: update.tokenNo, updated_at: new Date().toISOString() })
        .eq("id", update.id)
        .eq("company_id", companyId)
    );

    await Promise.all(promises);

    return NextResponse.json({ message: "Bulk update successful" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
