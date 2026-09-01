import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("patient_bills")
      .select("bill_no")
      .not("bill_no", "is", null);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    let maxSerial = 2999;
    for (const row of data ?? []) {
      const raw = String(row.bill_no).split("/")[0].replace(/\D/g, "");
      const serial = parseInt(raw, 10);
      if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
    }

    const nextBillNo = String(maxSerial + 1);
    return NextResponse.json({ billNo: nextBillNo });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to get next bill number" }, { status: 500 });
  }
}
