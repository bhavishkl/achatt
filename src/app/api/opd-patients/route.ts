import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

function mapPatient(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    age: row.age,
    gender: row.gender,
    address: row.address ?? "",
    bloodGroup: row.blood_group ?? "",
    createdAt: row.created_at,
  };
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("opd_patients")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: "Error fetching OPD patients", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patients: (data ?? []).map(mapPatient) });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, patient } = body;

    if (!companyId || !patient) {
      return NextResponse.json({ message: "Company ID and patient data are required" }, { status: 400 });
    }

    if (!patient.name?.trim() || !patient.phone?.trim()) {
      return NextResponse.json({ message: "Patient name and phone are required" }, { status: 400 });
    }

    const normalizedName = String(patient.name).trim();
    const normalizedPhone = normalizePhone(String(patient.phone).trim());

    if (!normalizedPhone) {
      return NextResponse.json({ message: "Patient phone is required" }, { status: 400 });
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("opd_patients")
      .select("*")
      .eq("company_id", companyId)
      .eq("phone", normalizedPhone)
      .order("created_at", { ascending: false });

    if (existingError) {
      return NextResponse.json({ message: "Error checking existing patients", error: existingError.message }, { status: 500 });
    }

    const sameNamePatient = (existingRows ?? []).find((row: any) => {
      return String(row.name).trim().toLowerCase() === normalizedName.toLowerCase();
    });

    if (sameNamePatient) {
      return NextResponse.json({ patient: mapPatient(sameNamePatient) }, { status: 200 });
    }

    const { data, error } = await supabaseAdmin
      .from("opd_patients")
      .insert([
        {
          company_id: companyId,
          name: normalizedName,
          phone: normalizedPhone,
          age: Number(patient.age) || 0,
          gender: String(patient.gender || "Male"),
          address: patient.address ? String(patient.address).trim() : null,
          blood_group: patient.bloodGroup ? String(patient.bloodGroup).trim() : null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: conflictRows, error: conflictError } = await supabaseAdmin
          .from("opd_patients")
          .select("*")
          .eq("company_id", companyId)
          .eq("phone", normalizedPhone)
          .order("created_at", { ascending: false });

        if (!conflictError && (conflictRows ?? []).length > 0) {
          const duplicateNamePatient = (conflictRows ?? []).find((row: any) => {
            return String(row.name).trim().toLowerCase() === normalizedName.toLowerCase();
          });

          if (duplicateNamePatient) {
            return NextResponse.json({ patient: mapPatient(duplicateNamePatient) }, { status: 200 });
          }
        }

        return NextResponse.json(
          { message: "A patient with this phone number already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: "Error creating patient", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patient: mapPatient(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
