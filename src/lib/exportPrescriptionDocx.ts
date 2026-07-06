import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import type { OpdPatient, OpdVisit, Prescription, PrescriptionFormatConfig } from "@/types/opd";
import { DEFAULT_SECTION_HEADINGS } from "@/types/opd";

const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const allBorders = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
  insideHorizontal: BORDER_SINGLE,
  insideVertical: BORDER_SINGLE,
};

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        underline: {},
        font: "Calibri",
        size: 22,
      }),
    ],
    spacing: { before: 80, after: 40 },
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 22,
      }),
    ],
    spacing: { after: 20 },
  });
}

function bulletText(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        font: "Calibri",
        size: 22,
      }),
    ],
    spacing: { after: 40 },
  });
}

function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: "Calibri", size: 22 }),
      new TextRun({ text: value, font: "Calibri", size: 22 }),
    ],
    spacing: { after: 40 },
  });
}

const formatDate = (isoString: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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

export async function generatePrescriptionDocx(
  patient: OpdPatient,
  visit: OpdVisit,
  prescription: Prescription,
  config: PrescriptionFormatConfig,
) {
  const getHead = (key: string) =>
    config?.renamedHeadings?.[key] || DEFAULT_SECTION_HEADINGS[key] || key;
  const isVisible = (key: string) => !config?.hiddenSections?.includes(key);

  const children: Paragraph[] = [];

  // Clinic Header
  if (config?.clinicHeader?.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: config?.clinicHeader?.name,
            bold: true,
            font: "Calibri",
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    );
    if (config?.clinicHeader?.address) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: config?.clinicHeader?.address, font: "Calibri", size: 20 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
        }),
      );
    }
    if (config?.clinicHeader?.phone) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Ph: ${config?.clinicHeader?.phone}`, font: "Calibri", size: 20 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
      );
    }
  }

  // Separator
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "─".repeat(60),
          font: "Calibri",
          size: 16,
          color: "999999",
        }),
      ],
      spacing: { after: 100 },
    }),
  );

  // Patient Info
  const visitDateStr = formatDate(visit.visitDate);
  children.push(labelValue("Patient", patient.name));
  children.push(labelValue("Age / Gender", `${patient.age}y / ${patient.gender}`));
  children.push(labelValue("Date", visitDateStr));
  if (patient.phone) children.push(labelValue("Phone", patient.phone));

  // Vitals
  if (visit.vitals) {
    const v = visit.vitals;
    const parts: string[] = [];
    if (v.bloodPressureSystolic && v.bloodPressureDiastolic)
      parts.push(`BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
    if (v.pulse) parts.push(`Pulse: ${v.pulse} bpm`);
    if (v.temperature) parts.push(`Temp: ${v.temperature}°${v.temperatureUnit}`);
    if (v.spo2) parts.push(`SpO2: ${v.spo2}%`);
    if (v.weight) parts.push(`Weight: ${v.weight} kg`);
    if (parts.length > 0) {
      children.push(labelValue("Vitals", parts.join(" | ")));
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "─".repeat(60),
          font: "Calibri",
          size: 16,
          color: "999999",
        }),
      ],
      spacing: { before: 40, after: 40 },
    }),
  );

  // Rx is now printed in medicines section

  // Sections in configured order
  const sectionBuilders: Record<string, () => void> = {
    chiefComplaints: () => {
      if (!prescription.chiefComplaints) return;
      children.push(heading(getHead("chiefComplaints")));
      children.push(bodyText(formatSingleLineText(prescription.chiefComplaints)));
    },
    diagnosis: () => {
      if (!prescription.diagnosis) return;
      children.push(heading(getHead("diagnosis")));
      children.push(bodyText(prescription.diagnosis));
    },
    respiratoryExamination: () => {
      if (!prescription.respiratoryExamination) return;
      children.push(heading(getHead("respiratoryExamination")));
      children.push(bodyText(prescription.respiratoryExamination));
    },
    testsAdvised: () => {
      if (prescription.testsAdvised.length === 0) return;
      children.push(heading(getHead("testsAdvised")));
      prescription.testsAdvised.forEach((t) => {
        children.push(bulletText(`${t.name}${t.notes ? ` — ${t.notes}` : ""}`));
      });
    },
    testResults: () => {
      const validTestResults = prescription.testResults.filter((tr) => tr.testName.trim() !== "");
      if (validTestResults.length === 0) return;
      children.push(heading(getHead("testResults")));
      validTestResults.forEach((tr) => {
        children.push(bulletText(`${tr.testName}${tr.result ? `: ${tr.result}` : ""} (${tr.date})`));
      });
    },
    medicines: () => {
      const validMedicines = prescription.medicines.filter((med) => med.name.trim() !== "");
      if (validMedicines.length === 0) return;
      
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "℞", bold: true, font: "Calibri", size: 36 })],
          spacing: { after: 100 },
        }),
      );
      
      children.push(heading(getHead("medicines")));

      validMedicines.forEach((med, i) => {
        const timingRoutine = formatTimingRoutine(med);

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, font: "Calibri", size: 22 }),
              new TextRun({ text: `${med.name} `, bold: true, font: "Calibri", size: 22 }),
              new TextRun({
                text: `${formatFrequency(med.frequency)} — ${timingRoutine}`,
                font: "Calibri",
                size: 22,
              }),
            ],
            spacing: { after: 16 },
          }),
        );
      });
    },
    nextVisit: () => {
      if (!prescription.nextVisitDate) return;
      children.push(heading(getHead("nextVisit")));
      const dateStr = formatDate(prescription.nextVisitDate);
      children.push(
        bodyText(`${dateStr}${prescription.nextVisitReason ? ` — ${prescription.nextVisitReason}` : ""}`),
      );
    },
  };

  config.sectionOrder.forEach((key) => {
    if (isVisible(key) && sectionBuilders[key]) {
      sectionBuilders[key]();
    }
  });

  // Custom sections
  prescription.customSections
    .filter((s) => s.visible && s.content.trim())
    .forEach((section) => {
      children.push(heading(section.heading));
      children.push(bodyText(section.content));
    });

  // Signature
  children.push(
    new Paragraph({
      spacing: { before: 260 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "Doctor's Signature", font: "Calibri", size: 20, color: "666666" }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = visit.visitDate.replace(/-/g, "");
  saveAs(blob, `Rx_${safeName}_${dateStr}.docx`);
}
