import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { DischargeData } from '../types';

export const generateDocx = async (data: DischargeData) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: 'center',
            children: [
              new TextRun({
                text: "DISCHARGE SUMMARY",
                bold: true,
              }),
            ],
            spacing: {
              after: 300,
            }
          }),
          ...(data.dischargeAgainstMedicalAdvice
            ? [
                new Paragraph({
                  alignment: 'center',
                  children: [
                    new TextRun({
                      text: "DISCHARGE AGAINST MEDICAL ADVICE (DAMA)",
                      bold: true,
                      color: "D97706",
                    }),
                  ],
                  spacing: {
                    after: 400,
                  }
                }),
              ]
            : []),
          // Patient Details Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Patient Name: ", bold: true }), new TextRun(data.patientName || "-")] })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Inpatient No (IP NO): ", bold: true }), new TextRun(data.ipNo || "-")] })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Age / Gender: ", bold: true }), new TextRun(`${data.age || '-'} / ${data.gender || '-'}`)] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date of Admission: ", bold: true }), new TextRun(data.admissionDate || "-")] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [] })], // empty cell for spacing
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date of Discharge: ", bold: true }), new TextRun(data.dischargeDate || "-")] })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }), // Spacer
          
          ...createSection("FINAL DIAGNOSIS", data.finalDiagnosis),
          ...createSection("CLINICAL PRESENTATION", data.clinicalPresentation),
          
          ...(data.investigations.length > 0
            ? [
                createSectionHeading("INVESTIGATIONS"),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Investigation", bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Result", bold: true })] })] }),
                      ],
                    }),
                    ...data.investigations.map(
                      (inv) =>
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ text: inv.date })] }),
                            new TableCell({ children: [new Paragraph({ text: inv.category })] }),
                            new TableCell({ children: [new Paragraph({ text: inv.name })] }),
                            new TableCell({ children: [new Paragraph({ text: inv.result })] }),
                          ],
                        })
                    ),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
              ]
            : []),

          ...(data.treatmentGiven.length > 0
            ? [
                createSectionHeading("TREATMENT GIVEN"),
                ...data.treatmentGiven.map((tx) => 
                  new Paragraph({
                    children: [
                      new TextRun({ text: `• ${tx.name}`, bold: true }),
                      new TextRun({ text: ` - ${tx.dosage}` }),
                    ],
                    spacing: { after: 100 }
                  })
                ),
                new Paragraph({ text: "", spacing: { after: 200 } }),
              ]
            : []),

          ...createSection("COURSE IN HOSPITAL", data.hospitalCourse),
          ...createSection("ADVICE ON DISCHARGE", data.dischargeAdvice),
          ...createSection("FOLLOW UP", data.followUp),

          new Paragraph({ text: "", spacing: { after: 600 } }), // Space before signatures

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: 'center', children: [new TextRun({ text: "___________________________" })] }),
                      new Paragraph({ alignment: 'center', children: [new TextRun({ text: "Patient / Relative Signature", bold: true })] })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: 'center', children: [new TextRun({ text: "___________________________" })] }),
                      new Paragraph({ alignment: 'center', children: [new TextRun({ text: "Doctor Signature", bold: true })] })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.patientName || 'Patient'}_Discharge_Summary.docx`);
};

function createSectionHeading(title: string) {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
      }),
    ],
    spacing: {
      before: 200,
      after: 100,
    },
    border: {
      bottom: {
        color: "auto",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  });
}

function createSection(title: string, content: string) {
  if (!content) return [];
  
  const contentParagraphs = content.split('\n').map(line => new Paragraph({
    text: line,
    spacing: { after: 100 }
  }));

  return [
    createSectionHeading(title),
    ...contentParagraphs,
    new Paragraph({ text: "", spacing: { after: 200 } }),
  ];
}
