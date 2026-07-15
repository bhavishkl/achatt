"use client";

import { useAppStore } from "@/lib/store";
import { PrescriptionPreview } from "@/components/doctor/PrescriptionPreview";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function PrintPrescriptionPage() {
  const params = useParams();
  const visitId = params.visitId as string;
  const visits = useAppStore(s => s.opdVisits);
  const patients = useAppStore(s => s.opdPatients);
  
  const visit = visits.find(v => v.id === visitId);
  const patient = visit ? patients.find(p => p.id === visit.patientId) : null;
  const prescription = visit?.prescription;

  useEffect(() => {
    if (visit && patient && prescription) {
      setTimeout(() => window.print(), 500);
    }
  }, [visit, patient, prescription]);

  if (!visit || !patient || !prescription) {
    return <div className="p-8 text-center text-red-500">Prescription not found or visit incomplete.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black print:p-0 p-8 print:bg-transparent">
      <div className="max-w-3xl mx-auto">
        <PrescriptionPreview patient={patient} visit={visit} prescription={prescription} />
      </div>
    </div>
  );
}
