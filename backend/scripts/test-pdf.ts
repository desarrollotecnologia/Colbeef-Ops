/**
 * Prueba local de generación PDF (sin base de datos).
 * Uso: npx tsx scripts/test-pdf.ts
 */
import fs from 'fs';
import path from 'path';
import { generateSubmissionPdf } from '../src/services/submissionPdf';

const mockSubmission = {
  id: 'test-id',
  formatId: 'fmt-1',
  operatorId: 'op-1',
  workDate: new Date('2026-06-10'),
  status: 'APPROVED',
  submittedAt: new Date(),
  reviewedAt: new Date(),
  reviewedById: 'admin-1',
  reviewNotes: null,
  pdfPath: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  format: {
    name: 'Preoperativo Planta Beneficio',
    documentCode: 'SAI-CAL-F015',
    sheets: [
      {
        id: 'sheet-1',
        formatId: 'fmt-1',
        sheetOrder: 1,
        name: 'Zona Sangría',
        slug: 'zona-sangria',
        fields: [
          {
            id: 'f1',
            sheetId: 'sheet-1',
            fieldKey: 'zona_sangria',
            label: 'Zona sangría',
            fieldType: 'CHECKLIST',
            required: false,
            manualOnly: true,
            autoFillRule: null,
            options: {
              mode: 'cnc',
              items: [
                { key: 'zs_0', label: 'Cajón de noqueo' },
                { key: 'zs_1', label: 'Plataformas fijas' },
              ],
              columns: ['cnc', 'observation', 'corrective'],
            },
            config: null,
            placeholder: null,
            defaultValue: null,
            sortOrder: 1,
            groupName: 'Zona sangría',
            helpText: null,
          },
        ],
      },
      {
        id: 'sheet-8',
        formatId: 'fmt-1',
        sheetOrder: 8,
        name: 'Cavas',
        slug: 'cavas',
        fields: [
          {
            id: 'f8',
            sheetId: 'sheet-8',
            fieldKey: 'condensacion',
            label: 'Condensación',
            fieldType: 'CHECKLIST',
            required: false,
            manualOnly: true,
            autoFillRule: null,
            options: {
              mode: 'cnc_na',
              items: [{ key: 'almacenamiento', label: 'Área de almacenamiento' }],
              columns: ['cavaColumns'],
              columnDefs: [
                { key: 'C#10', mode: 'cnc_na' },
                { key: 'C#9', mode: 'cnc_na' },
                { key: 'PRE', mode: 'cnc' },
              ],
            },
            config: null,
            placeholder: null,
            defaultValue: null,
            sortOrder: 1,
            groupName: 'Condensación',
            helpText: null,
          },
        ],
      },
    ],
  },
  operator: { fullName: 'Operario de Prueba' },
  reviewedBy: { fullName: 'Jefe de Área' },
  sheets: [
    {
      sheetId: 'sheet-1',
      data: {
        zona_sangria: {
          zs_0: { cnc: 'C', observation: 'OK' },
          zs_1: { cnc: 'NC', observation: 'Revisar', corrective: 'Limpiar' },
        },
      },
    },
    {
      sheetId: 'sheet-8',
      data: {
        condensacion: {
          almacenamiento: {
            cavas: { 'C#10': 'C', 'C#9': 'NA', PRE: 'C' },
          },
        },
      },
    },
  ],
} as Parameters<typeof generateSubmissionPdf>[0];

async function main() {
  const buffer = await generateSubmissionPdf(mockSubmission);
  const outPath = path.join(__dirname, '..', 'test-output.pdf');
  fs.writeFileSync(outPath, buffer);

  const isPdf = buffer.subarray(0, 5).toString() === '%PDF-';
  console.log(`Archivo: ${outPath}`);
  console.log(`Tamaño: ${buffer.length} bytes`);
  console.log(`Válido PDF: ${isPdf ? 'SÍ' : 'NO'}`);
  if (!isPdf) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
