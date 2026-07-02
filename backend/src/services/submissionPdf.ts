import type { FormatField, FormSubmission, FormatSheet, User } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { renderDecomisosSheet, renderVehiculosSheet } from './submissionPdfFormatLayouts';
import {
  MARGIN,
  contentBottom,
  drawMainSheetHeader,
  drawSectionBanner,
  drawSignatures,
  ensurePageSpace,
  formatWorkDate,
  pageWidth,
  startSheetPage,
  str,
  type PdfDoc,
  type SheetPageContext,
} from './submissionPdfDraw';

type FieldOptions = {
  layout?: string;
  tableType?: string;
  mode?: string;
  items?: { key: string; label: string; section?: string }[];
  columns?: string[];
  columnDefs?: { key: string; mode?: string }[];
  cavaColumns?: string[];
  platformCount?: number;
  choices?: string[];
  columns_def?: { key: string; label: string }[];
  entryLabel?: string;
};

type ChecklistItemData = {
  cnc?: string;
  rev_cnc?: string;
  final_cnc?: string;
  observation?: string;
  corrective?: string;
  observations?: Record<string, string>;
  correctives?: Record<string, string>;
  platforms?: Record<string, string>;
  cavas?: Record<string, string>;
};

type SheetWithFields = FormatSheet & { fields: FormatField[] };

export type SubmissionForPdf = FormSubmission & {
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

function needsLandscape(fields: FormatField[]): boolean {
  return fields.some((f) => {
    const opts = (f.options ?? {}) as FieldOptions;
    const colCount = opts.columnDefs?.length ?? opts.cavaColumns?.length ?? 0;
    return colCount >= 6 || (opts.columns?.includes('platforms') && (opts.platformCount ?? 0) >= 5);
  });
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function chunkScopeKey(defs: { key: string }[]): string {
  return defs.map((d) => d.key).join('|');
}

function readScopedText(
  data: ChecklistItemData,
  scopeKey: string | undefined,
  field: 'observation' | 'corrective',
  migrateLegacy = false
): string {
  const mapKey = field === 'observation' ? 'observations' : 'correctives';
  const flatKey = field;
  if (scopeKey) {
    const scoped = data[mapKey]?.[scopeKey];
    if (scoped !== undefined) return scoped;
    if (migrateLegacy && data[flatKey]) return data[flatKey] ?? '';
    return '';
  }
  if (data[mapKey] && Object.keys(data[mapKey]!).length > 0) {
    return Object.entries(data[mapKey]!)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.replace(/\|/g, ' · ')}: ${v}`)
      .join(' | ');
  }
  return data[flatKey] ?? '';
}

function hasNa(opts: FieldOptions): boolean {
  return opts.mode === 'cnc_na' || (opts.choices?.includes('NA') ?? false);
}

function subColsFor(mode?: string): ('C' | 'NC' | 'NA')[] {
  return mode === 'cnc' ? ['C', 'NC'] : ['C', 'NC', 'NA'];
}

function drawTableRowBorder(doc: PdfDoc, y: number, h: number, fill?: string) {
  const w = pageWidth(doc) - MARGIN * 2;
  if (fill) doc.rect(MARGIN, y, w, h).fill(fill);
  doc.rect(MARGIN, y, w, h).strokeColor('#ccc').lineWidth(0.4).stroke();
}

function renderSimpleChecklist(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, ChecklistItemData>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const showNa = hasNa(opts);
  const showObs = opts.columns?.includes('observation');
  const showCorr = opts.columns?.includes('corrective');
  const tableW = pageWidth(doc) - MARGIN * 2;
  let y = startY;

  const cW = showNa ? 16 : 12;
  const cCols = showNa ? 3 : 2;
  const labelW = showObs || showCorr ? 120 : tableW - cW * cCols - 8;
  const obsW = showObs ? (showCorr ? (tableW - labelW - cW * cCols) / 2 : tableW - labelW - cW * cCols) : 0;
  const corrW = showCorr ? (showObs ? obsW : tableW - labelW - cW * cCols) : 0;

  y = ensurePageSpace(doc, ctx, y, 14);
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#333');
  drawTableRowBorder(doc, y, 12, '#f3f4f6');
  doc.text('Equipo / superficie', MARGIN + 3, y + 2, { width: labelW });
  let x = MARGIN + labelW;
  doc.text('C', x, y + 2, { width: cW, align: 'center' });
  doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
  if (showNa) doc.text('NA', x + cW * 2, y + 2, { width: cW, align: 'center' });
  x += cW * cCols;
  if (showObs) doc.text('Observaciones', x, y + 2, { width: obsW });
  if (showCorr) doc.text('Acción correctiva', x + (showObs ? obsW : 0), y + 2, { width: corrW });
  y += 12;

  let lastSection = '';
  for (const item of items) {
    if (item.section && item.section !== lastSection) {
      lastSection = item.section;
      y = ensurePageSpace(doc, ctx, y, 11);
      drawTableRowBorder(doc, y, 10, '#dcfce7');
      doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#111').text(item.section.toUpperCase(), MARGIN + 3, y + 2, {
        width: tableW - 6,
      });
      y += 10;
    }

    const data = value[item.key] ?? {};
    const cnc = data.cnc ?? '';
    const rowH = 11;
    y = ensurePageSpace(doc, ctx, y, rowH);
    drawTableRowBorder(doc, y, rowH);
    doc.fontSize(5.5).font('Helvetica').fillColor('#111').text(item.label, MARGIN + 3, y + 2, { width: labelW - 4 });
    x = MARGIN + labelW;
    doc.text(cnc === 'C' ? 'X' : '', x, y + 2, { width: cW, align: 'center' });
    doc.text(cnc === 'NC' ? 'X' : '', x + cW, y + 2, { width: cW, align: 'center' });
    if (showNa) doc.text(cnc === 'NA' ? 'X' : '', x + cW * 2, y + 2, { width: cW, align: 'center' });
    x += cW * cCols;
    if (showObs) {
      doc.text(readScopedText(data, undefined, 'observation'), x, y + 2, { width: obsW - 2 });
    }
    if (showCorr) {
      doc.text(readScopedText(data, undefined, 'corrective'), x + (showObs ? obsW : 0), y + 2, { width: corrW - 2 });
    }
    y += rowH;
  }
  return y + 6;
}

function renderCavaMatrix(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, ChecklistItemData>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const defs =
    opts.columnDefs?.length
      ? opts.columnDefs
      : (opts.cavaColumns ?? []).map((key) => ({ key, mode: 'cnc_na' as const }));
  const showObs = opts.columns?.includes('observation');
  const showCorr = opts.columns?.includes('corrective');
  const chunks = defs.length > 5 ? chunkArray(defs, 5) : [defs];
  let y = startY;

  chunks.forEach((chunk, ci) => {
    const scope = chunkScopeKey(chunk);
    const subtitle = `${ci + 1}/${chunks.length} · ${chunk[0]?.key} … ${chunk[chunk.length - 1]?.key}`;
    y = ensurePageSpace(doc, ctx, y, 20);
    y = drawSectionBanner(doc, y, field.label, subtitle, true);

    const tableW = pageWidth(doc) - MARGIN * 2;
    const labelW = 88;
    const subW = 9;
    const obsW = showObs ? 70 : 0;
    const corrW = showCorr ? 60 : 0;
    const cavaW = tableW - labelW - obsW - corrW;

    y = ensurePageSpace(doc, ctx, y, 14);
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.text('Equipo / superficie', MARGIN + 2, y + 2, { width: labelW });
    let x = MARGIN + labelW;
    for (const col of chunk) {
      const subs = subColsFor(col.mode);
      doc.text(col.key, x, y + 1, { width: subs.length * subW, align: 'center' });
      x += subs.length * subW;
    }
    if (showObs) doc.text('Obs.', MARGIN + labelW + cavaW, y + 2, { width: obsW });
    if (showCorr) doc.text('AC', MARGIN + labelW + cavaW + obsW, y + 2, { width: corrW });
    y += 11;

    x = MARGIN + labelW;
    drawTableRowBorder(doc, y, 9, '#fafafa');
    for (const col of chunk) {
      for (const sub of subColsFor(col.mode)) {
        doc.text(sub, x, y + 1, { width: subW, align: 'center' });
        x += subW;
      }
    }
    y += 9;

    for (const item of items) {
      const data = value[item.key] ?? {};
      const rowH = 10;
      y = ensurePageSpace(doc, ctx, y, rowH);
      drawTableRowBorder(doc, y, rowH);
      doc.fontSize(5).font('Helvetica').fillColor('#111').text(item.label, MARGIN + 2, y + 1, { width: labelW - 4 });
      x = MARGIN + labelW;
      for (const col of chunk) {
        const mark = data.cavas?.[col.key] ?? '';
        for (const sub of subColsFor(col.mode)) {
          doc.text(mark === sub ? 'X' : '', x, y + 1, { width: subW, align: 'center' });
          x += subW;
        }
      }
      if (showObs) {
        doc.text(readScopedText(data, scope, 'observation', ci === 0), MARGIN + labelW + cavaW, y + 1, { width: obsW - 2 });
      }
      if (showCorr) {
        doc.text(readScopedText(data, scope, 'corrective', ci === 0), MARGIN + labelW + cavaW + obsW, y + 1, { width: corrW - 2 });
      }
      y += rowH;
    }
    y += 4;
  });

  return y;
}

function renderPlatformsTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, ChecklistItemData>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const count = opts.platformCount ?? 5;
  const tableW = pageWidth(doc) - MARGIN * 2;
  const labelW = 100;
  const platW = (tableW - labelW) / (count * 2);
  let y = startY;

  y = ensurePageSpace(doc, ctx, y, 14);
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#333');
  drawTableRowBorder(doc, y, 11, '#f3f4f6');
  doc.text('Equipo / superficie', MARGIN + 3, y + 2, { width: labelW });
  for (let i = 1; i <= count; i++) {
    doc.text(`PLAT ${i}`, MARGIN + labelW + (i - 1) * platW * 2, y + 2, { width: platW * 2, align: 'center' });
  }
  y += 11;

  for (const item of items) {
    const data = value[item.key] ?? {};
    const rowH = 10;
    y = ensurePageSpace(doc, ctx, y, rowH);
    drawTableRowBorder(doc, y, rowH);
    doc.fontSize(5.5).font('Helvetica').text(item.label, MARGIN + 3, y + 1, { width: labelW - 4 });
    for (let i = 1; i <= count; i++) {
      const v = data.platforms?.[String(i)] ?? '';
      doc.text(v || '·', MARGIN + labelW + (i - 1) * platW * 2, y + 1, { width: platW, align: 'center' });
      doc.text('', MARGIN + labelW + (i - 1) * platW * 2 + platW, y + 1, { width: platW });
    }
    y += rowH;
  }
  return y + 6;
}

function renderRepeaterTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  rows: Record<string, unknown>[],
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const rawCols = opts.columns;
  let cols: { key: string; label: string }[] = opts.columns_def ?? [];
  if (Array.isArray(rawCols) && rawCols[0] && typeof rawCols[0] === 'object' && 'key' in (rawCols[0] as object)) {
    cols = rawCols as unknown as { key: string; label: string }[];
  }
  if (cols.length === 0) {
    let y = startY;
    rows.forEach((row, i) => {
      const parts = Object.entries(row)
        .filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => `${k}: ${v}`);
      y = ensurePageSpace(doc, ctx, y, 10);
      doc.fontSize(6.5).font('Helvetica').text(`${i + 1}. ${parts.join(' · ')}`, MARGIN, y, {
        width: pageWidth(doc) - MARGIN * 2,
      });
      y += 10;
    });
    return y + 4;
  }

  const tableW = pageWidth(doc) - MARGIN * 2;
  const colW = tableW / cols.length;
  let y = startY;
  const headerH = 11;

  y = ensurePageSpace(doc, ctx, y, headerH);
  drawTableRowBorder(doc, y, headerH, '#f3f4f6');
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#333');
  cols.forEach((col, i) => doc.text(col.label, MARGIN + i * colW + 2, y + 2, { width: colW - 4 }));
  y += headerH;

  if (rows.length === 0) {
    doc.fontSize(6).font('Helvetica').fillColor('#666').text('Sin registros', MARGIN, y + 2);
    return y + 12;
  }

  rows.forEach((row, ri) => {
    const rowH = 10;
    y = ensurePageSpace(doc, ctx, y, rowH);
    if (ri % 2 === 1) drawTableRowBorder(doc, y, rowH, '#f9fafb');
    else drawTableRowBorder(doc, y, rowH);
    cols.forEach((col, i) => {
      let cell = str(row[col.key]);
      if (col.key === 'decomiso_parcial') cell = String(row[col.key] ?? '') === 'Parcial' ? 'X' : '—';
      if (col.key === 'decomiso_total') cell = String(row[col.key] ?? '') === 'Total' ? 'X' : '—';
      doc.fontSize(5.5).font('Helvetica').fillColor('#111').text(cell, MARGIN + i * colW + 2, y + 1, {
        width: colW - 4,
        align: col.key.startsWith('decomiso_') ? 'center' : 'left',
      });
    });
    y += rowH;
  });
  return y + 6;
}

function renderDaySchedule(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, Record<string, string>>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const tableType = opts.tableType ?? 'cloro';
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;

  if (tableType === 'cloro') {
    const cols = [
      { label: 'Punto', w: 80 },
      { label: 'Hora', w: 36 },
      { label: 'Cloro', w: 40 },
      { label: 'C/NC', w: 28 },
      { label: 'Observaciones', w: w - 184 },
    ];
    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    let x = MARGIN;
    doc.fontSize(6).font('Helvetica-Bold');
    cols.forEach((c) => {
      doc.text(c.label, x, y + 2, { width: c.w });
      x += c.w;
    });
    y += 11;
    for (const [key, row] of Object.entries(value ?? {})) {
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      x = MARGIN;
      doc.fontSize(5.5).font('Helvetica');
      const cells = [key.replace(/_/g, ' '), row.hora ?? '', row.cloro_residual ?? '', row.cnc ?? '', row.observaciones ?? ''];
      cols.forEach((c, i) => {
        doc.text(cells[i] ?? '', x, y + 1, { width: c.w - 2 });
        x += c.w;
      });
      y += 10;
    }
  } else {
    const cols = [
      { label: 'Punto', w: 100 },
      { label: 'Hora', w: 36 },
      { label: 'Temp °C', w: 44 },
      { label: 'C/NC', w: 28 },
      { label: 'Observaciones', w: w - 208 },
    ];
    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    let x = MARGIN;
    doc.fontSize(6).font('Helvetica-Bold');
    cols.forEach((c) => {
      doc.text(c.label, x, y + 2, { width: c.w });
      x += c.w;
    });
    y += 11;
    for (const [key, row] of Object.entries(value ?? {})) {
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      x = MARGIN;
      doc.fontSize(5.5).font('Helvetica');
      const cells = [key.replace(/_/g, ' '), row.hora ?? '', row.temperatura ?? '', row.cnc ?? '', row.observaciones ?? ''];
      cols.forEach((c, i) => {
        doc.text(cells[i] ?? '', x, y + 1, { width: c.w - 2 });
        x += c.w;
      });
      y += 10;
    }
  }
  return y + 6;
}

function renderField(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: unknown,
  y: number
): number {
  if (field.fieldKey === 'empresa') return y;
  const opts = (field.options ?? {}) as FieldOptions;
  const maxW = pageWidth(doc) - MARGIN * 2;

  y = ensurePageSpace(doc, ctx, y, 18);
  if (field.fieldType !== 'CHECKLIST' || !opts.items?.length) {
    y = drawSectionBanner(doc, y, field.label, field.helpText ?? undefined, true);
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'day_schedule_table') {
    return renderDaySchedule(doc, ctx, field, (value as Record<string, Record<string, string>>) ?? {}, y);
  }

  if (field.fieldType === 'CHECKLIST' && opts.items?.length) {
    if (opts.columns?.includes('cavaColumns') || opts.columnDefs?.length || opts.cavaColumns?.length) {
      return renderCavaMatrix(doc, ctx, field, (value as Record<string, ChecklistItemData>) ?? {}, y);
    }
    if (opts.columns?.includes('platforms')) {
      return renderPlatformsTable(doc, ctx, field, (value as Record<string, ChecklistItemData>) ?? {}, y);
    }
    return renderSimpleChecklist(doc, ctx, field, (value as Record<string, ChecklistItemData>) ?? {}, y);
  }

  if (field.fieldType === 'PHOTO') {
    const photos: string[] = [];
    if (Array.isArray(value)) {
      photos.push(...value.filter((v): v is string => typeof v === 'string' && v.startsWith('data:image')));
    } else if (typeof value === 'string' && value.startsWith('data:image')) {
      photos.push(value);
    }
    if (photos.length === 0) {
      doc.fontSize(7).font('Helvetica').fillColor('#666').text('—', MARGIN, y);
      return y + 12;
    }
    let py = y;
    for (const src of photos.slice(0, 8)) {
      py = ensurePageSpace(doc, ctx, py, 70);
      try {
        doc.image(src, MARGIN, py, { fit: [130, 90] });
        py += 96;
      } catch {
        doc.fontSize(7).text('(imagen no disponible)', MARGIN, py);
        py += 12;
      }
    }
    return py + 4;
  }

  if (field.fieldType === 'TEXTAREA') {
    doc.fontSize(7).font('Helvetica').fillColor('#111').text(str(value), MARGIN, y, { width: maxW });
    return y + doc.heightOfString(str(value), { width: maxW }) + 8;
  }

  if (field.fieldType === 'REPEATER' && Array.isArray(value)) {
    return renderRepeaterTable(doc, ctx, field, value as Record<string, unknown>[], y);
  }

  if (field.fieldType === 'REPEATER' && typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    let ry = y;
    for (const [area, rows] of entries) {
      ry = ensurePageSpace(doc, ctx, ry, 14);
      ry = drawSectionBanner(doc, ry, area, undefined, true);
      if (Array.isArray(rows)) {
        ry = renderRepeaterTable(doc, ctx, field, rows as Record<string, unknown>[], ry);
      }
    }
    return ry;
  }

  if (Array.isArray(value)) {
    doc.fontSize(7).font('Helvetica').text(value.join(', '), MARGIN, y, { width: maxW });
    return y + 14;
  }

  doc.fontSize(7).font('Helvetica').fillColor('#111').text(str(value), MARGIN, y, { width: maxW });
  return y + 14;
}

function renderSheetPage(
  doc: PdfDoc,
  submission: SubmissionForPdf,
  sheet: SheetWithFields,
  sheetData: Record<string, unknown>,
  sheetIndex: number,
  totalSheets: number
) {
  const landscape =
    needsLandscape(sheet.fields) ||
    submission.format.code === 'DECOMISOS' ||
    submission.format.code === 'INSPECCION_VEHICULOS';

  const ctx: SheetPageContext = {
    landscape,
    formatName: submission.format.name,
    documentCode: submission.format.documentCode,
    sheetName: sheet.name,
    sheetIndex,
    totalSheets,
    workDate: submission.workDate,
    operatorName: submission.operator.fullName,
    formatCode: submission.format.code,
    compactHeader: submission.format.code === 'INSPECCION_VEHICULOS',
  };

  const fields = sheet.fields.filter((f) => f.fieldKey !== 'empresa');
  const code = submission.format.code;

  let y = startSheetPage(doc, ctx);

  if (code === 'INSPECCION_VEHICULOS') {
    y = renderVehiculosSheet(doc, fields, sheetData, y);
  } else if (code === 'DECOMISOS') {
    y = renderDecomisosSheet(doc, fields, sheetData, y);
  } else {
    for (const field of fields) {
      y = renderField(doc, ctx, field, sheetData[field.fieldKey], y);
      y += 4;
    }
  }

  drawSignatures(doc, submission.operator.fullName, contentBottom(doc) - 28);
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

// Re-export for tests
export { formatWorkDate };
