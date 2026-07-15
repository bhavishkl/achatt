"use client";

import { Printer, FileText } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { OpdPatient, OpdVisit, Prescription } from "@/types/opd";
import { DEFAULT_SECTION_HEADINGS, getMergedFormatConfig } from "@/types/opd";
import { generatePrescriptionDocx } from "@/lib/exportPrescriptionDocx";

type Props = {
  patient: OpdPatient;
  visit: OpdVisit;
  prescription: Prescription;
};

export function PrescriptionPreview({ patient, visit, prescription }: Props) {
  const formatConfig = getMergedFormatConfig(useAppStore((s) => s.prescriptionFormatConfig));

  const getHeading = (key: string) =>
    formatConfig?.renamedHeadings?.[key] || DEFAULT_SECTION_HEADINGS[key] || key;

  const isVisible = (key: string) => !formatConfig?.hiddenSections?.includes(key);

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatBloodPressure = (systolic?: number | "", diastolic?: number | "") => {
    if (!systolic || !diastolic) return "";
    return `${systolic}/${diastolic}`;
  };

  const formatSingleLineText = (value: string) =>
    value
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(", ");

  const formatFrequency = (freq: string) => {
    if (!freq) return "";
    if (freq.startsWith("OD")) return "1-0-0";
    if (freq.startsWith("BD")) return "1-0-1";
    if (freq.startsWith("TDS")) return "1-1-1";
    if (freq.startsWith("QID")) return "1-1-1-1";
    return freq.split(" (")[0];
  };

  const formatTimingToken = (value: string) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    if (normalized === "after food" || normalized === "af") return "AF";
    if (normalized === "before food" || normalized === "bf") return "BF";
    return value.trim();
  };

  const formatTimingRoutine = (med: { timing?: string; routine?: string; duration?: string }) => {
    const parts = [] as string[];
    if (med.timing) parts.push(formatTimingToken(med.timing));
    if (med.routine) parts.push(formatTimingToken(med.routine));
    if (med.duration) parts.push(med.duration.trim());
    return parts.join(" - ");
  };

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    chiefComplaints: () =>
      prescription.chiefComplaints ? (
        <div className="text-sm text-neutral-700">
          <h3 className="mb-0.5 text-sm font-bold text-neutral-800">{getHeading("chiefComplaints")}</h3>
          <p className="whitespace-normal">{formatSingleLineText(prescription.chiefComplaints)}</p>
        </div>
      ) : null,

    diagnosis: () =>
      prescription.diagnosis ? (
        <div className="text-sm text-neutral-800">
          <h3 className="mb-0.5 text-sm font-bold text-neutral-800">{getHeading("diagnosis")}</h3>
          <p>{prescription.diagnosis}</p>
        </div>
      ) : null,

    respiratoryExamination: () =>
      prescription.respiratoryExamination ? (
        <div className="text-sm text-neutral-700">
          <h3 className="mb-0.5 text-sm font-bold text-neutral-800">{getHeading("respiratoryExamination")}</h3>
          <p className="whitespace-normal">{prescription.respiratoryExamination}</p>
        </div>
      ) : null,

    testsAdvised: () => {
      const validTestsAdvised = prescription.testsAdvised.filter((test) => test.name.trim() !== "");
      return validTestsAdvised.length > 0 ? (
        <div className="border-l-4 border-neutral-300 pl-3 py-0.5">
          <h3 className="mb-0.5 text-sm font-bold text-neutral-800">{getHeading("testsAdvised")}</h3>
          <ul className="list-none space-y-0.5 text-sm text-neutral-700">
            {validTestsAdvised.map((test) => (
              <li key={test.id}>
                <span className="font-medium text-neutral-700">{test.name}</span>
                {test.notes ? <span className="text-neutral-600"> — {test.notes}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null;
    },

    testResults: () => {
      const validTestResults = prescription.testResults.filter(tr => tr.testName.trim() !== "");
      return validTestResults.length > 0 ? (
        <div className="px-1">
          <h3 className="mb-1 text-sm font-bold text-neutral-800 border-b border-neutral-200 pb-1">Advice</h3>
          <ul className="list-none space-y-0.5 text-sm">
            {validTestResults.map((tr) => (
              <li key={tr.id}>
                <span className="font-medium text-neutral-700">{tr.testName}</span>
                {tr.result ? <span className="text-neutral-600"> - {tr.result}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null;
    },

    medicines: () => {
      const validMedicines = prescription.medicines.filter(med => med.name.trim() !== "");
      return validMedicines.length > 0 ? (
        <div className="space-y-2 text-xs">
          <div className="text-2xl font-bold leading-none text-neutral-800">℞</div>
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <div className="border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
              <h3 className="text-xs font-bold text-neutral-800">{getHeading("medicines")}</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-neutral-50/50">
                <tr className="border-b border-neutral-200">
                  <th className="!py-1 !px-3 text-left font-semibold text-neutral-700 w-12">#</th>
                  <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Medicine</th>
                  <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Frequency</th>
                  <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Timing - Routine - Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {validMedicines.map((med, i) => {
                  const timingRoutine = formatTimingRoutine(med);

                  return (
                    <tr key={med.id}>
                      <td className="!py-1 !px-3 text-neutral-500">{i + 1}</td>
                      <td className="!py-1 !px-3 font-medium text-neutral-800">{med.name}</td>
                      <td className="!py-1 !px-3 text-center text-neutral-700">{formatFrequency(med.frequency)}</td>
                      <td className="!py-1 !px-3 text-neutral-700">{timingRoutine}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null;
    },

    nextVisit: () =>
      prescription.nextVisitDate ? (
        <div className="inline-block rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-2.5">
          <h3 className="mb-0.5 text-sm font-bold text-neutral-800">{getHeading("nextVisit")}</h3>
          <p className="text-sm text-neutral-700">
            {formatDate(prescription.nextVisitDate)}
            {prescription.nextVisitReason ? ` — ${prescription.nextVisitReason}` : ""}
          </p>
        </div>
      ) : null,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportDocx = async () => {
    await generatePrescriptionDocx(patient, visit, prescription, formatConfig);
  };

  return (
    <div className="prescription-preview">
      <style>{`
        @media print {
          @page { 
            size: portrait; 
            margin: ${formatConfig.printOffsets?.enableAbsolutePositioning ? '0mm' : '4mm'}; 
          }
          
          /* Override globals.css table styles */
          .prescription-preview table { width: 100% !important; font-size: inherit !important; }
          .prescription-preview th, .prescription-preview td { border: none !important; color: inherit !important; }
          
          /* Keep background colors */
          .prescription-preview * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Preview Card */}
      <div 
        className="relative rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm print:m-0 print:border-none print:shadow-none print:bg-transparent"
        style={
          formatConfig.printOffsets?.enableAbsolutePositioning 
            ? { 
                paddingTop: `${formatConfig.printOffsets.pageMargin.top}mm`,
                paddingRight: `${formatConfig.printOffsets.pageMargin.right}mm`,
                paddingBottom: `${formatConfig.printOffsets.pageMargin.bottom}mm`,
                paddingLeft: `${formatConfig.printOffsets.pageMargin.left}mm`,
              } 
            : undefined
        }
      >
        {/* Patient Info */}
        {formatConfig.printOffsets?.enableAbsolutePositioning ? (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.name.top}mm`, left: `${formatConfig.printOffsets.patientInfo.name.left}mm` }} className="font-semibold text-black text-base">
              {patient.name}
            </div>
            <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.age.top}mm`, left: `${formatConfig.printOffsets.patientInfo.age.left}mm` }} className="text-black">
              {patient.age}y
            </div>
            <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.gender.top}mm`, left: `${formatConfig.printOffsets.patientInfo.gender.left}mm` }} className="text-black">
              {patient.gender}
            </div>
            <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.date.top}mm`, left: `${formatConfig.printOffsets.patientInfo.date.left}mm` }} className="text-black">
              {formatDate(visit.visitDate)}
            </div>
            {visit.vitals && (
              <>
                {visit.vitals.weight && (
                  <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.weight.top}mm`, left: `${formatConfig.printOffsets.patientInfo.weight.left}mm` }} className="text-black">
                    {visit.vitals.weight} kg
                  </div>
                )}
                {visit.vitals.bloodPressureSystolic && visit.vitals.bloodPressureDiastolic && (
                  <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.bp.top}mm`, left: `${formatConfig.printOffsets.patientInfo.bp.left}mm` }} className="text-black">
                    {formatBloodPressure(visit.vitals.bloodPressureSystolic, visit.vitals.bloodPressureDiastolic)}
                  </div>
                )}
                {visit.vitals.spo2 && (
                  <div style={{ position: 'absolute', top: `${formatConfig.printOffsets.patientInfo.spo2.top}mm`, left: `${formatConfig.printOffsets.patientInfo.spo2.left}mm` }} className="text-black">
                    {visit.vitals.spo2}%
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}

        <div className={formatConfig.printOffsets?.enableAbsolutePositioning ? "hidden" : "mb-2 flex flex-col gap-1 pb-1 text-sm"}>
          <div className="flex items-center justify-between font-semibold text-neutral-800 text-base">
            <span>{patient.name}</span>
            <span>{formatDate(visit.visitDate)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-neutral-700">
            <span>{patient.age}y / {patient.gender}</span>
            {visit.vitals && (
              <>
                {visit.vitals.weight && (
                  <span>{visit.vitals.weight} kg</span>
                )}
                {visit.vitals.bloodPressureSystolic && visit.vitals.bloodPressureDiastolic && (
                  <span>
                    {formatBloodPressure(visit.vitals.bloodPressureSystolic, visit.vitals.bloodPressureDiastolic)}
                  </span>
                )}
                {visit.vitals.spo2 && (
                  <span>{visit.vitals.spo2}%</span>
                )}
              </>
            )}
          </div>
        </div>


        {/* Sections */}
        <div className="space-y-2.5">
          {formatConfig.sectionOrder.map((key) => {
            if (!isVisible(key)) return null;
            const render = sectionRenderers[key];
            if (!render) return null;
            const content = render();
            if (!content) return null;
            return <div key={key}>{content}</div>;
          })}

          {/* Custom Sections */}
          {prescription.customSections
            .filter((s) => s.visible && s.content.trim())
            .map((section) => (
              <div key={section.id} className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-neutral-200"></div>
                <h3 className="mb-1 text-sm font-bold text-neutral-800">{section.heading}</h3>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">{section.content}</p>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end border-t border-neutral-200 pt-3">
          <div className="text-right">
            <p className="text-sm text-neutral-500">Doctor&apos;s Signature</p>
            <div className="mt-6 w-40 border-b border-neutral-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
