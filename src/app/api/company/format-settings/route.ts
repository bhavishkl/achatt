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
      .from("companies")
      .select("prescription_format_config")
      .eq("id", companyId)
      .single();

    if (error) {
      return NextResponse.json({ message: "Error fetching format settings", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data?.prescription_format_config ?? null });
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
      .from("companies")
      .update({
        prescription_format_config: config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId)
      .select("prescription_format_config")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error saving format settings", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data?.prescription_format_config ?? null });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
