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

  const formatFrequency = (freq: string) => {
    if (!freq) return "";
    if (freq.startsWith("OD")) return "1-0-0";
    if (freq.startsWith("BD")) return "1-0-1";
    if (freq.startsWith("TDS")) return "1-1-1";
    if (freq.startsWith("QID")) return "1-1-1-1";
    return freq.split(" (")[0];
  };

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    chiefComplaints: () =>
      prescription.chiefComplaints ? (
        <div className="border-l-4 border-blue-500 pl-4 py-1">
          <h3 className="mb-1 text-sm font-bold text-neutral-800">{getHeading("chiefComplaints")}</h3>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{prescription.chiefComplaints}</p>
        </div>
      ) : null,

    diagnosis: () =>
      prescription.diagnosis ? (
        <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100">
          <h3 className="mb-1 text-sm font-bold text-blue-900">{getHeading("diagnosis")}</h3>
          <p className="text-sm text-blue-800">{prescription.diagnosis}</p>
        </div>
      ) : null,



    testResults: () =>
      prescription.testResults.length > 0 ? (
        <div className="px-1">
          <h3 className="mb-2 text-sm font-bold text-neutral-800 border-b border-neutral-200 pb-1">Advice</h3>
          <ul className="list-none space-y-1 text-sm">
            {prescription.testResults.map((tr) => (
              <li key={tr.id}>
                <span className="font-medium text-neutral-700">{tr.testName}</span>
                {tr.result ? <span className="text-neutral-600"> - {tr.result}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null,

    medicines: () =>
      prescription.medicines.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-800">{getHeading("medicines")}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50/50">
              <tr className="border-b border-neutral-200">
                <th className="!py-1 !px-3 text-left font-semibold text-neutral-700 w-12">#</th>
                <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Medicine</th>
                <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Dosage</th>
                <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Frequency</th>
                <th className="!py-1 !px-3 text-left font-semibold text-neutral-700">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {prescription.medicines.map((med, i) => (
                <tr key={med.id}>
                  <td className="!py-1 !px-3 text-neutral-500">{i + 1}</td>
                  <td className="!py-1 !px-3 font-medium text-neutral-800">{med.name}</td>
                  <td className="!py-1 !px-3 text-neutral-700">{med.dosage}</td>
                  <td className="!py-1 !px-3 text-neutral-700">{formatFrequency(med.frequency)}</td>
                  <td className="!py-1 !px-3 text-neutral-700">{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null,

    nextVisit: () =>
      prescription.nextVisitDate ? (
        <div className="inline-block rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-3">
          <h3 className="mb-1 text-sm font-bold text-neutral-800">{getHeading("nextVisit")}</h3>
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
          @page { size: portrait; margin: 10mm; }
          
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
      {/* Action buttons */}
      <div className="mb-4 flex gap-2 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={handleExportDocx}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          Export DOCX
        </button>
      </div>

      {/* Preview Card */}
      <div className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm print:m-0">
        {/* Patient Info */}
        <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-neutral-50 p-3 text-sm">
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-neutral-500">Patient: </span>
              <span className="font-semibold text-neutral-800">{patient.name}</span>
            </div>
            <div>
              <span className="text-neutral-500">Age/Gender: </span>
              <span className="text-neutral-700">{patient.age}y / {patient.gender}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-left">
            <div>
              <span className="text-neutral-500">Date: </span>
              <span className="text-neutral-700">
                {formatDate(visit.visitDate)}
              </span>
            </div>
          </div>
          {visit.vitals && (
            <div className="col-span-2 mt-1 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-200 pt-2">
              {visit.vitals.bloodPressureSystolic && visit.vitals.bloodPressureDiastolic && (
                <div>
                  <span className="text-neutral-500">BP: </span>
                  <span className="text-neutral-700">
                    {visit.vitals.bloodPressureSystolic}/{visit.vitals.bloodPressureDiastolic} mmHg
                  </span>
                </div>
              )}
              {visit.vitals.weight && (
                <div>
                  <span className="text-neutral-500">Weight: </span>
                  <span className="text-neutral-700">{visit.vitals.weight} kg</span>
                </div>
              )}
              {visit.vitals.spo2 && (
                <div>
                  <span className="text-neutral-500">SpO2: </span>
                  <span className="text-neutral-700">{visit.vitals.spo2}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rx Symbol */}
        <div className="mb-4 text-2xl font-bold text-neutral-800">℞</div>

        {/* Sections */}
        <div className="space-y-6">
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
        <div className="mt-8 flex justify-end border-t border-neutral-200 pt-4">
          <div className="text-right">
            <p className="text-sm text-neutral-500">Doctor&apos;s Signature</p>
            <div className="mt-6 w-40 border-b border-neutral-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
