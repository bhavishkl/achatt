import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

function mapTemplate(row: any) {
  return {
    id: row.id,
    name: row.name,
    prescription: row.prescription,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("opd_prescription_templates")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: "Error fetching templates", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: (data ?? []).map(mapTemplate) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, prescription } = body;

    if (!companyId || !name?.trim() || !prescription) {
      return NextResponse.json({ message: "Company ID, name, and prescription are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("opd_prescription_templates")
      .insert([
        {
          company_id: companyId,
          name: String(name).trim(),
          prescription,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: "Error saving template", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: mapTemplate(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: "Template ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("opd_prescription_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: "Error deleting template", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Template deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
