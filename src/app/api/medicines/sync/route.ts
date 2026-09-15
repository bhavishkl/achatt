import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { medicines } = await request.json();
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const med of medicines) {
      if (!med.name?.trim()) continue;
      
      const medName = med.name.trim();
      
      // Check if medicine exists
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("medicines")
        .select("*")
        .eq("name", medName)
        .maybeSingle();
        
      if (fetchErr) {
        console.error("Error fetching medicine:", fetchErr);
        continue;
      }

      if (!existing) {
        // Insert new
        await supabaseAdmin.from("medicines").insert({
          name: medName,
          form: "other", // default
          frequency: med.frequency || "",
          timing: med.timing || "",
        });
      } else {
        // Exists. Check if we need to update frequency/timing
        const updates: any = {};
        if (!existing.frequency && med.frequency) {
          updates.frequency = med.frequency;
        }
        if (!existing.timing && med.timing) {
          updates.timing = med.timing;
        }
        
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from("medicines")
            .update(updates)
            .eq("id", existing.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: "Internal Server Error", error: err.message }, { status: 500 });
  }
}
