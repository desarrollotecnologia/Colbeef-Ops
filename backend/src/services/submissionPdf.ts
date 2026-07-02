import type { FormatField, FormSubmission, FormatSheet, User } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { getDayKey, slugifyPoint } from '../utils/dayKey';
import { renderDecomisosSheet, renderVehiculosSheet } from './submissionPdfFormatLayouts';
import {
  MARGIN,
  contentBottom,
  drawSectionBanner,
  drawSheetBoundaryEnd,
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
  items?: { key: string; label: string; section?: string; naTemp?: boolean; naPresion?: boolean }[];
  columns?: string[] | { key: string; label: string }[];
  columnDefs?: { key: string; mode?: string }[];
  cavaColumns?: string[];
  platformCount?: number;
  choices?: string[];
  columns_def?: { key: string; label: string }[];
  entryLabel?: string;
  schedule?: Record<string, string[]>;
  areaLabel?: string;
  pediluviosLayout?: string;
  valorLabel?: string;
  allowAddEquipos?: boolean;
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

export type PdfGenerationOptions = {
  /** Solo incluir esta hoja del formato (por id) */
  sheetId?: string;
  /** Barras de inicio/fin entre hojas (PDF completo) */
  sheetBoundaries?: boolean;
};

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

function stringColumns(opts: FieldOptions): string[] {
  const raw = opts.columns;
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is string => typeof c === 'string');
}

function needsLandscape(fields: FormatField[]): boolean {
  return fields.some((f) => {
    const opts = (f.options ?? {}) as FieldOptions;
    const colCount = opts.columnDefs?.length ?? opts.cavaColumns?.length ?? 0;
    return colCount >= 6 || (stringColumns(opts).includes('platforms') && (opts.platformCount ?? 0) >= 5);
  });
}

const COMPACT_HEADER_CODES = new Set(['INSPECCION_VEHICULOS', 'DECOMISOS', 'DEVOLUCIONES']);

function usesCompactHeader(formatCode: string): boolean {
  return COMPACT_HEADER_CODES.has(formatCode);
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
  if (fill) {
    doc.fillColor(fill).rect(MARGIN, y, w, h).fill();
  }
  doc.strokeColor('#ccc').lineWidth(0.4).rect(MARGIN, y, w, h).stroke();
  doc.fillColor('#111');
}

function normalizeCnc(value: unknown): string {
  const s = String(value ?? '')
    .trim()
    .toUpperCase();
  return s === 'C' || s === 'NC' || s === 'NA' ? s : '';
}

function markCnc(value: unknown, choice?: string): string {
  const cnc = normalizeCnc(value);
  if (choice) return cnc === choice ? 'X' : '—';
  return cnc ? cnc : '—';
}

function readItemCnc(data: ChecklistItemData | undefined): string {
  if (!data) return '';
  return normalizeCnc(data.cnc ?? data.rev_cnc ?? data.final_cnc);
}

function readPlatformCnc(platforms: Record<string, string> | undefined, plat: number): string {
  if (!platforms) return '';
  const key = String(plat);
  return normalizeCnc(platforms[key] ?? (platforms as Record<number, string>)[plat]);
}

function drawCncMark(
  doc: PdfDoc,
  x: number,
  y: number,
  cnc: string,
  choice: string,
  width: number
): void {
  if (cnc !== choice) return;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000').text('X', x, y, { width, align: 'center' });
}

function drawCncCells(
  doc: PdfDoc,
  x: number,
  y: number,
  cnc: string,
  cW: number,
  showNa: boolean
): number {
  drawCncMark(doc, x, y, cnc, 'C', cW);
  drawCncMark(doc, x + cW, y, cnc, 'NC', cW);
  if (showNa) drawCncMark(doc, x + cW * 2, y, cnc, 'NA', cW);
  return x + cW * (showNa ? 3 : 2);
}

function coerceChecklistRecord(value: unknown): Record<string, ChecklistItemData> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, ChecklistItemData>;
}

function checklistColumnFlags(opts: FieldOptions) {
  const raw = opts.columns;
  const cols =
    Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string'
      ? (raw as string[])
      : ['cnc', 'observation', 'corrective'];
  return {
    showCnc: cols.includes('cnc'),
    showObs: cols.includes('observation'),
    showCorr: cols.includes('corrective'),
  };
}

function scheduleForField(field: FormatField, opts: FieldOptions): Record<string, string[]> {
  const fromOpts = opts.schedule;
  if (fromOpts && Object.keys(fromOpts).length > 0) return fromOpts;
  const fromConfig = (field.config as { schedule?: Record<string, string[]> } | null)?.schedule;
  return fromConfig ?? {};
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
  const { showCnc, showObs, showCorr } = checklistColumnFlags(opts);
  const showNa = hasNa(opts);
  const tableW = pageWidth(doc) - MARGIN * 2;
  let y = startY;

  y = drawSectionBanner(doc, y, field.label, field.helpText ?? 'C / NC — marque con X', true);

  const cW = 16;
  const cCols = showNa ? 3 : 2;
  const obsW = showObs ? 88 : 0;
  const corrW = showCorr ? 76 : 0;
  const cncBlockW = showCnc ? cW * cCols : 0;
  const labelW = Math.max(100, tableW - cncBlockW - obsW - corrW - 6);

  y = ensurePageSpace(doc, ctx, y, 14);
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#333');
  drawTableRowBorder(doc, y, 12, '#f3f4f6');
  doc.text('Equipo / superficie', MARGIN + 3, y + 2, { width: labelW });
  let x = MARGIN + labelW;
  if (showCnc) {
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    if (showNa) doc.text('NA', x + cW * 2, y + 2, { width: cW, align: 'center' });
    x += cW * cCols;
  }
  if (showObs) doc.text('Observaciones', x, y + 2, { width: obsW });
  if (showCorr) doc.text('Acción correctiva', x + obsW, y + 2, { width: corrW });
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
    const cnc = readItemCnc(data);
    const rowH = 11;
    y = ensurePageSpace(doc, ctx, y, rowH);
    drawTableRowBorder(doc, y, rowH);
    doc.fontSize(5.5).font('Helvetica').fillColor('#111').text(item.label, MARGIN + 3, y + 2, { width: labelW - 4 });
    x = MARGIN + labelW;
    if (showCnc) {
      x = drawCncCells(doc, x, y + 1, cnc, cW, showNa);
    }
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
  const colFlags = stringColumns(opts);
  const showObs = colFlags.includes('observation');
  const showCorr = colFlags.includes('corrective');
  const chunks = defs.length > 5 ? chunkArray(defs, 5) : [defs];
  let y = drawSectionBanner(doc, startY, field.label, field.helpText ?? 'C / NC / NA por cava', true);

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
        const mark = normalizeCnc(data.cavas?.[col.key]);
        for (const sub of subColsFor(col.mode)) {
          drawCncMark(doc, x, y + 1, mark, sub, subW);
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
  const { showObs, showCorr } = checklistColumnFlags(opts);
  const tableW = pageWidth(doc) - MARGIN * 2;
  const platSubW = 12;
  const platBlockW = platSubW * 2;
  const platTotalW = count * platBlockW;
  const obsW = showObs ? 72 : 0;
  const corrW = showCorr ? 68 : 0;
  const labelW = Math.max(80, tableW - platTotalW - obsW - corrW - 4);
  let y = startY;

  y = drawSectionBanner(doc, y, field.label, `PLAT 1 – ${count} · C / NC por plataforma`, true);

  y = ensurePageSpace(doc, ctx, y, 14);
  doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
  drawTableRowBorder(doc, y, 11, '#f3f4f6');
  doc.text('Equipo / superficie', MARGIN + 3, y + 2, { width: labelW });
  let x = MARGIN + labelW;
  for (let i = 1; i <= count; i++) {
    doc.text(`P${i}`, x, y + 1, { width: platBlockW, align: 'center' });
    x += platBlockW;
  }
  if (showObs) doc.text('Observaciones', x, y + 2, { width: obsW });
  if (showCorr) doc.text('Acción correctiva', x + (showObs ? obsW : 0), y + 2, { width: corrW });
  y += 11;
  drawTableRowBorder(doc, y, 9, '#fafafa');
  x = MARGIN + labelW;
  for (let i = 0; i < count; i++) {
    doc.text('C', x, y + 1, { width: platSubW, align: 'center' });
    doc.text('NC', x + platSubW, y + 1, { width: platSubW, align: 'center' });
    x += platBlockW;
  }
  y += 9;

  for (const item of items) {
    const data = value[item.key] ?? {};
    const rowH = 10;
    y = ensurePageSpace(doc, ctx, y, rowH);
    drawTableRowBorder(doc, y, rowH);
    doc.fontSize(5.5).font('Helvetica').fillColor('#111').text(item.label, MARGIN + 3, y + 1, { width: labelW - 4 });
    x = MARGIN + labelW;
    for (let i = 1; i <= count; i++) {
      const v = readPlatformCnc(data.platforms, i);
      drawCncMark(doc, x, y + 1, v, 'C', platSubW);
      drawCncMark(doc, x + platSubW, y + 1, v, 'NC', platSubW);
      x += platBlockW;
    }
    if (showObs) {
      doc.fontSize(5.5).font('Helvetica').fillColor('#111').text(data.observation ?? '', x, y + 1, { width: obsW - 2 });
    }
    if (showCorr) {
      doc
        .fontSize(5.5)
        .font('Helvetica')
        .fillColor('#111')
        .text(data.corrective ?? '', x + (showObs ? obsW : 0), y + 1, { width: corrW - 2 });
    }
    y += rowH;
  }
  return y + 6;
}

function renderPoesOperativoTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, Record<string, unknown>>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  let y = drawSectionBanner(doc, startY, field.label, field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const labelW = 90;
  const cellW = (w - labelW) / 12;

  y = ensurePageSpace(doc, ctx, y, 12);
  drawTableRowBorder(doc, y, 11, '#f3f4f6');
  doc.fontSize(5).font('Helvetica-Bold');
  doc.text('Equipo', MARGIN, y + 2, { width: labelW });
  doc.text('Toma 1: Temp · C/NC est · C/NC lav · Obs', MARGIN + labelW, y + 2, { width: cellW * 6 });
  doc.text('Toma 2: Temp · C/NC est · C/NC lav · Obs', MARGIN + labelW + cellW * 6, y + 2, { width: cellW * 6 });
  y += 11;

  const renderToma = (toma: Record<string, unknown> | undefined, x0: number) => {
    let x = x0;
    doc.fontSize(5).font('Helvetica').fillColor('#111');
    doc.text(str(toma?.temp ?? '—'), x, y + 1, { width: cellW, align: 'center' });
    x += cellW;
    doc.text(markCnc(toma?.cnc_est, 'C'), x, y + 1, { width: cellW, align: 'center' });
    x += cellW;
    doc.text(markCnc(toma?.cnc_est, 'NC'), x, y + 1, { width: cellW, align: 'center' });
    x += cellW;
    doc.text(markCnc(toma?.cnc_lav, 'C'), x, y + 1, { width: cellW, align: 'center' });
    x += cellW;
    doc.text(markCnc(toma?.cnc_lav, 'NC'), x, y + 1, { width: cellW, align: 'center' });
    x += cellW;
    doc.text(str(toma?.obs ?? '—'), x, y + 1, { width: cellW });
  };

  items.forEach((item) => {
    const row = (value[item.key] ?? {}) as { toma1?: Record<string, unknown>; toma2?: Record<string, unknown> };
    y = ensurePageSpace(doc, ctx, y, 10);
    drawTableRowBorder(doc, y, 10);
    doc.fontSize(5).font('Helvetica-Bold').text(item.label, MARGIN, y + 1, { width: labelW });
    renderToma(row.toma1, MARGIN + labelW);
    renderToma(row.toma2, MARGIN + labelW + cellW * 6);
    y += 10;
  });

  const extrasRaw = value._extras;
  const extras = Array.isArray(extrasRaw) ? (extrasRaw as { id: string; label: string }[]) : [];
  extras.forEach((ex) => {
    const row = (value[ex.id] ?? {}) as { label?: string; toma1?: Record<string, unknown>; toma2?: Record<string, unknown> };
    y = ensurePageSpace(doc, ctx, y, 10);
    drawTableRowBorder(doc, y, 10);
    doc.fontSize(5).font('Helvetica-Bold').text(row.label || ex.label || 'Equipo', MARGIN, y + 1, { width: labelW });
    renderToma(row.toma1, MARGIN + labelW);
    renderToma(row.toma2, MARGIN + labelW + cellW * 6);
    y += 10;
  });

  return y + 6;
}

function renderPoesBpmTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, Record<string, string>>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  let y = drawSectionBanner(doc, startY, field.label, field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const cols = [
    { l: 'Procedimiento', w: 100 },
    { l: 'Lav C', w: 18 },
    { l: 'Lav NC', w: 18 },
    { l: 'Tap C', w: 18 },
    { l: 'Tap NC', w: 18 },
  ];
  const tail = w - cols.reduce((a, c) => a + c.w, 0);
  const obsW = tail * 0.4;
  const acW = tail * 0.35;
  const respW = tail - obsW - acW;

  y = ensurePageSpace(doc, ctx, y, 12);
  drawTableRowBorder(doc, y, 11, '#f3f4f6');
  doc.fontSize(5).font('Helvetica-Bold');
  let x = MARGIN;
  cols.forEach((c) => {
    doc.text(c.l, x, y + 2, { width: c.w, align: c.l === 'Procedimiento' ? 'left' : 'center' });
    x += c.w;
  });
  doc.text('Obs.', x, y + 2, { width: obsW });
  doc.text('AC', x + obsW, y + 2, { width: acW });
  doc.text('Resp.', x + obsW + acW, y + 2, { width: respW });
  y += 11;

  items.forEach((item) => {
    const row = value[item.key] ?? {};
    y = ensurePageSpace(doc, ctx, y, 10);
    drawTableRowBorder(doc, y, 10);
    doc.fontSize(5).font('Helvetica').fillColor('#111');
    x = MARGIN;
    doc.text(item.label, x, y + 1, { width: cols[0].w });
    x += cols[0].w;
    doc.text(markCnc(row.lavado_manos, 'C'), x, y + 1, { width: cols[1].w, align: 'center' });
    x += cols[1].w;
    doc.text(markCnc(row.lavado_manos, 'NC'), x, y + 1, { width: cols[2].w, align: 'center' });
    x += cols[2].w;
    doc.text(markCnc(row.tapabocas, 'C'), x, y + 1, { width: cols[3].w, align: 'center' });
    x += cols[3].w;
    doc.text(markCnc(row.tapabocas, 'NC'), x, y + 1, { width: cols[4].w, align: 'center' });
    x += cols[4].w;
    doc.text(row.observation ?? '—', x, y + 1, { width: obsW });
    doc.text(row.corrective ?? '—', x + obsW, y + 1, { width: acW });
    doc.text(row.responsible ?? '—', x + obsW + acW, y + 1, { width: respW });
    y += 10;
  });
  return y + 6;
}

function renderPcInocuidadRepeater(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  rows: Record<string, unknown>[],
  startY: number
): number {
  const hallazgoCols = ['vr_cr', 'vb_cr', 'vb_mf', 'cb_cr', 'pm_coc', 'pm_pelo', 'lg_cr'];
  let y = drawSectionBanner(doc, startY, field.label, field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const codW = 36;
  const hallW = 22;
  const tail = w - 14 - codW - hallW * hallazgoCols.length;
  const obsW = tail * 0.55;
  const acW = tail - obsW;

  y = ensurePageSpace(doc, ctx, y, 12);
  drawTableRowBorder(doc, y, 11, '#f3f4f6');
  doc.fontSize(5).font('Helvetica-Bold');
  let x = MARGIN;
  doc.text('#', x, y + 2, { width: 14, align: 'center' });
  x += 14;
  doc.text('Código', x, y + 2, { width: codW });
  x += codW;
  hallazgoCols.forEach((k) => {
    doc.text(k.replace('_', ' ').toUpperCase(), x, y + 2, { width: hallW, align: 'center' });
    x += hallW;
  });
  doc.text('Obs.', x, y + 2, { width: obsW });
  doc.text('AC', x + obsW, y + 2, { width: acW });
  y += 11;

  rows.forEach((row, i) => {
    const hallazgos = (row.hallazgos ?? {}) as Record<string, string>;
    y = ensurePageSpace(doc, ctx, y, 10);
    drawTableRowBorder(doc, y, 10);
    doc.fontSize(5).font('Helvetica').fillColor('#111');
    x = MARGIN;
    doc.text(String(i + 1), x, y + 1, { width: 14, align: 'center' });
    x += 14;
    doc.text(str(row.codigo), x, y + 1, { width: codW });
    x += codW;
    hallazgoCols.forEach((k) => {
      doc.text(markCnc(hallazgos[k] ?? ''), x, y + 1, { width: hallW, align: 'center' });
      x += hallW;
    });
    doc.text(str(row.observation), x, y + 1, { width: obsW });
    doc.text(str(row.corrective), x + obsW, y + 1, { width: acW });
    y += 10;
  });
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
  if (opts.layout === 'pc_inocuidad_repeater') {
    return renderPcInocuidadRepeater(doc, ctx, field, rows, startY);
  }
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
  const schedule = scheduleForField(field, opts);
  const dayKey = getDayKey(ctx.workDate);
  const points = schedule[dayKey] ?? [];
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;

  if (points.length === 0) {
    doc.fontSize(6.5).font('Helvetica').fillColor('#666').text('No hay puntos programados para este día.', MARGIN, y);
    return y + 14;
  }

  if (tableType === 'cloro') {
    const puntoW = Math.min(110, w * 0.28);
    const cloroW = 52;
    const phW = 22;
    const cW = 12;
    const obsW = w - puntoW - cloroW - phW - cW * 2;

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
    let x = MARGIN;
    doc.text('Puntos inspeccionados', x + 2, y + 2, { width: puntoW });
    x += puntoW;
    doc.text('Cloro (0.3–2 ppm)', x, y + 2, { width: cloroW, align: 'center' });
    x += cloroW;
    doc.text('pH', x, y + 2, { width: phW, align: 'center' });
    x += phW;
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    doc.text('Observaciones', x + cW * 2 + 2, y + 2, { width: obsW - 4 });
    y += 11;

    for (const punto of points) {
      const key = slugifyPoint(punto);
      const row = value[key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(punto, x + 2, y + 1, { width: puntoW - 4 });
      x += puntoW;
      doc.text(row.cloro_residual ?? '—', x, y + 1, { width: cloroW, align: 'center' });
      x += cloroW;
      doc.text('7.0', x, y + 1, { width: phW, align: 'center' });
      x += phW;
      drawCncCells(doc, x, y + 1, cnc, cW, false);
      doc.text(row.observaciones ?? '—', x + cW * 2 + 2, y + 1, { width: obsW - 4 });
      y += 10;
    }
  } else {
    const puntoW = Math.min(120, w * 0.32);
    const tempW = 48;
    const cW = 12;
    const obsW = w - puntoW - tempW - cW * 2;

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
    let x = MARGIN;
    doc.text('Puntos de inspección', x + 2, y + 2, { width: puntoW });
    x += puntoW;
    doc.text('Temp °C', x, y + 2, { width: tempW, align: 'center' });
    x += tempW;
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    doc.text('Observación', x + cW * 2 + 2, y + 2, { width: obsW - 4 });
    y += 11;

    for (const punto of points) {
      const key = slugifyPoint(punto);
      const row = value[key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(punto, x + 2, y + 1, { width: puntoW - 4 });
      x += puntoW;
      doc.text(row.temperatura ?? '—', x, y + 1, { width: tempW, align: 'center' });
      x += tempW;
      drawCncCells(doc, x, y + 1, cnc, cW, false);
      doc.text(row.observaciones ?? '—', x + cW * 2 + 2, y + 1, { width: obsW - 4 });
      y += 10;
    }
  }
  return y + 6;
}

type MeasureRow = Record<string, string>;

function renderFormalMeasureTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, MeasureRow>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const tableType = opts.tableType ?? 'cloro';
  const showNa = opts.mode === 'cnc_na';
  let y = drawSectionBanner(doc, startY, field.label, field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;

  if (tableType === 'cloro') {
    const cols = [
      { l: '#', w: 14 },
      { l: 'Hora', w: 34 },
      { l: 'Punto de toma', w: 90 },
      { l: 'pH', w: 22 },
      { l: 'Cloro', w: 36 },
    ];
    const cW = 12;
    const cCols = showNa ? 3 : 2;
    const corrW = w - cols.reduce((a, c) => a + c.w, 0) - cW * cCols;

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold');
    let x = MARGIN;
    cols.forEach((c) => {
      doc.text(c.l, x, y + 2, { width: c.w, align: c.l === '#' ? 'center' : 'left' });
      x += c.w;
    });
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    if (showNa) doc.text('NA', x + cW * 2, y + 2, { width: cW, align: 'center' });
    doc.text('Corrección', x + cW * cCols, y + 2, { width: corrW });
    y += 11;

    items.forEach((item, idx) => {
      const row = value[item.key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(String(idx + 1), x, y + 1, { width: cols[0].w, align: 'center' });
      x += cols[0].w;
      doc.text(row.hora ?? '—', x, y + 1, { width: cols[1].w });
      x += cols[1].w;
      doc.text(row.punto_toma ?? item.label, x, y + 1, { width: cols[2].w });
      x += cols[2].w;
      doc.text(row.ph ?? '7.0', x, y + 1, { width: cols[3].w, align: 'center' });
      x += cols[3].w;
      doc.text(row.cloro_residual ?? '—', x, y + 1, { width: cols[4].w, align: 'center' });
      x += cols[4].w;
      x = drawCncCells(doc, x, y + 1, cnc, cW, showNa);
      doc.text(row.corrective ?? row.observation ?? '—', x, y + 1, { width: corrW });
      y += 10;
    });
    return y + 6;
  }

  if (tableType === 'temperaturas') {
    const cols = [
      { l: 'Área', w: 100 },
      { l: 'Hora', w: 34 },
      { l: 'Temp °C', w: 40 },
    ];
    const cW = 12;
    const cCols = showNa ? 3 : 2;
    const obsW = w - cols.reduce((a, c) => a + c.w, 0) - cW * cCols;

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold');
    let x = MARGIN;
    cols.forEach((c) => {
      doc.text(c.l, x, y + 2, { width: c.w });
      x += c.w;
    });
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    if (showNa) doc.text('NA', x + cW * 2, y + 2, { width: cW, align: 'center' });
    doc.text('Obs.', x + cW * cCols, y + 2, { width: obsW });
    y += 11;

    items.forEach((item) => {
      const row = value[item.key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(item.label, x, y + 1, { width: cols[0].w });
      x += cols[0].w;
      doc.text(row.hora ?? '—', x, y + 1, { width: cols[1].w });
      x += cols[1].w;
      doc.text(row.temperatura ?? '—', x, y + 1, { width: cols[2].w, align: 'center' });
      x += cols[2].w;
      x = drawCncCells(doc, x, y + 1, cnc, cW, showNa);
      doc.text(row.observation ?? '—', x, y + 1, { width: obsW });
      y += 10;
    });
    return y + 6;
  }

  if (tableType === 'monitoreo') {
    const valorLabel = opts.valorLabel ?? 'Valor';
    const cW = 12;
    const cCols = showNa ? 3 : 2;
    const cols = [
      { l: 'Aspecto', w: 110 },
      { l: 'Turno', w: 36 },
      { l: valorLabel, w: 40 },
    ];
    const tailW = w - cols.reduce((a, c) => a + c.w, 0) - cW * cCols;
    const obsW = tailW * 0.55;
    const acW = tailW - obsW;

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold');
    let x = MARGIN;
    cols.forEach((c) => {
      doc.text(c.l, x, y + 2, { width: c.w });
      x += c.w;
    });
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    if (showNa) doc.text('NA', x + cW * 2, y + 2, { width: cW, align: 'center' });
    doc.text('Obs.', x + cW * cCols, y + 2, { width: obsW });
    doc.text('AC', x + cW * cCols + obsW, y + 2, { width: acW });
    y += 11;

    items.forEach((item) => {
      const row = value[item.key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      const valor = row.valor ?? row.minutos ?? row.temperatura ?? '—';
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(item.label, x, y + 1, { width: cols[0].w });
      x += cols[0].w;
      doc.text(row.turno ?? '—', x, y + 1, { width: cols[1].w });
      x += cols[1].w;
      doc.text(valor, x, y + 1, { width: cols[2].w, align: 'center' });
      x += cols[2].w;
      x = drawCncCells(doc, x, y + 1, cnc, cW, showNa);
      doc.text(row.observation ?? '—', x, y + 1, { width: obsW });
      doc.text(row.corrective ?? '—', x + obsW, y + 1, { width: acW });
      y += 10;
    });
    return y + 6;
  }

  // Fallback: list rows as text
  items.forEach((item) => {
    const row = value[item.key] ?? {};
    const parts = Object.entries(row).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
    y = ensurePageSpace(doc, ctx, y, 10);
    doc.fontSize(5.5).font('Helvetica').text(`${item.label}: ${parts.join(' · ') || '—'}`, MARGIN, y, { width: w });
    y += 10;
  });
  return y + 4;
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
  const isItemChecklist = field.fieldType === 'CHECKLIST' && Boolean(opts.items?.length);
  const isDaySchedule = field.fieldType === 'CHECKLIST' && opts.layout === 'day_schedule_table';
  const isFormalMeasure = field.fieldType === 'CHECKLIST' && opts.layout === 'formal_measure_table';

  if (!isItemChecklist && !isFormalMeasure) {
    y = drawSectionBanner(doc, y, field.label, field.helpText ?? undefined, true);
  }

  if (isDaySchedule) {
    return renderDaySchedule(doc, ctx, field, (value as Record<string, Record<string, string>>) ?? {}, y);
  }

  if (isFormalMeasure) {
    return renderFormalMeasureTable(doc, ctx, field, (value as Record<string, MeasureRow>) ?? {}, y);
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'poes_operativo_table') {
    return renderPoesOperativoTable(doc, ctx, field, (value as Record<string, Record<string, unknown>>) ?? {}, y);
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'poes_bpm_table') {
    return renderPoesBpmTable(doc, ctx, field, (value as Record<string, Record<string, string>>) ?? {}, y);
  }

  if (field.fieldType === 'CHECKLIST' && opts.items?.length) {
    const checklistValue = coerceChecklistRecord(value);
    if (stringColumns(opts).includes('cavaColumns') || opts.columnDefs?.length || opts.cavaColumns?.length) {
      return renderCavaMatrix(doc, ctx, field, checklistValue, y);
    }
    if (stringColumns(opts).includes('platforms')) {
      return renderPlatformsTable(doc, ctx, field, checklistValue, y);
    }
    return renderSimpleChecklist(doc, ctx, field, checklistValue, y);
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

type RenderSheetOptions = {
  showBoundaries?: boolean;
  isLastInPdf?: boolean;
};

function renderSheetPage(
  doc: PdfDoc,
  submission: SubmissionForPdf,
  sheet: SheetWithFields,
  sheetData: Record<string, unknown>,
  sheetIndex: number,
  totalSheets: number,
  renderOpts?: RenderSheetOptions
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
    compactHeader: usesCompactHeader(submission.format.code),
  };

  const fields = sheet.fields.filter((f) => f.fieldKey !== 'empresa');
  const code = submission.format.code;

  let y = startSheetPage(doc, ctx, false, { sheetBoundary: renderOpts?.showBoundaries });

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

  if (renderOpts?.showBoundaries && !renderOpts.isLastInPdf) {
    drawSheetBoundaryEnd(doc, ctx.sheetIndex, ctx.totalSheets, ctx.sheetName);
  }
}

function sortedFormatSheets(submission: SubmissionForPdf): SheetWithFields[] {
  return [...submission.format.sheets].sort((a, b) => a.sheetOrder - b.sheetOrder);
}

export function generateSubmissionPdf(
  submission: SubmissionForPdf,
  options?: PdfGenerationOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const allSheets = sortedFormatSheets(submission);
    let sheetsToRender = allSheets;

    if (options?.sheetId) {
      sheetsToRender = allSheets.filter((s) => s.id === options.sheetId);
      if (sheetsToRender.length === 0) {
        reject(new Error('Hoja no encontrada en el formato'));
        return;
      }
    }

    if (sheetsToRender.length === 0) {
      doc.addPage({ size: 'A4', margin: MARGIN });
      doc.fontSize(12).text('Formato sin hojas configuradas.', MARGIN, MARGIN);
      doc.end();
      return;
    }

    const totalSheetsInFormat = allSheets.length;
    const showBoundaries =
      Boolean(options?.sheetBoundaries) && sheetsToRender.length > 1 && !options?.sheetId;

    sheetsToRender.forEach((sheet, index) => {
      const sheetIndex = allSheets.findIndex((s) => s.id === sheet.id);
      const sheetData =
        (submission.sheets.find((s) => s.sheetId === sheet.id)?.data as Record<string, unknown>) ?? {};
      renderSheetPage(doc, submission, sheet, sheetData, sheetIndex, totalSheetsInFormat, {
        showBoundaries,
        isLastInPdf: index === sheetsToRender.length - 1,
      });
    });

    doc.end();
  });
}

export function buildPdfFilename(
  submission: SubmissionForPdf,
  opts?: { sheetName?: string; allSheets?: boolean }
): string {
  const date =
    submission.workDate instanceof Date
      ? submission.workDate.toISOString().slice(0, 10)
      : String(submission.workDate).slice(0, 10);
  const code = submission.format.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);
  const sanitize = (s: string) => s.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 30);
  if (opts?.sheetName) {
    return `${code}_${sanitize(opts.sheetName)}_${date}.pdf`;
  }
  if (opts?.allSheets) {
    return `${code}_completo_${date}.pdf`;
  }
  return `${code}_${date}.pdf`;
}

// Re-export for tests
export { formatWorkDate };
