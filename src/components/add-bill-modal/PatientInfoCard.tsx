import type { Patient } from "@/types/patient";

export default function PatientInfoCard({ patient }: { patient: Patient }) {
  return (
    <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
      <div>
        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Patient</label>
        <div className="font-medium text-white">
          {patient.prefix} {patient.name}
        </div>
        <div className="text-neutral-400 text-xs">{patient.regNo}</div>
      </div>
      <div>
        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Admission</label>
        <div className="text-neutral-300">
          {patient.wardName}, Bed {patient.bedNo}
        </div>
        <div className="text-neutral-400 text-xs">{patient.admissionDate}</div>
      </div>
      <div>
        <label className="block text-neutral-500 text-xs uppercase tracking-wide">Doctor</label>
        <div className="text-neutral-300">{patient.doctorName}</div>
        <div className="text-neutral-400 text-xs">{patient.hospitalName}</div>
      </div>
    </div>
  );
}
