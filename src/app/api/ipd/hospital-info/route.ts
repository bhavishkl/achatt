import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("ipd_hospital_info")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(null); // Not found, that's okay
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    id: data.id,
    name: data.name,
    tagline: data.tagline,
    regNo: data.reg_no,
    type: data.type,
    beds: data.beds,
    phone: data.phone,
    altPhone: data.alt_phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    gstin: data.gstin,
    panNo: data.pan_no,
    website: data.website,
    emergencyPhone: data.emergency_phone,
  });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "companyId required" }, { status: 400 });

  const body = await request.json();
  const updateData = {
    company_id: companyId,
    name: body.name,
    tagline: body.tagline,
    reg_no: body.regNo,
    type: body.type,
    beds: body.beds ? Number(body.beds) : null,
    phone: body.phone,
    alt_phone: body.altPhone,
    email: body.email,
    address: body.address,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
    gstin: body.gstin,
    pan_no: body.panNo,
    website: body.website,
    emergency_phone: body.emergencyPhone,
    updated_at: new Date().toISOString(),
  };

  // UPSERT: update if exists, insert if not
  const { data, error } = await supabaseAdmin
    .from("ipd_hospital_info")
    .upsert(updateData, { onConflict: "company_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
