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
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import { DischargeData } from '../types';

// ─── Border helpers ────────────────────────────────────────────────────────────

const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

const boxedTableBorders = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
  insideHorizontal: BORDER_NONE,
  insideVertical: BORDER_NONE,
};

const noBorders = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_NONE,
  right: BORDER_NONE,
  insideHorizontal: BORDER_NONE,
  insideVertical: BORDER_NONE,
};

const allSingleBorders = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
  insideHorizontal: BORDER_SINGLE,
  insideVertical: BORDER_SINGLE,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Bold + underline heading paragraph (e.g. "FINAL DIAGNOSIS:") */
function sectionHeadingParagraph(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        underline: {},
        font: 'Calibri',
        size: 22, // 11pt
      }),
    ],
    spacing: { before: 120, after: 60 },
  });
}

/** Plain text paragraphs split by newlines */
function textParagraphs(content: string): Paragraph[] {
  return content.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, font: 'Calibri', size: 22 })],
        spacing: { after: 60 },
      })
  );
}

/**
 * A section enclosed in a single-border box:
 *   ┌───────────────────────────────────────┐
 *   │  HEADING:                             │
 *   │  content text                         │
 *   └───────────────────────────────────────┘
 */
function boxedSection(title: string, content: string, widthPct = 100): Table {
  const contentLines = content ? content.split('\n') : [''];

  // Cell borders must be set explicitly — table-level borders alone are suppressed by cell defaults.
  const topCellBorders = {
    top: BORDER_SINGLE,
    left: BORDER_SINGLE,
    right: BORDER_SINGLE,
    bottom: BORDER_NONE,
    insideHorizontal: BORDER_NONE,
    insideVertical: BORDER_NONE,
  };
  const bottomCellBorders = {
    top: BORDER_NONE,
    left: BORDER_SINGLE,
    right: BORDER_SINGLE,
    bottom: BORDER_SINGLE,
    insideHorizontal: BORDER_NONE,
    insideVertical: BORDER_NONE,
  };

  const innerRows: TableRow[] = [
    // Heading row
    new TableRow({
      children: [
        new TableCell({
          borders: topCellBorders,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: title, bold: true, underline: {} }),
              ],
              spacing: { after: 120 },
            }),
          ],
          margins: { top: 80, bottom: 40, left: 100, right: 100 },
        }),
      ],
    }),
    // Content row
    new TableRow({
      children: [
        new TableCell({
          borders: bottomCellBorders,
          children: contentLines.map(
            (line) =>
              new Paragraph({
                text: line,
                spacing: { after: 80 },
              })
          ),
          margins: { top: 20, bottom: 80, left: 100, right: 100 },
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: boxedTableBorders,
    rows: innerRows,
  });
}

// ─── Investigations table ──────────────────────────────────────────────────────

/**
 * Matches the image exactly:
 *   - 2 columns: Date | Finding
 *   - Category is a bold full-width merged header row (shaded)
 *   - All cells have single borders
 */
function buildInvestigationsTable(
  investigations: DischargeData['investigations']
): Table {
  if (!investigations.length) return new Table({ rows: [] });

  // Group by category preserving insertion order
  const groups = new Map<string, { date: string; result: string; name: string }[]>();
  for (const inv of investigations) {
    const cat = inv.category || 'Other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push({ date: inv.date, result: inv.result, name: inv.name });
  }

  const rows: TableRow[] = [];

  for (const [category, entries] of groups) {
    // Category header row — bold, spans conceptually (single cell full width achieved by equal cols)
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: allSingleBorders,
            shading: { type: ShadingType.CLEAR, fill: 'FFFFFF' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: category, bold: true })],
                spacing: { after: 0 },
              }),
            ],
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
          }),
        ],
      })
    );

    // Entry rows
    for (const entry of entries) {
      // Build the raw finding string first, then let findingRuns parse bold/normal
      const rawFinding = entry.name
        ? entry.result
          ? `${entry.name}- ${entry.result}`
          : entry.name
        : entry.result;

      // Split each line of the result (multi-line findings) into separate paragraphs
      const findingLines = rawFinding.split('\n');

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: allSingleBorders,
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  text: entry.date,
                  spacing: { after: 0 },
                }),
              ],
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
            }),
            new TableCell({
              borders: allSingleBorders,
              width: { size: 80, type: WidthType.PERCENTAGE },
              children: findingLines.map(
                (line, i) =>
                  new Paragraph({
                    children: [new TextRun({ text: line })],
                    spacing: { after: i < findingLines.length - 1 ? 60 : 0 },
                  })
              ),
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
            }),
          ],
        })
      );
    }
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allSingleBorders,
    rows,
  });
}

// ─── Treatment Given table ─────────────────────────────────────────────────────

/**
 * 2-column table with all borders.
 * Items fill left column then right column (column-major order).
 * Each cell: "Name Dosage" on one line.
 */
function buildTreatmentTable(
  treatmentGiven: DischargeData['treatmentGiven']
): Table {
  if (!treatmentGiven.length) return new Table({ rows: [] });

  const rows: TableRow[] = [];
  const half = Math.ceil(treatmentGiven.length / 2);

  for (let i = 0; i < half; i++) {
    const left = treatmentGiven[i];
    const right = treatmentGiven[i + half];

    const makeCell = (entry: { name: string; dosage: string } | undefined) => {
      const text = entry
        ? entry.dosage
          ? `${entry.name} ${entry.dosage}`
          : entry.name
        : '';
      return new TableCell({
        borders: allSingleBorders,
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            text,
            spacing: { after: 0 },
          }),
        ],
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
      });
    };

    rows.push(new TableRow({ children: [makeCell(left), makeCell(right)] }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allSingleBorders,
    rows,
  });
}

// ─── Patient info table ────────────────────────────────────────────────────────

function buildPatientTable(data: DischargeData): Table {
  const cell = (
    label: string,
    value: string,
    widthPct?: number
  ): TableCell =>
    new TableCell({
      borders: allSingleBorders,
      width: widthPct
        ? { size: widthPct, type: WidthType.PERCENTAGE }
        : undefined,
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `${label}  `, bold: true }),
            new TextRun({ text: value }),
          ],
          spacing: { after: 0 },
        }),
      ],
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allSingleBorders,
    rows: [
      new TableRow({
        children: [
          cell('NAME :', data.patientName || '-', 50),
          cell('DOA :', data.admissionDate || '-', 50),
        ],
      }),
      new TableRow({
        children: [
          cell('AGE :', `${data.age || '-'}/ ${data.gender || '-'}`, 50),
          cell('DOD :', data.dischargeDate || '-', 50),
        ],
      }),
      new TableRow({
        children: [
          cell('IP NO :', data.ipNo || '-', 50),
          new TableCell({
            borders: allSingleBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: '', spacing: { after: 0 } })],
          }),
        ],
      }),
    ],
  });
}

// ─── Main export ───────────────────────────────────────────────────────────────

export const generateDocx = async (data: DischargeData) => {
  const children: (Paragraph | Table)[] = [];

  // ── DISCHARGE SUMMARY title ──────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'DISCHARGE SUMMARY',
          bold: true,
          underline: {},
          font: 'Calibri',
          size: 28, // 14pt
        }),
      ],
      spacing: { after: 160 },
    })
  );

  // Optional DAMA notice
  if (data.dischargeAgainstMedicalAdvice) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'DISCHARGE AGAINST MEDICAL ADVICE (DAMA)',
            bold: true,
            color: 'D97706',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // ── Patient info table ───────────────────────────────────────────────────────
  children.push(buildPatientTable(data));
  children.push(new Paragraph({ text: '', spacing: { after: 80 } }));

  // ── FINAL DIAGNOSIS — always rendered ────────────────────────────────────────
  children.push(sectionHeadingParagraph('FINAL DIAGNOSIS:'));
  if (data.finalDiagnosis) {
    children.push(...textParagraphs(data.finalDiagnosis));
  }
  children.push(new Paragraph({ text: '', spacing: { after: 80 } }));

  // ── CLINICAL PRESENTATION ────────────────────────────────────────────────────
  if (data.clinicalPresentation) {
    children.push(sectionHeadingParagraph('CLINICAL PRESENTATION:'));
    children.push(...textParagraphs(data.clinicalPresentation));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  // ── INVESTIGATIONS ───────────────────────────────────────────────────────────
  if (data.investigations.length > 0) {
    children.push(sectionHeadingParagraph('INVESTIGATIONS:'));
    children.push(buildInvestigationsTable(data.investigations));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  // ── TREATMENT GIVEN ────────────────────────────────────────────────────
  if (data.treatmentGiven.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'TREATMENT GIVEN', bold: true, underline: {}, font: 'Calibri', size: 22 })],
        spacing: { before: 80, after: 60 },
      })
    );
    children.push(buildTreatmentTable(data.treatmentGiven));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  // ── COURSE IN THE HOSPITAL/SURGICAL PROCEDURE (boxed) ───────────────────────
  if (data.hospitalCourse) {
    children.push(boxedSection('COURSE IN THE HOSPITAL/SURGICAL PROCEDURE:', data.hospitalCourse));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  if (data.dischargeAdvice) {
    children.push(boxedSection('ADVISE ON DISCHARGE:', data.dischargeAdvice));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  if (data.followUp) {
    children.push(boxedSection('NEXT FOLLOW UP :', data.followUp, 50));
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }

  // ── CONSULTANT NAME AND SIGNATURE (right-aligned) ───────────────────────────
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: '' })],
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'CONSULTANT NAME AND SIGNATURE',
                      bold: true,
                      underline: {},
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.patientName || 'Patient'}_Discharge_Summary.docx`);
};
