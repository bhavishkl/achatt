import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("medicines")
      .select("id, name, brand_name, composition, form, frequency, timing, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ message: "Failed to fetch medicines", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medicines: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ message: "Internal Server Error", error: err.message }, { status: 500 });
  }
}
