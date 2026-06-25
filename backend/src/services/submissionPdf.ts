import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { FormatField, FormSubmission, FormatSheet, User } from '@prisma/client';
import { renderDecomisosSheet, renderVehiculosSheet } from './submissionPdfFormatLayouts';

type PdfDoc = InstanceType<typeof PDFDocument>;

type FieldOptions = {
  layout?: string;
  tableType?: string;
  mode?: string;
  items?: { key: string; label: string }[];
  columns?: string[];
  columnDefs?: { key: string; mode?: string }[];
  cavaColumns?: string[];
  platformCount?: number;
  choices?: string[];
};

type ChecklistItemData = {
  cnc?: string;
  rev_cnc?: string;
  final_cnc?: string;
  observation?: string;
  corrective?: string;
  platforms?: Record<string, string>;
  cavas?: Record<string, string>;
};

type SheetWithFields = FormatSheet & { fields: FormatField[] };

type SubmissionForPdf = FormSubmission & {
  format: {
    code: string;
    name: string;
    documentCode: string | null;
    sheets: SheetWithFields[];
  };
  operator: Pick<User, 'fullName'>;
  reviewedBy: Pick<User, 'fullName'> | null;
  sheets: { sheetId: string; data: unknown }[];
};

const MARGIN = 28;
const FOOTER_H = 36;

function formatWorkDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Bogota',
  });
}

function resolveLogoPath(): string | null {
  const candidates = [
    path.join(__dirname, '../../../frontend/public/colbeef-wordmark.png'),
    path.join(__dirname, '../../../frontend/dist/colbeef-wordmark.png'),
    path.join(process.cwd(), 'frontend/public/colbeef-wordmark.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function pageSize(doc: PdfDoc) {
  return { width: doc.page.width, height: doc.page.height };
}

function contentBottom(doc: PdfDoc) {
  return pageSize(doc).height - MARGIN - FOOTER_H;
}

function needsLandscape(fields: FormatField[]): boolean {
  return fields.some((f) => {
    const opts = (f.options ?? {}) as FieldOptions;
    const colCount =
      opts.columnDefs?.length ?? opts.cavaColumns?.length ?? 0;
    return colCount >= 6 || (opts.columns?.includes('platforms') && (opts.platformCount ?? 0) >= 5);
  });
}

function drawSheetHeader(
  doc: PdfDoc,
  submission: SubmissionForPdf,
  sheet: SheetWithFields,
  sheetIndex: number,
  totalSheets: number
) {
  const { width } = pageSize(doc);
  const logo = resolveLogoPath();
  let y = MARGIN;

  if (logo) {
    try {
      doc.image(logo, MARGIN, y, { width: 90 });
    } catch {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF', MARGIN, y);
    }
  } else {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF', MARGIN, y);
  }

  const centerX = width / 2;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#333')
    .text('SISTEMA DE ASEGURAMIENTO DE LA INOCUIDAD', centerX - 120, y, { width: 240, align: 'center' });
  doc.fontSize(9).text(submission.format.name.toUpperCase(), centerX - 120, y + 12, { width: 240, align: 'center' });
  doc.fontSize(8).fillColor('#444').text('COLBEEF S.A.S', centerX - 120, y + 26, { width: 240, align: 'center' });

  const metaX = width - MARGIN - 110;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#333')
    .text(`Hoja: ${sheetIndex + 1} / ${totalSheets}`, metaX, y, { width: 110, align: 'right' });
  if (submission.format.documentCode) {
    doc.text(`Código: ${submission.format.documentCode}`, metaX, y + 10, { width: 110, align: 'right' });
  }

  y += 48;
  doc.moveTo(MARGIN, y).lineTo(width - MARGIN, y).strokeColor('#333').lineWidth(1).stroke();
  y += 6;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#111')
    .text(`Fecha: ${formatWorkDate(submission.workDate)}`, MARGIN, y);
  doc.text(`Operario: ${submission.operator.fullName}`, MARGIN + 200, y);
  doc.text(`Hoja: ${sheet.name}`, MARGIN + 400, y, { width: width - MARGIN - 400 - MARGIN });

  y += 14;
  doc.moveTo(MARGIN, y).lineTo(width - MARGIN, y).strokeColor('#999').lineWidth(0.5).stroke();

  return y + 10;
}

function drawSignatures(
  doc: PdfDoc,
  submission: SubmissionForPdf,
  y: number
) {
  const { width } = pageSize(doc);
  const bottom = contentBottom(doc);
  if (y > bottom - 40) y = bottom - 40;

  const colW = (width - MARGIN * 2) / 2;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#555').text('ELABORÓ', MARGIN, y);
  doc.fontSize(9).font('Helvetica').fillColor('#111').text(submission.operator.fullName, MARGIN, y + 10, { width: colW - 10 });
  doc.moveTo(MARGIN, y + 24).lineTo(MARGIN + colW - 16, y + 24).strokeColor('#666').stroke();

  const verifico = submission.reviewedBy?.fullName ?? '—';
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#555').text('VERIFICÓ', MARGIN + colW, y);
  doc.fontSize(9).font('Helvetica').fillColor('#111').text(verifico, MARGIN + colW, y + 10, { width: colW - 10 });
  doc.moveTo(MARGIN + colW, y + 24).lineTo(width - MARGIN, y + 24).strokeColor('#666').stroke();

  return y + 32;
}

function ensureSpace(doc: PdfDoc, y: number, needed: number): number {
  if (y + needed <= contentBottom(doc)) return y;
  return y;
}

function drawFieldLabel(doc: PdfDoc, label: string, x: number, y: number, maxW: number) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333').text(label, x, y, { width: maxW });
  return doc.heightOfString(label, { width: maxW }) + y + 2;
}

function drawTextValue(doc: PdfDoc, text: string, x: number, y: number, maxW: number) {
  doc.fontSize(8).font('Helvetica').fillColor('#111').text(text || '—', x, y, { width: maxW });
  return doc.heightOfString(text || '—', { width: maxW }) + y + 6;
}

function renderChecklistTable(
  doc: PdfDoc,
  field: FormatField,
  value: Record<string, ChecklistItemData>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const { width } = pageSize(doc);
  const tableW = width - MARGIN * 2;
  let y = startY;

  if (opts.columns?.includes('cavaColumns') || opts.columnDefs?.length || opts.cavaColumns?.length) {
    const defs =
      opts.columnDefs?.length
        ? opts.columnDefs
        : (opts.cavaColumns ?? []).map((key) => ({ key, mode: 'cnc_na' }));
    const itemColW = 90;
    const subW = Math.min(14, (tableW - itemColW) / (defs.length * 3));

    doc.fontSize(6).font('Helvetica-Bold');
    doc.text('Ítem', MARGIN, y, { width: itemColW });
    let x = MARGIN + itemColW;
    for (const col of defs) {
      const span = col.mode === 'cnc' ? 2 : 3;
      doc.text(col.key, x, y, { width: subW * span, align: 'center' });
      x += subW * span;
    }
    y += 10;

    for (const item of items) {
      if (y > contentBottom(doc) - 12) break;
      const data = value[item.key] ?? {};
      doc.fontSize(5.5).font('Helvetica').text(item.label, MARGIN, y, { width: itemColW - 2 });
      x = MARGIN + itemColW;
      for (const col of defs) {
        const v = data.cavas?.[col.key] ?? '';
        const span = col.mode === 'cnc' ? 2 : 3;
        doc.text(v || '·', x, y, { width: subW * span, align: 'center' });
        x += subW * span;
      }
      y += 9;
    }
    return y + 4;
  }

  if (opts.columns?.includes('platforms')) {
    const count = opts.platformCount ?? 5;
    const itemColW = 100;
    const platW = (tableW - itemColW) / (count * 2);
    doc.fontSize(6).font('Helvetica-Bold').text('Ítem', MARGIN, y, { width: itemColW });
    for (let i = 1; i <= count; i++) {
      doc.text(`P${i}`, MARGIN + itemColW + (i - 1) * platW * 2, y, { width: platW * 2, align: 'center' });
    }
    y += 10;
    for (const item of items) {
      if (y > contentBottom(doc) - 12) break;
      const data = value[item.key] ?? {};
      doc.fontSize(5.5).font('Helvetica').text(item.label, MARGIN, y, { width: itemColW - 2 });
      for (let i = 1; i <= count; i++) {
        const v = data.platforms?.[String(i)] ?? '';
        doc.text(v || '·', MARGIN + itemColW + (i - 1) * platW * 2, y, { width: platW, align: 'center' });
        doc.text('', MARGIN + itemColW + (i - 1) * platW * 2 + platW, y, { width: platW });
      }
      y += 9;
    }
    return y + 4;
  }

  const cW = 22;
  const obsW = tableW - 140 - cW * 3;
  doc.fontSize(6).font('Helvetica-Bold');
  doc.text('Equipo / superficie', MARGIN, y, { width: 130 });
  doc.text('C', MARGIN + 132, y, { width: cW, align: 'center' });
  doc.text('NC', MARGIN + 132 + cW, y, { width: cW, align: 'center' });
  if (opts.choices?.includes('NA') || opts.mode === 'cnc_na') {
    doc.text('NA', MARGIN + 132 + cW * 2, y, { width: cW, align: 'center' });
  }
  doc.text('Observaciones', MARGIN + 132 + cW * 3, y, { width: obsW });
  y += 10;

  for (const item of items) {
    if (y > contentBottom(doc) - 12) break;
    const data = value[item.key] ?? {};
    const cnc = data.cnc ?? '';
    doc.fontSize(5.5).font('Helvetica').text(item.label, MARGIN, y, { width: 128 });
    doc.text(cnc === 'C' ? 'X' : '', MARGIN + 132, y, { width: cW, align: 'center' });
    doc.text(cnc === 'NC' ? 'X' : '', MARGIN + 132 + cW, y, { width: cW, align: 'center' });
    if (opts.choices?.includes('NA') || opts.mode === 'cnc_na') {
      doc.text(cnc === 'NA' ? 'X' : '', MARGIN + 132 + cW * 2, y, { width: cW, align: 'center' });
    }
    const obs = [data.observation, data.corrective].filter(Boolean).join(' / ');
    doc.text(obs, MARGIN + 132 + cW * 3, y, { width: obsW });
    y += 9;
  }
  return y + 4;
}

function renderDaySchedule(
  doc: PdfDoc,
  field: FormatField,
  value: Record<string, Record<string, string>>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const tableType = opts.tableType ?? 'cloro';
  let y = startY;
  const { width } = pageSize(doc);

  if (tableType === 'cloro') {
    doc.fontSize(6).font('Helvetica-Bold');
    doc.text('Punto', MARGIN, y, { width: 80 });
    doc.text('Cloro', MARGIN + 82, y, { width: 40 });
    doc.text('pH', MARGIN + 124, y, { width: 30 });
    doc.text('C/NC', MARGIN + 156, y, { width: 30 });
    doc.text('Observaciones', MARGIN + 188, y, { width: width - MARGIN - 188 });
    y += 10;
    for (const [key, row] of Object.entries(value ?? {})) {
      if (y > contentBottom(doc) - 10) break;
      doc.fontSize(5.5).font('Helvetica');
      doc.text(key.replace(/_/g, ' '), MARGIN, y, { width: 80 });
      doc.text(row.cloro_residual ?? '', MARGIN + 82, y, { width: 40 });
      doc.text(row.ph ?? '7.0', MARGIN + 124, y, { width: 30 });
      doc.text(row.cnc ?? '', MARGIN + 156, y, { width: 30 });
      doc.text(row.observaciones ?? '', MARGIN + 188, y, { width: width - MARGIN - 188 });
      y += 9;
    }
  } else {
    doc.fontSize(6).font('Helvetica-Bold');
    doc.text('Punto', MARGIN, y, { width: 100 });
    doc.text('Temp °C', MARGIN + 102, y, { width: 50 });
    doc.text('C/NC', MARGIN + 154, y, { width: 30 });
    doc.text('Observaciones', MARGIN + 186, y, { width: width - MARGIN - 186 });
    y += 10;
    for (const [key, row] of Object.entries(value ?? {})) {
      if (y > contentBottom(doc) - 10) break;
      doc.fontSize(5.5).font('Helvetica');
      doc.text(key.replace(/_/g, ' '), MARGIN, y, { width: 100 });
      doc.text(row.temperatura ?? '', MARGIN + 102, y, { width: 50 });
      doc.text(row.cnc ?? '', MARGIN + 154, y, { width: 30 });
      doc.text(row.observaciones ?? '', MARGIN + 186, y, { width: width - MARGIN - 186 });
      y += 9;
    }
  }
  return y + 6;
}

function renderField(
  doc: PdfDoc,
  field: FormatField,
  value: unknown,
  y: number
): number {
  if (field.fieldKey === 'empresa') return y;
  const { width } = pageSize(doc);
  const maxW = width - MARGIN * 2;
  const opts = (field.options ?? {}) as FieldOptions;

  y = ensureSpace(doc, y, 14);
  y = drawFieldLabel(doc, field.label, MARGIN, y, maxW);

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'day_schedule_table') {
    return renderDaySchedule(doc, field, value as Record<string, Record<string, string>>, y);
  }

  if (field.fieldType === 'CHECKLIST' && opts.items?.length) {
    return renderChecklistTable(doc, field, (value as Record<string, ChecklistItemData>) ?? {}, y);
  }

  if (field.fieldType === 'PHOTO') {
    const photos: string[] = [];
    if (Array.isArray(value)) {
      photos.push(...value.filter((v): v is string => typeof v === 'string' && v.startsWith('data:image')));
    } else if (typeof value === 'string' && value.startsWith('data:image')) {
      photos.push(value);
    }
    if (photos.length === 0) {
      return drawTextValue(doc, '—', MARGIN, y, maxW);
    }
    let py = y;
    for (const src of photos.slice(0, 6)) {
      if (py > contentBottom(doc) - 60) break;
      try {
        doc.image(src, MARGIN, py, { fit: [120, 80] });
        py += 86;
      } catch {
        py = drawTextValue(doc, '(imagen no disponible)', MARGIN, py, maxW);
      }
    }
    return py + 4;
  }

  if (field.fieldType === 'TEXTAREA') {
    return drawTextValue(doc, String(value ?? ''), MARGIN, y, maxW);
  }

  if (field.fieldType === 'REPEATER' && Array.isArray(value)) {
    const rows = value as Record<string, unknown>[];
    let ry = y;
    rows.forEach((row, i) => {
      const parts = Object.entries(row)
        .filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => `${k}: ${v}`);
      doc.fontSize(7).font('Helvetica').text(`${i + 1}. ${parts.join(' · ')}`, MARGIN, ry, { width: maxW });
      ry += 10;
    });
    return ry + 4;
  }

  if (Array.isArray(value)) {
    return drawTextValue(doc, value.join(', '), MARGIN, y, maxW);
  }

  return drawTextValue(doc, String(value ?? ''), MARGIN, y, maxW);
}

function renderSheetPage(
  doc: PdfDoc,
  submission: SubmissionForPdf,
  sheet: SheetWithFields,
  sheetData: Record<string, unknown>,
  sheetIndex: number,
  totalSheets: number
) {
  let y = drawSheetHeader(doc, submission, sheet, sheetIndex, totalSheets);
  const fields = sheet.fields.filter((f) => f.fieldKey !== 'empresa');
  const code = submission.format.code;

  if (code === 'INSPECCION_VEHICULOS') {
    y = renderVehiculosSheet(doc, fields, sheetData, y);
  } else if (code === 'DECOMISOS') {
    y = renderDecomisosSheet(doc, fields, sheetData, y);
  } else {
    for (const field of fields) {
      if (y > contentBottom(doc) - 20) break;
      y = renderField(doc, field, sheetData[field.fieldKey], y);
      y += 4;
    }
  }

  drawSignatures(doc, submission, contentBottom(doc) - 28);
}

export function generateSubmissionPdf(submission: SubmissionForPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const formatSheets = [...submission.format.sheets].sort((a, b) => a.sheetOrder - b.sheetOrder);

    if (formatSheets.length === 0) {
      doc.addPage({ size: 'A4', margin: MARGIN });
      doc.fontSize(12).text('Formato sin hojas configuradas.', MARGIN, MARGIN);
      doc.end();
      return;
    }

    formatSheets.forEach((sheet, index) => {
      const sheetData =
        (submission.sheets.find((s) => s.sheetId === sheet.id)?.data as Record<string, unknown>) ?? {};
      const landscape =
        needsLandscape(sheet.fields) ||
        submission.format.code === 'DECOMISOS' ||
        submission.format.code === 'INSPECCION_VEHICULOS';
      doc.addPage({
        size: 'A4',
        layout: landscape ? 'landscape' : 'portrait',
        margin: MARGIN,
      });
      renderSheetPage(doc, submission, sheet, sheetData, index, formatSheets.length);
    });

    doc.end();
  });
}

export function buildPdfFilename(submission: SubmissionForPdf): string {
  const date =
    submission.workDate instanceof Date
      ? submission.workDate.toISOString().slice(0, 10)
      : String(submission.workDate).slice(0, 10);
  const code = submission.format.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);
  return `${code}_${date}.pdf`;
}
