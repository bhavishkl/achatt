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
  ImageRun,
} from 'docx';
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

function getTodayDate(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

/** Bold + underline heading paragraph (e.g. "FINAL DIAGNOSIS:") */
function sectionHeadingParagraph(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        underline: {},
        font: 'Calibri',
        size: 22,
      }),
    ],
    spacing: { before: 120, after: 60 },
  });
}

function bodyTextRun(text: string, bold = false, underline = false): TextRun {
  return new TextRun({
    text,
    bold,
    underline: underline ? {} : undefined,
    font: 'Calibri',
    size: 22,
  });
}

/** Plain text paragraphs split by newlines */
function textParagraphs(content: string): Paragraph[] {
  return content.split('\n').map(
    (line) =>
      new Paragraph({
        children: [bodyTextRun(line)],
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
    new TableRow({
      children: [
        new TableCell({
          borders: topCellBorders,
          children: [
            new Paragraph({
              children: [bodyTextRun(title, true, true)],
              spacing: { after: 120 },
            }),
          ],
          margins: { top: 80, bottom: 40, left: 100, right: 100 },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: bottomCellBorders,
          children: contentLines.map(
            (line) =>
              new Paragraph({
                children: [bodyTextRun(line)],
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

function buildInvestigationsTable(
  investigations: DischargeData['investigations']
): Table {
  if (!investigations.length) return new Table({ rows: [] });

  const groups = new Map<string, { date: string; result: string; name: string }[]>();
  for (const inv of investigations) {
    const cat = inv.category || 'Other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push({ date: inv.date, result: inv.result, name: inv.name });
  }

  const rows: TableRow[] = [];

  for (const [category, entries] of groups) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            borders: allSingleBorders,
            shading: { type: ShadingType.CLEAR, fill: 'FFFFFF' },
            children: [
              new Paragraph({
                children: [bodyTextRun(category, true)],
                spacing: { after: 0 },
              }),
            ],
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
          }),
        ],
      })
    );

    for (const entry of entries) {
      const rawFinding = entry.name
        ? entry.result
          ? `${entry.name}- ${entry.result}`
          : entry.name
        : entry.result;

      const findingLines = rawFinding.split('\n');

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: allSingleBorders,
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [bodyTextRun(entry.date)],
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
                    children: [bodyTextRun(line)],
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
            children: [bodyTextRun(text)],
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

// ─── Patient info table ──────────────────────────────────────────────────────────

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
            bodyTextRun(`${label}  `, true),
            bodyTextRun(value),
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

// ─── Header image ────────────────────────────────────────────────────────────────

function buildHeaderImageParagraph(imageDataUrl?: string): Paragraph | null {
  if (!imageDataUrl?.startsWith('data:image/')) return null;

  try {
    const mimeMatch = imageDataUrl.match(/^data:(.+);base64,/);
    const mimeType = mimeMatch?.[1] || 'image/png';
    const base64 = imageDataUrl.replace(/^data:.+;base64,/, '');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    const imageType = mimeType === 'image/jpeg' || mimeType === 'image/jpg'
      ? 'jpg'
      : mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/gif'
          ? 'gif'
          : mimeType === 'image/bmp'
            ? 'bmp'
            : null;

    if (!imageType) return null;

    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: bytes,
          type: imageType,
          transformation: { width: 600, height: 170 },
        }),
      ],
      spacing: { after: 140 },
    });
  } catch {
    return null;
  }
}

// ─── Save helper ─────────────────────────────────────────────────────────────────

async function saveDocxBlob(blob: Blob, fileName: string): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Word Document',
            accept: {
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if ((e as any).name === 'AbortError') return;
    }
  }
  const { saveAs } = await import('file-saver');
  saveAs(blob, fileName);
}

// ─── Main export ────────────────────────────────────────────────────────────────

export const generateDocx = async (data: DischargeData, headerImageDataUrl?: string) => {
  const children: (Paragraph | Table)[] = [];

  const headerImageParagraph = buildHeaderImageParagraph(headerImageDataUrl);
  if (headerImageParagraph) {
    children.push(headerImageParagraph);
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [bodyTextRun('DISCHARGE SUMMARY', true, true)],
      spacing: { after: 160 },
    })
  );

  if (data.dischargeAgainstMedicalAdvice) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'DISCHARGE AGAINST MEDICAL ADVICE (DAMA)',
            bold: true,
            color: 'D97706',
            font: 'Calibri',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  children.push(buildPatientTable(data));
  children.push(new Paragraph({ text: '', spacing: { after: 80 } }));

  children.push(sectionHeadingParagraph('FINAL DIAGNOSIS:'));
  if (data.finalDiagnosis) {
    children.push(...textParagraphs(data.finalDiagnosis));
  }
  children.push(new Paragraph({ text: '', spacing: { after: 80 } }));

  if (data.clinicalPresentation) {
    children.push(sectionHeadingParagraph('CLINICAL PRESENTATION:'));
    children.push(...textParagraphs(data.clinicalPresentation));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  if (data.investigations.length > 0) {
    children.push(sectionHeadingParagraph('INVESTIGATIONS:'));
    children.push(buildInvestigationsTable(data.investigations));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

  if (data.treatmentGiven.length > 0) {
    children.push(
      new Paragraph({
        children: [bodyTextRun('TREATMENT GIVEN', true, true)],
        spacing: { before: 80, after: 60 },
      })
    );
    children.push(buildTreatmentTable(data.treatmentGiven));
    children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
  }

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
                  children: [bodyTextRun('CONSULTANT NAME AND SIGNATURE', true, true)],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const patientName = sanitizeFileName(data.patientName || 'Patient');
  const dateStr = getTodayDate();
  const fileName = `Discharge Summary ${patientName} ${dateStr}.docx`;
  await saveDocxBlob(blob, fileName);
};