import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

type AppointmentRow = {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  place: string;
  appointment_date: string;
  created_at: string;
  updated_at: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function mapAppointment(row: AppointmentRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    phone: row.phone,
    place: row.place,
    date: row.appointment_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
      .from("appointments")
      .select("*")
      .eq("company_id", companyId)
      .order("appointment_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: "Error fetching appointments", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: (data ?? []).map((row) => mapAppointment(row as AppointmentRow)) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      companyId?: string;
      appointment?: {
        name?: string;
        phone?: string;
        place?: string;
        date?: string;
      };
    };
    const companyId = body.companyId;
    const appointment = body.appointment;

    if (!companyId || !appointment?.name || !appointment.phone || !appointment.place || !appointment.date) {
      return NextResponse.json({ message: "Company ID and appointment fields are required" }, { status: 400 });
    }

    const normalizedName = normalize(appointment.name);
    const normalizedPhone = normalize(appointment.phone);
    const normalizedPlace = normalize(appointment.place);

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("company_id", companyId);

    if (existingError) {
      return NextResponse.json({ message: "Error checking duplicates", error: existingError.message }, { status: 500 });
    }

    const duplicate = (existingRows ?? []).find((row: any) => {
      return (
        normalize(String(row.name ?? "")) === normalizedName &&
        normalize(String(row.phone ?? "")) === normalizedPhone &&
        normalize(String(row.place ?? "")) === normalizedPlace
      );
    });

    if (duplicate) {
      return NextResponse.json(
        {
          message: "Duplicate appointment identity exists",
          code: "DUPLICATE_IDENTITY",
          existingAppointment: mapAppointment(duplicate as AppointmentRow),
          sameDate: String(duplicate.appointment_date) === appointment.date,
        },
        { status: 409 }
      );
    }

    const payload = {
      company_id: companyId,
      name: appointment.name.trim(),
      phone: appointment.phone.trim(),
      place: appointment.place.trim(),
      appointment_date: appointment.date,
    };

    const { data, error } = await supabaseAdmin.from("appointments").insert([payload]).select("*").single();

    if (error) {
      return NextResponse.json({ message: "Error creating appointment", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: mapAppointment(data as AppointmentRow) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
