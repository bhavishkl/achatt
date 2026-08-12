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
      .from("opd_visits")
      .select("prescription")
      .eq("company_id", companyId)
      .not("prescription", "is", null);

    if (error) {
      return NextResponse.json({ message: "Error fetching options", error: error.message }, { status: 500 });
    }

    const diagnoses = new Set<string>();
    const chiefComplaints = new Set<string>();
    const tests = new Set<string>();
    const medicinesMap = new Map<string, any>(); // key -> medicine object

    (data || []).forEach((row) => {
      const p = row.prescription;
      if (!p) return;

      // Extract diagnosis
      if (p.diagnosis) {
        p.diagnosis.split(',').forEach((d: string) => {
          const trimmed = d.trim();
          if (trimmed) diagnoses.add(trimmed);
        });
      }

      // Extract chief complaints
      if (p.chiefComplaints) {
        p.chiefComplaints.split('\n').forEach((c: string) => {
          const trimmed = c.trim();
          if (trimmed) chiefComplaints.add(trimmed);
        });
      }

      // Extract tests advised
      if (Array.isArray(p.testsAdvised)) {
        p.testsAdvised.forEach((t: any) => {
          const trimmed = t.name?.trim();
          if (trimmed) tests.add(trimmed);
        });
      }
      
      // Also extract tests from testResults since we use it as 'Advice'
      if (Array.isArray(p.testResults)) {
        p.testResults.forEach((t: any) => {
          const trimmed = t.testName?.trim();
          if (trimmed) tests.add(trimmed);
        });
      }

      // Extract medicines
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m: any) => {
          if (!m.name?.trim()) return;
          const key = `${m.name.trim()}|${m.frequency || ""}|${m.timing || ""}|${m.routine || ""}|${m.duration || ""}`;
          if (!medicinesMap.has(key)) {
            medicinesMap.set(key, {
              name: m.name.trim(),
              frequency: m.frequency,
              timing: m.timing,
              routine: m.routine,
              duration: m.duration,
            });
          }
        });
      }
    });

    return NextResponse.json({
      diagnoses: Array.from(diagnoses),
      chiefComplaints: Array.from(chiefComplaints),
      tests: Array.from(tests),
      medicines: Array.from(medicinesMap.values()),
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
