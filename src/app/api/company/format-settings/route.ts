import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("doctor_print_layouts")
      .select("format_config")
      .eq("company_id", companyId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found for .single()
      return NextResponse.json({ message: "Error fetching format settings", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data?.format_config ?? null });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { companyId, config } = body;

    if (!companyId || !config) {
      return NextResponse.json({ message: "Company ID and config are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("doctor_print_layouts")
      .upsert({
        company_id: companyId,
        format_config: config,
        updated_at: new Date().toISOString(),
      })
      .select("format_config")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error saving format settings", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data?.format_config ?? null });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
