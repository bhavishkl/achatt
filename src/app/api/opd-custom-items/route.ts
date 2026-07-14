import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

function mapItem(row: any) {
  return {
    id: row.id,
    itemType: row.item_type,
    name: row.name,
    metadata: row.metadata ?? null,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const itemType = searchParams.get("type"); // 'medicine' | 'test' | 'diagnosis'

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from("opd_custom_items")
      .select("*")
      .eq("company_id", companyId)
      .order("name", { ascending: true });

    if (itemType) {
      query = query.eq("item_type", itemType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ message: "Error fetching custom items", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: (data ?? []).map(mapItem) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, itemType, name, metadata } = body;

    if (!companyId || !itemType || !name?.trim()) {
      return NextResponse.json({ message: "Company ID, item type, and name are required" }, { status: 400 });
    }

    if (!["medicine", "test", "diagnosis"].includes(itemType)) {
      return NextResponse.json({ message: "Item type must be 'medicine', 'test', or 'diagnosis'" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("opd_custom_items")
      .insert([
        {
          company_id: companyId,
          item_type: itemType,
          name: String(name).trim(),
          metadata: metadata ?? null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "This item already exists" }, { status: 409 });
      }
      return NextResponse.json({ message: "Error creating custom item", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: mapItem(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
