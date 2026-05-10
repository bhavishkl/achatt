import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

type AppointmentRow = {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  place: string;
  appointment_date: string;
  time_slot: string;
  status: string | null;
  created_at: string;
  updated_at: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const VALID_TIME_SLOTS = new Set(["morning", "evening"]);

function mapAppointment(row: AppointmentRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    phone: row.phone,
    place: row.place,
    date: row.appointment_date,
    timeSlot: row.time_slot ?? "morning",
    status: row.status ?? "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      companyId?: string;
      date?: string;
      timeSlot?: string;
      status?: string;
    };

    if (!body.companyId || (!body.date && !body.status && !body.timeSlot)) {
      return NextResponse.json({ message: "Company ID and an update field are required" }, { status: 400 });
    }

    if (body.timeSlot && !VALID_TIME_SLOTS.has(body.timeSlot)) {
      return NextResponse.json({ message: "Invalid time slot. Must be 'morning' or 'evening'" }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", id)
      .eq("company_id", body.companyId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }

    const normalizedName = normalize(String(current.name ?? ""));
    const normalizedPhone = normalize(String(current.phone ?? ""));
    const normalizedPlace = normalize(String(current.place ?? ""));

    const { data: rows, error: listError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("company_id", body.companyId)
      .neq("id", id);

    if (listError) {
      return NextResponse.json({ message: "Error checking duplicates", error: listError.message }, { status: 500 });
    }

    if (body.date || body.timeSlot) {
      const targetDate = body.date ?? String(current.appointment_date);
      const targetTimeSlot = body.timeSlot ?? String(current.time_slot ?? "morning");

      const conflict = (rows ?? []).find((row: any) => {
        return (
          normalize(String(row.name ?? "")) === normalizedName &&
          normalize(String(row.phone ?? "")) === normalizedPhone &&
          normalize(String(row.place ?? "")) === normalizedPlace &&
          String(row.appointment_date) === targetDate &&
          String(row.time_slot ?? "morning") === targetTimeSlot
        );
      });

      if (conflict) {
        return NextResponse.json(
          { message: "Same appointment already exists on this date and session", code: "DUPLICATE_DATE" },
          { status: 409 }
        );
      }
    }

    const allowedStatuses = new Set(["pending", "confirmed", "cancelled", "not_confirmed"]);

    if (body.status && !allowedStatuses.has(body.status)) {
      return NextResponse.json({ message: "Invalid appointment status" }, { status: 400 });
    }

    const payload: Record<string, string> = {};

    if (body.date) {
      payload.appointment_date = body.date;
    }

    if (body.timeSlot) {
      payload.time_slot = body.timeSlot;
    }

    if (body.status) {
      payload.status = body.status;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update(payload)
      .eq("id", id)
      .eq("company_id", body.companyId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ message: "Error transferring appointment", error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: mapAppointment(updated as AppointmentRow) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
