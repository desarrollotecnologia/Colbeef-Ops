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
  workDate: new Date('2026-07-02'),
  status: 'APPROVED',
  submittedAt: new Date(),
  reviewedAt: new Date(),
  reviewedById: 'admin-1',
  reviewNotes: null,
  pdfPath: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  format: {
    code: 'PREOP_BENEFICIO',
    name: 'Preoperativo de Planta Beneficio',
    documentCode: 'SAI-CAL-F015',
    sheets: [
      {
        id: 'sheet-3',
        formatId: 'fmt-1',
        sheetOrder: 3,
        name: 'Zona Limpia',
        slug: 'zona-limpia',
        fields: [
          {
            id: 'f-zi',
            sheetId: 'sheet-3',
            fieldKey: 'zona_intermedia_prev',
            label: 'Zona intermedia',
            fieldType: 'CHECKLIST',
            required: false,
            manualOnly: true,
            autoFillRule: null,
            options: {
              mode: 'cnc',
              items: [
                { key: 'i_0', label: 'Llave azul para agua' },
                { key: 'i_1', label: 'Mangueras' },
              ],
              columns: ['cnc', 'observation', 'corrective'],
            },
            config: null,
            placeholder: null,
            defaultValue: null,
            sortOrder: 1,
            groupName: null,
            helpText: null,
          },
          {
            id: 'f-zl',
            sheetId: 'sheet-3',
            fieldKey: 'zona_limpia',
            label: 'Zona limpia',
            fieldType: 'CHECKLIST',
            required: false,
            manualOnly: true,
            autoFillRule: null,
            options: {
              mode: 'cnc',
              items: [
                { key: 'l_0', label: 'Sierra canal' },
                { key: 'l_1', label: 'Hidrolavadora' },
              ],
              columns: ['cnc', 'observation', 'corrective'],
            },
            config: null,
            placeholder: null,
            defaultValue: null,
            sortOrder: 2,
            groupName: null,
            helpText: null,
          },
          {
            id: 'f-plat',
            sheetId: 'sheet-3',
            fieldKey: 'plataformas_limpia',
            label: 'Plataformas (PLAT 1-5)',
            fieldType: 'CHECKLIST',
            required: false,
            manualOnly: true,
            autoFillRule: null,
            options: {
              mode: 'cnc',
              items: [{ key: 'p_0', label: 'Base superior elevador' }],
              columns: ['platforms', 'observation', 'corrective'],
              platformCount: 5,
            },
            config: null,
            placeholder: null,
            defaultValue: null,
            sortOrder: 3,
            groupName: 'Plataformas (PLAT 1-5)',
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
      sheetId: 'sheet-3',
      data: {
        zona_intermedia_prev: {
          i_0: { cnc: 'C', observation: 'OK' },
          i_1: { cnc: 'NC', observation: 'Revisar', corrective: 'Limpiar' },
        },
        zona_limpia: {
          l_0: { cnc: 'C' },
          l_1: { cnc: 'NC', observation: 'Fuga' },
        },
        plataformas_limpia: {
          p_0: {
            platforms: { '1': 'C', '2': 'NC', '3': 'C' },
            observation: 'Plat 2 sucia',
          },
        },
      },
    },
  ],
} as Parameters<typeof generateSubmissionPdf>[0];

async function main() {
  const buffer = await generateSubmissionPdf(mockSubmission, { sheetId: 'sheet-3' });
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
