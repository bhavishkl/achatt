import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
  }

  try {
    // Fetch past prescriptions AND master medicines list in parallel
    const [visitsResult, masterMedsResult] = await Promise.all([
      supabaseAdmin
        .from("opd_visits")
        .select("prescription")
        .eq("company_id", companyId)
        .not("prescription", "is", null),
      supabaseAdmin
        .from("medicines")
        .select("name, form, frequency, timing")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (visitsResult.error) {
      return NextResponse.json({ message: "Error fetching options", error: visitsResult.error.message }, { status: 500 });
    }

    const diagnoses = new Set<string>();
    const chiefComplaints = new Set<string>();
    const history = new Set<string>();
    const tests = new Set<string>();
    const medicinesMap = new Map<string, any>(); // key -> medicine object

    // Seed master medicines list first (lowest priority — historic overrides)
    (masterMedsResult.data || []).forEach((m) => {
      if (!m.name?.trim()) return;
      const key = m.name.trim();
      if (!medicinesMap.has(key)) {
        medicinesMap.set(key, {
          name: m.name.trim(),
          frequency: m.frequency || "",
          timing: m.timing || "",
          routine: "",
          duration: "",
        });
      }
    });

    (visitsResult.data || []).forEach((row) => {
      const p = row.prescription;
      if (!p) return;

      // Extract diagnosis
      if (p.diagnosis) {
        p.diagnosis.split(',').forEach((d: string) => {
          const trimmed = d.trim();
          if (trimmed) diagnoses.add(trimmed);
        });
      }

      // Helper to sanitize free-text (removes "since X days", etc.)
      const sanitizeSuggestion = (text: string) => {
        let clean = text.trim();
        clean = clean.replace(/\s+since\b.*/i, "").trim();
        return clean;
      };

      // Extract chief complaints
      if (p.chiefComplaints) {
        p.chiefComplaints.split('\n').forEach((c: string) => {
          const sanitized = sanitizeSuggestion(c);
          if (sanitized.length > 2) chiefComplaints.add(sanitized);
        });
      }

      // Extract history
      if (p.history) {
        p.history.split('\n').forEach((c: string) => {
          const sanitized = sanitizeSuggestion(c);
          if (sanitized.length > 2) history.add(sanitized);
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

      // Extract medicines — historic usage overrides master (carries frequency/timing/duration)
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m: any) => {
          if (!m.name?.trim()) return;
          const key = m.name.trim();
          // Always overwrite with historically-used values so past frequency/timing is preserved
          medicinesMap.set(key, {
            name: m.name.trim(),
            frequency: m.frequency,
            timing: m.timing,
            routine: m.routine,
            duration: m.duration,
          });
        });
      }
    });

    return NextResponse.json({
      diagnoses: Array.from(diagnoses),
      chiefComplaints: Array.from(chiefComplaints),
      history: Array.from(history),
      tests: Array.from(tests),
      medicines: Array.from(medicinesMap.values()),
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

