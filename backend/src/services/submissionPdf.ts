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
  drawTextOrClosed,
  drawClosedBlank,
  ensurePageSpace,
  formatWorkDate,
  isBlankPdfValue,
  isObservationPdfField,
  pageWidth,
  startSheetPage,
  startContentPage,
  stampPdfPageNumbers,
  str,
  type PdfDoc,
  type SheetPageContext,
} from './submissionPdfDraw';
import { allocateColWidths, measureTextHeight, type PdfTableColumn } from './pdfTable';

type FieldOptions = {
  layout?: string;
  tableType?: string;
  mode?: string;
  revCncNa?: boolean;
  items?: {
    key: string;
    label: string;
    section?: string;
    fr?: string;
    naTemp?: boolean;
    naPresion?: boolean;
    slotCount?: number;
  }[];
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
  allowAddRows?: boolean;
  valorLabel?: string;
  allowAddEquipos?: boolean;
  pcOperativoVariant?: string;
  operarioLabel?: string;
  aspectRows?: boolean;
  monitoreoVariant?: string;
};

type ChecklistItemData = {
  cnc?: string;
  rev_cnc?: string;
  final_cnc?: string;
  observation?: string;
  corrective?: string;
  responsible?: string;
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
  submittedBy?: Pick<User, 'fullName'> | null;
  collaborators?: { user: Pick<User, 'fullName'> }[];
  activities?: {
    type: string;
    createdAt: Date;
    notes?: string | null;
    actor?: Pick<User, 'fullName'> | null;
    targetUser?: Pick<User, 'fullName'> | null;
    metadata?: unknown;
  }[];
  sheets: { sheetId: string; data: unknown }[];
};

function stringColumns(opts: FieldOptions): string[] {
  const raw = opts.columns;
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is string => typeof c === 'string');
}

const LANDSCAPE_FORMAT_CODES = new Set([
  'POES_OPERATIVO',
  'PC_COMESTIBLE_OPERATIVO',
  'PC_COMESTIBLES_INOCUIDAD',
  'LINEA_OPERATIVO',
]);

function needsLandscape(fields: FormatField[]): boolean {
  return fields.some((f) => {
    const opts = (f.options ?? {}) as FieldOptions;
    const colCount = opts.columnDefs?.length ?? opts.cavaColumns?.length ?? 0;
    if (colCount >= 6 || (stringColumns(opts).includes('platforms') && (opts.platformCount ?? 0) >= 5)) {
      return true;
    }
    // Tarjetas (card_repeater) se ven mejor en vertical; no forzar landscape por ellas
    if (f.fieldType === 'REPEATER' && opts.layout !== 'card_repeater') {
      const raw = opts.columns_def ?? opts.columns ?? [];
      const cols = Array.isArray(raw) ? raw : [];
      let cncSlots = 0;
      for (const col of cols) {
        if (!col || typeof col !== 'object' || !('key' in col)) continue;
        const c = col as { key: string; type?: string; options?: { choices?: string[] } };
        if (c.key === 'cnc' || c.type === 'CHECKLIST') {
          const choices = (c.options?.choices ?? ['C', 'NC']).filter((x) => x === 'C' || x === 'NC' || x === 'NA');
          cncSlots += choices.length || 2;
        }
      }
      // Manipulador (~15); empaque (6) se queda en vertical con cabeceras cortas
      if (cncSlots >= 10) return true;
    }
    return false;
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
    .toUpperCase()
    .replace(/\./g, '');
  if (s === 'C' || s === 'NC' || s === 'NA') return s;
  return '';
}

/** Etiqueta legible en PDF (NA → N.A.). */
function formatCncPdfLabel(cnc: string): string {
  if (cnc === 'NA') return 'N.A.';
  return cnc;
}

function drawCncValueOrClosed(
  doc: PdfDoc,
  raw: unknown,
  x: number,
  textY: number,
  opts: { width: number; rowH?: number; cellY?: number }
): void {
  const cnc = normalizeCnc(raw);
  if (!cnc) {
    drawClosedBlank(doc, x, opts.cellY ?? Math.max(0, textY - 1), opts.width, opts.rowH ?? 11);
    return;
  }
  doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(formatCncPdfLabel(cnc), x, textY, {
    width: opts.width,
    lineBreak: false,
  });
}

function fieldBannerTitle(field: FormatField): { title: string; subtitle?: string } {
  if (field.groupName && field.groupName !== field.label) {
    return { title: field.groupName, subtitle: field.label };
  }
  return { title: field.label, subtitle: field.helpText ?? undefined };
}

function shouldSkipOuterBanner(field: FormatField, opts: FieldOptions): boolean {
  if (field.fieldType === 'CHECKLIST' && opts.layout === 'formal_measure_table') return true;
  if (field.fieldType === 'CHECKLIST' && Boolean(opts.items?.length)) return true;
  if (field.fieldType === 'CHECKLIST' && opts.layout === 'poes_operativo_table') return true;
  if (field.fieldType === 'CHECKLIST' && opts.layout === 'poes_bpm_table') return true;
  if (field.fieldType === 'REPEATER' && opts.layout === 'pc_inocuidad_repeater') return true;
  if (field.fieldType === 'CHECKLIST' && opts.layout === 'pc_operativo_table') return true;
  return false;
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
  const showRev = cols.includes('rev_cnc');
  const showFinal = cols.includes('final_cnc');
  const showSimpleCnc = cols.includes('cnc') || (!showRev && !showFinal && !cols.includes('platforms'));
  return {
    cols,
    showFr: cols.includes('fr'),
    showCnc: showSimpleCnc && !showRev && !showFinal,
    showRev,
    showFinal,
    showObs: cols.includes('observation'),
    showCorr: cols.includes('corrective'),
    showResponsible: cols.includes('responsible'),
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
  const flags = checklistColumnFlags(opts);
  const { showCnc, showRev, showFinal, showObs, showCorr, showFr, showResponsible } = flags;
  const showNaSimple = hasNa(opts);
  const showNaRev = Boolean(opts.revCncNa) || opts.mode === 'cnc_na' || showNaSimple;
  const showNaFinal = opts.mode === 'cnc_na';
  const tableW = pageWidth(doc) - MARGIN * 2;
  let y = startY;

  y = drawSectionBanner(doc, y, field.label, field.helpText ?? 'C / NC — marque con X', true);

  const cW = showRev || showFinal ? 12 : 16;
  const frW = showFr ? 18 : 0;
  const revCols = showRev ? (showNaRev ? 3 : 2) : 0;
  const finalCols = showFinal ? (showNaFinal ? 3 : 2) : 0;
  const simpleCols = showCnc ? (showNaSimple ? 3 : 2) : 0;
  const obsW = showObs ? (showRev || showFinal ? 70 : 88) : 0;
  const corrW = showCorr ? (showRev || showFinal ? 60 : 76) : 0;
  const respW = showResponsible ? 52 : 0;
  const cncBlockW = cW * (simpleCols + revCols + finalCols);
  const labelW = Math.max(72, tableW - frW - cncBlockW - obsW - corrW - respW - 6);
  const headerH = showRev || showFinal ? 18 : 12;

  const drawChecklistHeader = (atY: number): number => {
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
    drawTableRowBorder(doc, atY, headerH, '#f3f4f6');
    let hx = MARGIN;
    doc.text('Equipo / superficie', hx + 3, atY + (headerH > 12 ? 6 : 2), { width: labelW });
    hx += labelW;
    if (showFr) {
      doc.text('FR', hx, atY + (headerH > 12 ? 6 : 2), { width: frW, align: 'center' });
      hx += frW;
    }
    if (showCnc) {
      doc.text('C', hx, atY + 2, { width: cW, align: 'center' });
      doc.text('NC', hx + cW, atY + 2, { width: cW, align: 'center' });
      if (showNaSimple) doc.text('NA', hx + cW * 2, atY + 2, { width: cW, align: 'center' });
      hx += cW * simpleCols;
    }
    if (showRev) {
      const revW = cW * revCols;
      doc.text('REV.', hx, atY + 1, { width: revW, align: 'center' });
      doc.text('C', hx, atY + 9, { width: cW, align: 'center' });
      doc.text('NC', hx + cW, atY + 9, { width: cW, align: 'center' });
      if (showNaRev) doc.text('NA', hx + cW * 2, atY + 9, { width: cW, align: 'center' });
      hx += revW;
    }
    if (showObs) {
      doc.text('Obs.', hx, atY + (headerH > 12 ? 6 : 2), { width: obsW });
      hx += obsW;
    }
    if (showCorr) {
      doc.text('AC', hx, atY + (headerH > 12 ? 6 : 2), { width: corrW });
      hx += corrW;
    }
    if (showFinal) {
      const finW = cW * finalCols;
      doc.text('VERIF.', hx, atY + 1, { width: finW, align: 'center' });
      doc.text('C', hx, atY + 9, { width: cW, align: 'center' });
      doc.text('NC', hx + cW, atY + 9, { width: cW, align: 'center' });
      if (showNaFinal) doc.text('NA', hx + cW * 2, atY + 9, { width: cW, align: 'center' });
      hx += finW;
    }
    if (showResponsible) {
      doc.text('Resp.', hx, atY + (headerH > 12 ? 6 : 2), { width: respW });
    }
    return atY + headerH;
  };

  y = ensurePageSpace(doc, ctx, y, headerH);
  y = drawChecklistHeader(y);

  let lastSection = '';
  for (const item of items) {
    if (item.section && item.section !== lastSection) {
      lastSection = item.section;
      if (y + 11 > contentBottom(doc)) {
        y = startSheetPage(doc, ctx, true);
        y = drawChecklistHeader(y);
      }
      drawTableRowBorder(doc, y, 10, '#dcfce7');
      doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#111').text(item.section.toUpperCase(), MARGIN + 3, y + 2, {
        width: tableW - 6,
      });
      y += 10;
    }

    const data = value[item.key] ?? {};
    const obsText = showObs ? readScopedText(data, undefined, 'observation') : '';
    const corrText = showCorr ? readScopedText(data, undefined, 'corrective') : '';
    const respText = showResponsible ? str(data.responsible) : '';
    const labelH = measureTextHeight(doc, item.label, labelW - 4, 5.5);
    const obsH = showObs && !isBlankPdfValue(obsText) ? measureTextHeight(doc, obsText, obsW - 2, 5.5) : showObs ? 7 : 0;
    const corrH = showCorr && !isBlankPdfValue(corrText) ? measureTextHeight(doc, corrText, corrW - 2, 5.5) : showCorr ? 7 : 0;
    const respH =
      showResponsible && !isBlankPdfValue(data.responsible)
        ? measureTextHeight(doc, respText, respW - 2, 5.5)
        : showResponsible
          ? 7
          : 0;
    const rowH = Math.min(64, Math.max(11, Math.max(labelH, obsH, corrH, respH) + 4));

    if (y + rowH > contentBottom(doc)) {
      y = startSheetPage(doc, ctx, true);
      y = drawChecklistHeader(y);
    }

    drawTableRowBorder(doc, y, rowH);
    doc.fontSize(5.5).font('Helvetica').fillColor('#111').text(item.label, MARGIN + 3, y + 2, {
      width: labelW - 4,
      lineGap: 0,
    });
    let x = MARGIN + labelW;
    if (showFr) {
      doc.fontSize(5).font('Helvetica').fillColor('#111').text(item.fr ?? '—', x, y + 2, {
        width: frW,
        align: 'center',
      });
      x += frW;
    }
    if (showCnc) {
      x = drawCncCells(doc, x, y + 1, readItemCnc(data), cW, showNaSimple);
    }
    if (showRev) {
      x = drawCncCells(doc, x, y + 1, normalizeCnc(data.rev_cnc), cW, showNaRev);
    }
    if (showObs) {
      drawTextOrClosed(doc, obsText, x, y + 2, { width: obsW - 2, rowH, cellY: y, closeIfEmpty: false });
      x += obsW;
    }
    if (showCorr) {
      drawTextOrClosed(doc, corrText, x, y + 2, { width: corrW - 2, rowH, cellY: y });
      x += corrW;
    }
    if (showFinal) {
      x = drawCncCells(doc, x, y + 1, normalizeCnc(data.final_cnc), cW, showNaFinal);
    }
    if (showResponsible) {
      drawTextOrClosed(doc, data.responsible, x, y + 2, { width: respW - 2, rowH, cellY: y });
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
        drawTextOrClosed(doc, readScopedText(data, scope, 'observation', ci === 0), MARGIN + labelW + cavaW, y + 1, {
          width: obsW - 2,
          rowH,
          cellY: y,
          closeIfEmpty: false,
        });
      }
      if (showCorr) {
        drawTextOrClosed(doc, readScopedText(data, scope, 'corrective', ci === 0), MARGIN + labelW + cavaW + obsW, y + 1, {
          width: corrW - 2,
          rowH,
          cellY: y,
        });
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
      drawTextOrClosed(doc, data.observation, x, y + 1, {
        width: obsW - 2,
        rowH,
        cellY: y,
        fontSize: 5.5,
        closeIfEmpty: false,
      });
    }
    if (showCorr) {
      drawTextOrClosed(doc, data.corrective, x + (showObs ? obsW : 0), y + 1, {
        width: corrW - 2,
        rowH,
        cellY: y,
        fontSize: 5.5,
      });
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
  startY: number,
  sheetData?: Record<string, unknown>
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const hora1 = str(sheetData?.poes_hora_1);
  const hora2 = str(sheetData?.poes_hora_2);
  let y = drawSectionBanner(doc, startY, 'Equipos / utensilios / superficies', field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const labelW = 92;
  const tomaW = 3;
  const cncW = 14;
  const tailW = w - labelW - cncW * tomaW * 2;
  const obsW = tailW * 0.4;
  const acW = tailW * 0.35;
  const respW = tailW - obsW - acW;
  const cellW = cncW;

  y = ensurePageSpace(doc, ctx, y, 18);
  drawTableRowBorder(doc, y, 10, '#d9ead3');
  doc.fontSize(4.5).font('Helvetica-Bold');
  doc.text('Equipo / utensilio / superficie', MARGIN, y + 1, { width: labelW });
  doc.text(hora1 ? `Hora: ${hora1}` : 'Hora', MARGIN + labelW, y + 1, { width: cellW * tomaW, align: 'center' });
  doc.text(hora2 ? `Hora: ${hora2}` : 'Hora', MARGIN + labelW + cellW * tomaW, y + 1, { width: cellW * tomaW, align: 'center' });
  doc.text('Observaciones', MARGIN + labelW + cellW * tomaW * 2, y + 1, { width: obsW });
  doc.text('Acción correctiva', MARGIN + labelW + cellW * tomaW * 2 + obsW, y + 1, { width: acW });
  doc.text('Responsable', MARGIN + labelW + cellW * tomaW * 2 + obsW + acW, y + 1, { width: respW });
  y += 10;
  drawTableRowBorder(doc, y, 9, '#e8f4e8');
  let x = MARGIN + labelW;
  for (let t = 0; t < 2; t++) {
    doc.text('Temp °C', x, y + 1, { width: cellW, align: 'center' });
    doc.text('C/NC', x + cellW, y + 1, { width: cellW, align: 'center' });
    doc.text('Lav C/NC', x + cellW * 2, y + 1, { width: cellW, align: 'center' });
    x += cellW * tomaW;
  }
  y += 9;

  const renderTomaPdf = (toma: Record<string, unknown> | undefined, x0: number) => {
    let x = x0;
    drawTextOrClosed(doc, toma?.temp, x, y + 1, {
      width: cellW,
      rowH: 10,
      cellY: y,
      align: 'center',
      fontSize: 5,
    });
    x += cellW;
    const est = normalizeCnc(toma?.cnc_est);
    drawCncMark(doc, x, y + 1, est, 'C', cellW * 0.33);
    drawCncMark(doc, x + cellW * 0.33, y + 1, est, 'NC', cellW * 0.33);
    drawCncMark(doc, x + cellW * 0.66, y + 1, est, 'NA', cellW * 0.34);
    x += cellW;
    const lav = normalizeCnc(toma?.cnc_lav);
    drawCncMark(doc, x, y + 1, lav, 'C', cellW * 0.5);
    drawCncMark(doc, x + cellW * 0.5, y + 1, lav, 'NC', cellW * 0.5);
    return x + cellW;
  };

  const renderEquipoRow = (label: string, row: { toma1?: Record<string, unknown>; toma2?: Record<string, unknown>; observation?: string; corrective?: string; responsible?: string }, idx: number) => {
    y = ensurePageSpace(doc, ctx, y, 10);
    if (idx % 2 === 1) drawTableRowBorder(doc, y, 10, '#f9fafb');
    else drawTableRowBorder(doc, y, 10);
    doc.fontSize(4.5).font('Helvetica-Bold').text(label, MARGIN, y + 1, { width: labelW });
    let x = MARGIN + labelW;
    x = renderTomaPdf(row.toma1, x);
    x = renderTomaPdf(row.toma2, x);
    drawTextOrClosed(doc, row.observation, x, y + 1, {
      width: obsW,
      rowH: 10,
      cellY: y,
      fontSize: 4.5,
      closeIfEmpty: false,
    });
    drawTextOrClosed(doc, row.corrective, x + obsW, y + 1, { width: acW, rowH: 10, cellY: y, fontSize: 4.5 });
    drawTextOrClosed(doc, row.responsible, x + obsW + acW, y + 1, { width: respW, rowH: 10, cellY: y, fontSize: 4.5 });
    y += 10;
  };

  items.forEach((item, idx) => {
    const row = (value[item.key] ?? {}) as { toma1?: Record<string, unknown>; toma2?: Record<string, unknown>; observation?: string; corrective?: string; responsible?: string };
    const defaultObs =
      item.key === 'cuchilla_patas' || item.key === 'cuchillo_neumatico' ? 'Ácido láctico' : '';
    const observation = row.observation ?? (defaultObs || undefined);
    renderEquipoRow(item.label, { ...row, observation }, idx);
  });

  const extrasRaw = value._extras;
  const extras = Array.isArray(extrasRaw) ? (extrasRaw as { id: string; label: string }[]) : [];
  extras.forEach((ex, idx) => {
    const row = (value[ex.id] ?? {}) as { label?: string; toma1?: Record<string, unknown>; toma2?: Record<string, unknown>; observation?: string; corrective?: string; responsible?: string };
    renderEquipoRow(row.label || ex.label || 'Equipo', row, items.length + idx);
  });

  return y + 6;
}

function renderPoesBpmTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, Record<string, unknown>>,
  startY: number,
  sheetData?: Record<string, unknown>
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const hora1 = str(sheetData?.poes_hora_1);
  const hora2 = str(sheetData?.poes_hora_2);
  let y = drawSectionBanner(doc, startY, 'Buenas prácticas higiénicas', field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const labelW = 88;
  const cW = 12;
  const tailW = w - labelW - cW * 8;
  const obsW = tailW * 0.4;
  const acW = tailW * 0.35;
  const respW = tailW - obsW - acW;

  y = ensurePageSpace(doc, ctx, y, 18);
  drawTableRowBorder(doc, y, 10, '#d9ead3');
  doc.fontSize(4.5).font('Helvetica-Bold');
  doc.text('Procedimiento', MARGIN, y + 1, { width: labelW });
  doc.text(hora1 ? `Hora: ${hora1}` : 'Hora', MARGIN + labelW, y + 1, { width: cW * 4, align: 'center' });
  doc.text(hora2 ? `Hora: ${hora2}` : 'Hora', MARGIN + labelW + cW * 4, y + 1, { width: cW * 4, align: 'center' });
  doc.text('Obs.', MARGIN + labelW + cW * 8, y + 1, { width: obsW });
  doc.text('AC', MARGIN + labelW + cW * 8 + obsW, y + 1, { width: acW });
  doc.text('Resp.', MARGIN + labelW + cW * 8 + obsW + acW, y + 1, { width: respW });
  y += 10;
  drawTableRowBorder(doc, y, 8, '#e8f4e8');
  let x = MARGIN + labelW;
  for (let t = 0; t < 2; t++) {
    doc.text('Lav C', x, y + 1, { width: cW, align: 'center' });
    doc.text('Lav NC', x + cW, y + 1, { width: cW, align: 'center' });
    doc.text('Tap C', x + cW * 2, y + 1, { width: cW, align: 'center' });
    doc.text('Tap NC', x + cW * 3, y + 1, { width: cW, align: 'center' });
    x += cW * 4;
  }
  y += 8;

  items.forEach((item, idx) => {
    const row = (value[item.key] ?? {}) as {
      toma1?: { lavado_manos?: string; tapabocas?: string };
      toma2?: { lavado_manos?: string; tapabocas?: string };
      lavado_manos?: string;
      tapabocas?: string;
      observation?: string;
      corrective?: string;
      responsible?: string;
    };
    const t1 = row.toma1 ?? { lavado_manos: row.lavado_manos, tapabocas: row.tapabocas };
    const t2 = row.toma2 ?? {};
    y = ensurePageSpace(doc, ctx, y, 10);
    if (idx % 2 === 1) drawTableRowBorder(doc, y, 10, '#f9fafb');
    else drawTableRowBorder(doc, y, 10);
    doc.fontSize(4.5).font('Helvetica').fillColor('#111');
    x = MARGIN;
    doc.text(item.label, x, y + 1, { width: labelW });
    x += labelW;
    const renderBpmToma = (toma: { lavado_manos?: string; tapabocas?: string }) => {
      const lav = normalizeCnc(toma.lavado_manos);
      drawCncMark(doc, x, y + 1, lav, 'C', cW);
      drawCncMark(doc, x + cW, y + 1, lav, 'NC', cW);
      x += cW * 2;
      const tap = normalizeCnc(toma.tapabocas);
      drawCncMark(doc, x, y + 1, tap, 'C', cW);
      drawCncMark(doc, x + cW, y + 1, tap, 'NC', cW);
      x += cW * 2;
    };
    renderBpmToma(t1);
    renderBpmToma(t2);
    drawTextOrClosed(doc, row.observation, x, y + 1, {
      width: obsW,
      rowH: 10,
      cellY: y,
      fontSize: 4.5,
      closeIfEmpty: false,
    });
    drawTextOrClosed(doc, row.corrective, x + obsW, y + 1, { width: acW, rowH: 10, cellY: y, fontSize: 4.5 });
    drawTextOrClosed(doc, row.responsible, x + obsW + acW, y + 1, { width: respW, rowH: 10, cellY: y, fontSize: 4.5 });
    y += 10;
  });
  return y + 6;
}

type PcMeasureRow = Record<string, unknown>;

function normalizePcPdfEntries(raw: unknown, minSlots: number): PcMeasureRow[] {
  if (Array.isArray(raw)) {
    const arr = raw as PcMeasureRow[];
    if (arr.length >= minSlots) return arr;
    return [...arr, ...Array.from({ length: minSlots - arr.length }, () => ({}))];
  }
  if (raw && typeof raw === 'object') {
    return [raw as PcMeasureRow, ...Array.from({ length: minSlots - 1 }, () => ({}))];
  }
  return Array.from({ length: minSlots }, () => ({}));
}

function renderPcOperativoTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, PcMeasureRow | PcMeasureRow[]>,
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const variant = opts.pcOperativoVariant ?? 'operario_cnc';
  const operarioLabel = opts.operarioLabel ?? 'Nombre del operario';
  const { title, subtitle } = fieldBannerTitle(field);
  let y = drawSectionBanner(doc, startY, title, subtitle ?? field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const aspectW = 88;
  const cW = 11;
  const textW = 42;
  const obsW = 52;
  const acW = 48;

  type ColDef = { label: string; w: number; kind: 'aspect' | 'text' | 'cnc' | 'obs' | 'ac' };
  let cols: ColDef[] = [];

  switch (variant) {
    case 'codigo_responsable':
      cols = [
        { label: 'Aspecto', w: aspectW, kind: 'aspect' },
        { label: 'Código', w: textW, kind: 'text' },
        { label: 'C', w: cW, kind: 'cnc' },
        { label: 'NC', w: cW, kind: 'cnc' },
        { label: 'Obs.', w: obsW, kind: 'obs' },
        { label: 'AC', w: acW, kind: 'ac' },
        { label: 'Responsable', w: textW, kind: 'text' },
      ];
      break;
    case 'codigo_operario':
      cols = [
        { label: 'Aspecto', w: aspectW, kind: 'aspect' },
        { label: 'Código', w: textW, kind: 'text' },
        { label: 'C', w: cW, kind: 'cnc' },
        { label: 'NC', w: cW, kind: 'cnc' },
        { label: 'Operario', w: textW, kind: 'text' },
        { label: 'Obs.', w: obsW, kind: 'obs' },
        { label: 'AC', w: acW, kind: 'ac' },
      ];
      break;
    case 'proceso_tiempos':
      cols = [
        { label: 'Aspecto', w: aspectW + 8, kind: 'aspect' },
        { label: 'Cant.', w: 34, kind: 'text' },
        { label: 'Tiempo', w: 34, kind: 'text' },
        { label: 'Temp °C', w: 34, kind: 'text' },
        { label: 'Obs.', w: obsW, kind: 'obs' },
        { label: 'AC', w: acW, kind: 'ac' },
      ];
      break;
    case 'proceso_tiempos_cnc':
      cols = [
        { label: 'Aspecto', w: aspectW, kind: 'aspect' },
        { label: 'Cant.', w: 30, kind: 'text' },
        { label: 'Tiempo', w: 30, kind: 'text' },
        { label: 'Temp', w: 30, kind: 'text' },
        { label: 'C', w: cW, kind: 'cnc' },
        { label: 'NC', w: cW, kind: 'cnc' },
        { label: 'Operario', w: textW, kind: 'text' },
        { label: 'Obs.', w: obsW, kind: 'obs' },
        { label: 'AC', w: acW, kind: 'ac' },
      ];
      break;
    case 'esterilizadores':
      cols = [
        { label: 'Aspecto', w: aspectW, kind: 'aspect' },
        { label: 'Temp °C', w: textW, kind: 'text' },
        { label: 'Hora', w: 34, kind: 'text' },
        { label: 'C', w: cW, kind: 'cnc' },
        { label: 'NC', w: cW, kind: 'cnc' },
        { label: 'Obs.', w: obsW, kind: 'obs' },
        { label: 'AC', w: acW, kind: 'ac' },
      ];
      break;
    default:
      cols = [
        { label: 'Aspecto', w: aspectW, kind: 'aspect' },
        { label: operarioLabel, w: textW, kind: 'text' },
        { label: 'C', w: cW, kind: 'cnc' },
        { label: 'NC', w: cW, kind: 'cnc' },
        { label: 'Obs.', w: obsW, kind: 'obs' },
        { label: 'AC', w: acW, kind: 'ac' },
      ];
  }

  y = ensurePageSpace(doc, ctx, y, 12);
  drawTableRowBorder(doc, y, 10, '#d9ead3');
  doc.fontSize(4.5).font('Helvetica-Bold');
  let x = MARGIN;
  cols.forEach((c) => {
    doc.text(c.label, x, y + 1, { width: c.w, align: c.kind === 'aspect' ? 'left' : 'center' });
    x += c.w;
  });
  y += 10;

  const renderPcRow = (aspectLabel: string, row: PcMeasureRow, showAspect: boolean) => {
    y = ensurePageSpace(doc, ctx, y, 10);
    drawTableRowBorder(doc, y, 10);
    doc.fontSize(4.5).font('Helvetica').fillColor('#111');
    x = MARGIN;
    let cncDrawn = false;
    cols.forEach((c) => {
      if (c.kind === 'aspect') {
        doc.font(showAspect ? 'Helvetica-Bold' : 'Helvetica').text(showAspect ? aspectLabel : '', x, y + 1, { width: c.w });
      } else if (c.kind === 'cnc') {
        if (!cncDrawn) {
          const cnc = normalizeCnc(row.cnc);
          drawCncMark(doc, x, y + 1, cnc, 'C', cW);
          drawCncMark(doc, x + cW, y + 1, cnc, 'NC', cW);
          cncDrawn = true;
        }
      } else if (c.kind === 'obs') {
        drawTextOrClosed(doc, row.observation, x, y + 1, {
          width: c.w,
          rowH: 10,
          cellY: y,
          fontSize: 4.5,
          closeIfEmpty: false,
        });
      } else if (c.kind === 'ac') {
        drawTextOrClosed(doc, row.corrective, x, y + 1, { width: c.w, rowH: 10, cellY: y, fontSize: 4.5 });
      } else {
        let raw: unknown = undefined;
        if (c.label === 'Código') raw = row.codigo;
        else if (c.label === 'Responsable' || c.label === operarioLabel || c.label === 'Operario')
          raw = row.operario ?? row.responsable;
        else if (c.label === 'Cant.') raw = row.cantidad;
        else if (c.label === 'Tiempo') raw = row.tiempo ?? row.minutos;
        else if (c.label === 'Temp °C' || c.label === 'Temp') raw = row.temperatura ?? row.valor;
        else if (c.label === 'Hora') raw = row.hora ?? row.turno;
        drawTextOrClosed(doc, raw, x, y + 1, { width: c.w, rowH: 10, cellY: y, align: 'center', fontSize: 4.5 });
      }
      x += c.w;
    });
    y += 10;
  };

  items.forEach((item) => {
    const minSlots = item.slotCount ?? 2;
    const entries = normalizePcPdfEntries(value[item.key], minSlots);
    entries.forEach((row, ei) => renderPcRow(item.label, row, ei === 0));
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
  const hallazgoCols = [
    { key: 'vr_cr', label: 'CR', group: 'V.R.' },
    { key: 'vb_cr', label: 'CR', group: 'V.B.' },
    { key: 'vb_mf', label: 'MF', group: 'V.B.' },
    { key: 'cb_cr', label: 'CR', group: 'CB' },
    { key: 'pm_coc', label: 'COC', group: 'P.M.' },
    { key: 'pm_pelo', label: 'PELO', group: 'P.M.' },
    { key: 'lg_cr', label: 'CR', group: 'L.G.' },
  ];
  const { title, subtitle } = fieldBannerTitle(field);
  let y = drawSectionBanner(doc, startY, title, subtitle ?? field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const idxW = 14;
  const codW = 34;
  const subW = 7;
  const hallBlockW = subW * 3;
  const tail = w - idxW - codW - hallBlockW * hallazgoCols.length;
  const obsW = tail * 0.55;
  const acW = tail - obsW;

  y = ensurePageSpace(doc, ctx, y, 12);
  drawTableRowBorder(doc, y, 11, '#f3f4f6');
  doc.fontSize(5).font('Helvetica-Bold');
  let x = MARGIN;
  doc.text('#', x, y + 2, { width: idxW, align: 'center' });
  x += idxW;
  doc.text('Código', x, y + 2, { width: codW });
  x += codW;
  const groups = ['V.R.', 'V.B.', 'CB', 'P.M.', 'L.G.'];
  const groupSpans = [1, 2, 1, 2, 1];
  groups.forEach((g, gi) => {
    doc.text(g, x, y + 2, { width: hallBlockW * groupSpans[gi], align: 'center' });
    x += hallBlockW * groupSpans[gi];
  });
  doc.text('Obs.', x, y + 2, { width: obsW });
  doc.text('AC', x + obsW, y + 2, { width: acW });
  y += 11;

  y = ensurePageSpace(doc, ctx, y, 10);
  drawTableRowBorder(doc, y, 10, '#fafafa');
  x = MARGIN + idxW + codW;
  doc.fontSize(4.5).font('Helvetica-Bold');
  hallazgoCols.forEach((c) => {
    doc.text(c.label, x, y + 1, { width: hallBlockW, align: 'center' });
    x += hallBlockW;
  });
  y += 10;

  rows.forEach((row, i) => {
    const hallazgos = (row.hallazgos ?? {}) as Record<string, string>;
    y = ensurePageSpace(doc, ctx, y, 10);
    if (i % 2 === 1) drawTableRowBorder(doc, y, 10, '#f9fafb');
    else drawTableRowBorder(doc, y, 10);
    doc.fontSize(5).font('Helvetica').fillColor('#111');
    x = MARGIN;
    doc.text(String(i + 1), x, y + 1, { width: idxW, align: 'center' });
    x += idxW;
    drawTextOrClosed(doc, row.codigo, x, y + 1, { width: codW, rowH: 10, cellY: y, fontSize: 5 });
    x += codW;
    hallazgoCols.forEach((col) => {
      const cnc = normalizeCnc(hallazgos[col.key]);
      drawCncMark(doc, x, y + 1, cnc, 'C', subW);
      drawCncMark(doc, x + subW, y + 1, cnc, 'NC', subW);
      drawCncMark(doc, x + subW * 2, y + 1, cnc, 'NA', subW);
      x += hallBlockW;
    });
    drawTextOrClosed(doc, row.observation, x, y + 1, {
      width: obsW,
      rowH: 10,
      cellY: y,
      fontSize: 5,
      closeIfEmpty: false,
    });
    drawTextOrClosed(doc, row.corrective, x + obsW, y + 1, { width: acW, rowH: 10, cellY: y, fontSize: 5 });
    y += 10;
  });
  return y + 6;
}

function getRepeaterColumns(opts: FieldOptions): {
  key: string;
  label: string;
  type?: string;
  headerGroup?: string;
  options?: { choices?: string[] };
}[] {
  const rawCols = opts.columns;
  let cols: { key: string; label: string; type?: string; headerGroup?: string; options?: { choices?: string[] } }[] =
    opts.columns_def ?? [];
  if (Array.isArray(rawCols) && rawCols[0] && typeof rawCols[0] === 'object' && 'key' in (rawCols[0] as object)) {
    cols = rawCols as typeof cols;
  }
  return cols;
}

/** PDF en bloques (como las tarjetas de la UI), evita tablas demasiado anchas. */
function renderCardRepeater(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  rows: Record<string, unknown>[],
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const cols = getRepeaterColumns(opts);
  const entryLabel = opts.entryLabel ?? 'Registro';
  const maxW = pageWidth(doc) - MARGIN * 2;
  const gap = 10;
  const colW = (maxW - gap) / 2;
  let y = startY;

  if (rows.length === 0) {
    doc.fontSize(6).font('Helvetica').fillColor('#666').text('Sin registros', MARGIN, y + 2);
    return y + 12;
  }

  const drawCardField = (
    col: (typeof cols)[0],
    raw: unknown,
    x: number,
    top: number,
    width: number
  ): number => {
    const isCnc = col.type === 'CHECKLIST';
    const label = `${col.label}:`;
    const labelH = measureTextHeight(doc, label, width, 5.5, 'Helvetica-Bold');
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#444').text(label, x, top, {
      width,
      lineGap: 0,
    });
    const valueTop = top + labelH + 1;
    const valueH = 10;
    if (isCnc) {
      drawCncValueOrClosed(doc, raw, x, valueTop, { width, rowH: valueH, cellY: valueTop });
    } else {
      const closeEmpty = !isObservationPdfField(col.key) && !isObservationPdfField(col.label);
      if (isBlankPdfValue(raw)) {
        if (closeEmpty) drawClosedBlank(doc, x, valueTop, width, valueH);
      } else {
        const text = str(raw);
        doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(text, x, valueTop, {
          width,
          lineGap: 0,
        });
        return labelH + 1 + Math.max(valueH, measureTextHeight(doc, text, width, 6.5));
      }
    }
    return labelH + 1 + valueH;
  };

  rows.forEach((row, idx) => {
    y = ensurePageSpace(doc, ctx, y, 28);
    y = drawSectionBanner(doc, y, `${entryLabel} ${idx + 1}`, undefined, true);

    if (cols.length === 0) {
      const parts = Object.entries(row)
        .filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => `${k}: ${str(v)}`);
      doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(parts.join(' · ') || '—', MARGIN, y, {
        width: maxW,
      });
      y += 12;
      return;
    }

    let i = 0;
    while (i < cols.length) {
      const col = cols[i];
      const isWide = col.type === 'TEXTAREA' || col.type === 'MULTI_SELECT';
      const raw = row[col.key];

      if (isWide) {
        const label = `${col.label}:`;
        const labelH = measureTextHeight(doc, label, maxW, 5.5, 'Helvetica-Bold');
        let bodyH = 10;
        if (!isBlankPdfValue(raw)) {
          bodyH = Math.max(10, measureTextHeight(doc, str(raw), maxW, 6.5));
        }
        const blockH = labelH + bodyH + 6;
        y = ensurePageSpace(doc, ctx, y, blockH);
        doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#444').text(label, MARGIN, y, {
          width: maxW,
          lineGap: 0,
        });
        const valueTop = y + labelH + 1;
        if (isBlankPdfValue(raw)) {
          if (!isObservationPdfField(col.key) && !isObservationPdfField(col.label)) {
            drawClosedBlank(doc, MARGIN, valueTop, maxW, 10);
          }
        } else {
          doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(str(raw), MARGIN, valueTop, {
            width: maxW,
            lineGap: 0,
          });
        }
        y += blockH;
        i += 1;
        continue;
      }

      const next = cols[i + 1];
      const nextWide = next && (next.type === 'TEXTAREA' || next.type === 'MULTI_SELECT');
      if (next && !nextWide) {
        const leftLabelH = measureTextHeight(doc, `${col.label}:`, colW, 5.5, 'Helvetica-Bold');
        const rightLabelH = measureTextHeight(doc, `${next.label}:`, colW, 5.5, 'Helvetica-Bold');
        const pairH = Math.max(leftLabelH, rightLabelH) + 14;
        y = ensurePageSpace(doc, ctx, y, pairH);
        const hL = drawCardField(col, row[col.key], MARGIN, y, colW);
        const hR = drawCardField(next, row[next.key], MARGIN + colW + gap, y, colW);
        y += Math.max(hL, hR) + 6;
        i += 2;
      } else {
        const labelH = measureTextHeight(doc, `${col.label}:`, maxW, 5.5, 'Helvetica-Bold');
        y = ensurePageSpace(doc, ctx, y, labelH + 14);
        const h = drawCardField(col, raw, MARGIN, y, maxW);
        y += h + 6;
        i += 1;
      }
    }

    y += 4;
  });

  return y + 2;
}

/** PDF: 4 lotes con registros anidados (Verificación Producto Terminado). */
function renderProductoTerminadoLotes(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  rows: Record<string, unknown>[],
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const cols = getRepeaterColumns(opts);
  const maxW = pageWidth(doc) - MARGIN * 2;
  let y = startY;

  const lotes = rows.length > 0 ? rows : [{ lote: '', registros: [{}] }];

  lotes.forEach((loteRaw, loteIdx) => {
    const lote = loteRaw as { lote?: string; registros?: Record<string, unknown>[] };
    const regs = Array.isArray(lote.registros) && lote.registros.length > 0 ? lote.registros : [{}];

    y = ensurePageSpace(doc, ctx, y, 28);
    y = drawSectionBanner(doc, y, `Registro de lote ${loteIdx + 1}`, undefined, true);
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#333').text('Lote:', MARGIN, y);
    drawTextOrClosed(doc, lote.lote, MARGIN + 28, y, {
      width: maxW - 28,
      rowH: 10,
      cellY: y - 1,
      fontSize: 6.5,
    });
    y += 12;

    regs.forEach((row, regIdx) => {
      y = ensurePageSpace(doc, ctx, y, 24);
      y = drawSectionBanner(doc, y, `Registro ${regIdx + 1}`, undefined, true);

      const half = maxW / 2;
      let colIndex = 0;
      let rowTop = y;

      const flushRow = () => {
        if (colIndex > 0) {
          y = rowTop + 11;
          colIndex = 0;
        }
      };

      cols.forEach((col) => {
        const isWide = col.type === 'TEXTAREA' || col.type === 'MULTI_SELECT';
        const isCnc = col.type === 'CHECKLIST';
        const raw = row[col.key];
        const valueText = isCnc ? normalizeCnc(raw) : isBlankPdfValue(raw) ? '' : str(raw);

        if (isWide) {
          flushRow();
          y = ensurePageSpace(doc, ctx, y, 14);
          doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#444').text(`${col.label}:`, MARGIN, y, {
            width: maxW,
          });
          y += 8;
          if (isCnc) {
            doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(valueText, MARGIN, y, { width: maxW });
            y += 12;
          } else if (isBlankPdfValue(raw)) {
            if (!isObservationPdfField(col.key) && !isObservationPdfField(col.label)) {
              drawClosedBlank(doc, MARGIN, y, maxW, 12);
              y += 16;
            } else {
              y += 10;
            }
          } else {
            const h = Math.max(10, doc.heightOfString(valueText, { width: maxW }));
            y = ensurePageSpace(doc, ctx, y, h);
            doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(valueText, MARGIN, y, { width: maxW });
            y += h + 3;
          }
          rowTop = y;
          return;
        }

        if (colIndex === 0) {
          y = ensurePageSpace(doc, ctx, y, 12);
          rowTop = y;
        }
        const x = MARGIN + colIndex * half;
        doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#444').text(`${col.label}:`, x, rowTop, {
          width: half - 4,
        });
        if (isCnc) {
          doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(valueText, x + 1, rowTop + 7, {
            width: half - 6,
          });
        } else {
          drawTextOrClosed(doc, raw, x + 1, rowTop + 7, {
            width: half - 6,
            rowH: 11,
            cellY: rowTop + 6,
            fontSize: 6.5,
            closeIfEmpty: !isObservationPdfField(col.key) && !isObservationPdfField(col.label),
          });
        }
        colIndex += 1;
        if (colIndex >= 2) {
          y = rowTop + 18;
          colIndex = 0;
        }
      });
      flushRow();
      y += 4;
    });
  });

  return y + 2;
}

/** Etiquetas cortas para cabeceras de grupos C/NC en PDF (evita solapes). */
function pdfChecklistGroupLabel(label: string): string {
  const key = label.trim().toLowerCase();
  const map: Record<string, string> = {
    'sellado y presentación': 'Sellado',
    'sellado y presentacion': 'Sellado',
    'información etiqueta': 'Info. etiq.',
    'informacion etiqueta': 'Info. etiq.',
    'etiqueta legible': 'Etiq. legible',
    guantes: 'Guantes',
    'guante de malla': 'G. malla',
    cuchillo: 'Cuchillo',
    'gancho despostador': 'Gancho',
    'soporte gancho deshuesador': 'Sop. gancho',
  };
  return map[key] ?? label;
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
  if (opts.layout === 'card_repeater') {
    return renderCardRepeater(doc, ctx, field, rows, startY);
  }
  if (opts.layout === 'producto_terminado_lotes') {
    return renderProductoTerminadoLotes(doc, ctx, field, rows, startY);
  }
  const cols = getRepeaterColumns(opts);
  if (cols.length === 0) {
    let y = startY;
    rows.forEach((row, i) => {
      const parts = Object.entries(row)
        .filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => `${k}: ${str(v)}`);
      y = ensurePageSpace(doc, ctx, y, 10);
      doc.fontSize(6.5).font('Helvetica').text(`${i + 1}. ${parts.join(' · ')}`, MARGIN, y, {
        width: pageWidth(doc) - MARGIN * 2,
      });
      y += 10;
    });
    return y + 4;
  }

  const tableW = pageWidth(doc) - MARGIN * 2;
  type PdfCol = {
    key: string;
    label: string;
    cncChoice?: 'C' | 'NC' | 'NA';
    groupLabel?: string;
    headerGroup?: string;
  };
  type ColDef = {
    key: string;
    label: string;
    type?: string;
    headerGroup?: string;
    options?: { choices?: string[] };
  };
  const expanded: PdfCol[] = [{ key: '_idx', label: '#' }];
  const checklistGroups: { label: string; start: number; count: number; headerGroup?: string }[] = [];
  for (const col of cols as ColDef[]) {
    const isCnc = col.key === 'cnc' || col.type === 'CHECKLIST';
    if (isCnc) {
      const choices = (col.options?.choices ?? ['C', 'NC']).filter(
        (c): c is 'C' | 'NC' | 'NA' => c === 'C' || c === 'NC' || c === 'NA'
      );
      const start = expanded.length;
      choices.forEach((c) => {
        expanded.push({
          key: col.key,
          label: c,
          cncChoice: c,
          groupLabel: col.label,
          headerGroup: col.headerGroup,
        });
      });
      checklistGroups.push({
        label: col.label,
        start,
        count: choices.length,
        headerGroup: col.headerGroup,
      });
    } else {
      expanded.push({ key: col.key, label: col.label, headerGroup: col.headerGroup });
    }
  }

  // Bandas superiores (Empaque, Temperatura) cuando hay headerGroup
  type Band = { label: string; start: number; count: number };
  const bands: Band[] = [];
  {
    let i = 1; // saltar #
    while (i < expanded.length) {
      const hg = expanded[i].headerGroup?.trim();
      if (!hg) {
        i += 1;
        continue;
      }
      const start = i;
      while (i < expanded.length && expanded[i].headerGroup?.trim() === hg) i += 1;
      bands.push({ label: hg, start, count: i - start });
    }
  }

  const widthCols: PdfTableColumn[] = expanded.map((col) => ({
    key: col.key,
    label: col.label,
    weight: col.key === '_idx' ? 0.3 : col.cncChoice ? (checklistGroups.length >= 4 ? 0.55 : 0.48) : undefined,
    compact: Boolean(col.cncChoice) || col.key === '_idx' || col.key.startsWith('decomiso_'),
  }));
  const colWidths = allocateColWidths(tableW, widthCols);
  const colX = (i: number) => MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
  const spanW = (start: number, count: number) =>
    colWidths.slice(start, start + count).reduce((a, b) => a + b, 0);

  let y = startY;
  const hasGroups = checklistGroups.length > 0;
  const hasBands = bands.length > 0;
  const cncSubRowH = 9;

  const measureGroupedHeaderH = (): number => {
    if (!hasGroups) return 11;
    doc.fontSize(4.5).font('Helvetica-Bold');
    let maxGroupH = 8;
    for (const g of checklistGroups) {
      const label = pdfChecklistGroupLabel(g.label).toUpperCase();
      const w = Math.max(10, spanW(g.start, g.count) - 2);
      maxGroupH = Math.max(maxGroupH, measureTextHeight(doc, label, w, 4.5, 'Helvetica-Bold'));
    }
    if (hasBands) {
      return Math.min(42, 10 + maxGroupH + cncSubRowH);
    }
    return Math.min(36, 3 + maxGroupH + cncSubRowH);
  };

  const headerH = measureGroupedHeaderH();

  const drawRepeaterHeader = (atY: number): number => {
    drawTableRowBorder(doc, atY, headerH, '#d9ead3');
    doc.fillColor('#333');

    if (hasBands && hasGroups) {
      doc.fontSize(5).font('Helvetica-Bold');
      expanded.forEach((col, i) => {
        if (col.key === '_idx' || col.headerGroup) return;
        doc.text(col.label, colX(i) + 1, atY + 2, {
          width: colWidths[i] - 2,
          align: 'left',
        });
      });
      doc.text('#', colX(0) + 1, atY + 2, { width: colWidths[0] - 2, align: 'center' });
      bands.forEach((b) => {
        doc.fontSize(4.5).font('Helvetica-Bold').text(b.label.toUpperCase(), colX(b.start) + 1, atY + 1, {
          width: spanW(b.start, b.count) - 2,
          align: 'center',
          lineGap: 0,
        });
      });
      const groupTop = atY + 9;
      checklistGroups.forEach((g) => {
        doc.fontSize(4.5).font('Helvetica-Bold').text(pdfChecklistGroupLabel(g.label).toUpperCase(), colX(g.start) + 1, groupTop, {
          width: spanW(g.start, g.count) - 2,
          align: 'center',
          lineGap: 0,
        });
      });
      expanded.forEach((col, i) => {
        if (col.cncChoice || col.key === '_idx' || !col.headerGroup) return;
        doc.fontSize(4.5).font('Helvetica-Bold').text(col.label, colX(i) + 1, groupTop, {
          width: colWidths[i] - 2,
          align: 'center',
          lineGap: 0,
        });
      });
      const subY = atY + headerH - cncSubRowH + 1;
      checklistGroups.forEach((g) => {
        for (let j = 0; j < g.count; j++) {
          const col = expanded[g.start + j];
          doc.fontSize(5).font('Helvetica-Bold').text(col.label, colX(g.start + j) + 1, subY, {
            width: colWidths[g.start + j] - 2,
            align: 'center',
          });
        }
      });
    } else if (hasGroups) {
      const subY = atY + headerH - cncSubRowH + 1;
      const midY = atY + Math.max(2, (headerH - cncSubRowH) / 2 - 2);

      expanded.forEach((col, i) => {
        if (col.key === '_idx' || !col.cncChoice) {
          doc.fontSize(5).font('Helvetica-Bold').text(col.label, colX(i) + 1, midY, {
            width: colWidths[i] - 2,
            align: col.key === '_idx' ? 'center' : 'left',
            lineGap: 0,
          });
        }
      });
      checklistGroups.forEach((g) => {
        doc
          .fontSize(4.5)
          .font('Helvetica-Bold')
          .text(pdfChecklistGroupLabel(g.label).toUpperCase(), colX(g.start) + 1, atY + 2, {
            width: spanW(g.start, g.count) - 2,
            align: 'center',
            lineGap: 0,
          });
      });
      checklistGroups.forEach((g) => {
        for (let j = 0; j < g.count; j++) {
          const col = expanded[g.start + j];
          doc.fontSize(5).font('Helvetica-Bold').text(col.label, colX(g.start + j) + 1, subY, {
            width: colWidths[g.start + j] - 2,
            align: 'center',
          });
        }
      });
    } else {
      doc.fontSize(5).font('Helvetica-Bold');
      expanded.forEach((col, i) =>
        doc.text(col.label, colX(i) + 2, atY + 2, {
          width: colWidths[i] - 4,
          align: col.key === '_idx' || col.cncChoice ? 'center' : 'left',
        })
      );
    }
    return atY + headerH;
  };

  y = ensurePageSpace(doc, ctx, y, headerH);
  y = drawRepeaterHeader(y);

  if (rows.length === 0) {
    doc.fontSize(6).font('Helvetica').fillColor('#666').text('Sin registros', MARGIN, y + 2);
    return y + 12;
  }

  const fontSize = 5.5;
  const padY = 2;
  const minRowH = 11;
  const maxRowH = 72;

  rows.forEach((row, ri) => {
    let contentH = fontSize + 2;
    expanded.forEach((col, i) => {
      if (col.cncChoice || col.key === '_idx') return;
      if (col.key === 'decomiso_parcial' || col.key === 'decomiso_total') return;
      const cell = row[col.key];
      if (isBlankPdfValue(cell)) return;
      contentH = Math.max(contentH, measureTextHeight(doc, str(cell), colWidths[i] - 4, fontSize));
    });
    const rowH = Math.min(maxRowH, Math.max(minRowH, contentH + padY * 2));

    if (y + rowH > contentBottom(doc)) {
      y = startSheetPage(doc, ctx, true);
      y = drawRepeaterHeader(y);
    }

    if (ri % 2 === 1) drawTableRowBorder(doc, y, rowH, '#f9fafb');
    else drawTableRowBorder(doc, y, rowH);

    expanded.forEach((col, i) => {
      const x = colX(i) + 2;
      const cellW = colWidths[i] - 4;
      if (col.key === '_idx') {
        doc
          .fontSize(fontSize)
          .font('Helvetica-Bold')
          .fillColor('#666')
          .text(String(ri + 1), x, y + padY, { width: cellW, align: 'center' });
        return;
      }
      if (col.cncChoice) {
        drawCncMark(doc, x, y + padY, normalizeCnc(row[col.key]), col.cncChoice, cellW);
        return;
      }
      if (col.key === 'decomiso_parcial') {
        const marked = String(row[col.key] ?? '') === 'Parcial';
        if (marked) {
          doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#111').text('X', x, y + padY, {
            width: cellW,
            align: 'center',
          });
        } else {
          drawClosedBlank(doc, x, y, cellW, rowH);
        }
        return;
      }
      if (col.key === 'decomiso_total') {
        const marked = String(row[col.key] ?? '') === 'Total';
        if (marked) {
          doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#111').text('X', x, y + padY, {
            width: cellW,
            align: 'center',
          });
        } else {
          drawClosedBlank(doc, x, y, cellW, rowH);
        }
        return;
      }
      drawTextOrClosed(doc, row[col.key], x, y + padY, {
        width: cellW,
        rowH,
        cellY: y,
        fontSize,
        align: 'left',
        closeIfEmpty: !isObservationPdfField(col.key) && !isObservationPdfField(col.label),
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
      const obsRaw = row.observaciones ?? row.observation;
      const puntoH = measureTextHeight(doc, punto, puntoW - 4, 5.5);
      const obsH = !isBlankPdfValue(obsRaw) ? measureTextHeight(doc, str(obsRaw), obsW - 4, 5.5) : 7;
      const rowH = Math.min(48, Math.max(10, Math.max(puntoH, obsH) + 4));

      if (y + rowH > contentBottom(doc)) {
        y = startSheetPage(doc, ctx, true);
        drawTableRowBorder(doc, y, 11, '#f3f4f6');
        doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
        x = MARGIN;
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
      }

      drawTableRowBorder(doc, y, rowH);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(punto, x + 2, y + 1, { width: puntoW - 4, lineGap: 0 });
      x += puntoW;
      drawTextOrClosed(doc, row.cloro_residual, x, y + 1, {
        width: cloroW,
        rowH,
        cellY: y,
        align: 'center',
      });
      x += cloroW;
      doc.text('7.0', x, y + 1, { width: phW, align: 'center' });
      x += phW;
      drawCncCells(doc, x, y + 1, cnc, cW, false);
      drawTextOrClosed(doc, obsRaw, x + cW * 2 + 2, y + 1, {
        width: obsW - 4,
        rowH,
        cellY: y,
        closeIfEmpty: false,
      });
      y += rowH;
    }
  } else if (tableType === 'esterilizadores') {
    const noteW = 52;
    const puntoW = Math.min(100, w * 0.26);
    const tempW = 44;
    const cW = 12;
    const obsW = w - noteW - puntoW - tempW - cW * 2;
    const estNote =
      'Funcionamiento, temperatura (82,5°C) o solución desinfectante aprobada para utilización en industria de alimentos';

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
    let x = MARGIN;
    doc.text('', x, y + 2, { width: noteW });
    x += noteW;
    doc.text('Puntos de inspección', x + 2, y + 2, { width: puntoW });
    x += puntoW;
    doc.text('Temp °C', x, y + 2, { width: tempW, align: 'center' });
    x += tempW;
    doc.text('C', x, y + 2, { width: cW, align: 'center' });
    doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
    doc.text('Observación', x + cW * 2 + 2, y + 2, { width: obsW - 4 });
    y += 11;

    for (let pi = 0; pi < points.length; pi++) {
      const punto = points[pi];
      const key = slugifyPoint(punto);
      const row = value[key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      if (pi % 2 === 1) drawTableRowBorder(doc, y, 10, '#f9fafb');
      else drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      if (pi === 0) {
        doc.fontSize(4.5).font('Helvetica-Bold').text('ESTERILIZADORES', x + 2, y + 1, { width: noteW - 4 });
        doc.fontSize(4).font('Helvetica').text(estNote, x + 2, y + 8, { width: noteW - 4 });
      }
      x += noteW;
      doc.text(punto, x + 2, y + 1, { width: puntoW - 4 });
      x += puntoW;
      drawTextOrClosed(doc, row.temperatura, x, y + 1, {
        width: tempW,
        rowH: pi === 0 ? 22 : 10,
        cellY: y,
        align: 'center',
      });
      x += tempW;
      drawCncCells(doc, x, y + 1, cnc, cW, false);
      drawTextOrClosed(doc, row.observaciones, x + cW * 2 + 2, y + 1, {
        width: obsW - 4,
        rowH: pi === 0 ? 22 : 10,
        cellY: y,
        closeIfEmpty: false,
      });
      y += pi === 0 ? 22 : 10;
    }
  } else {
    doc.fontSize(6.5).font('Helvetica').fillColor('#666').text('Tipo de tabla no soportado en PDF.', MARGIN, y);
    y += 14;
  }
  return y + 6;
}

type MeasureRow = Record<string, string>;

function renderFormalMeasureTable(
  doc: PdfDoc,
  ctx: SheetPageContext,
  field: FormatField,
  value: Record<string, MeasureRow> | MeasureRow[],
  startY: number
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const tableType = opts.tableType ?? 'cloro';
  const showNa = opts.mode === 'cnc_na';
  const { title, subtitle } = fieldBannerTitle(field);
  let y = drawSectionBanner(doc, startY, title, subtitle ?? field.helpText ?? undefined, true);
  const w = pageWidth(doc) - MARGIN * 2;
  const valueMap: Record<string, MeasureRow> = Array.isArray(value) ? {} : (value ?? {});

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
      const row = valueMap[item.key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(String(idx + 1), x, y + 1, { width: cols[0].w, align: 'center' });
      x += cols[0].w;
      drawTextOrClosed(doc, row.hora, x, y + 1, { width: cols[1].w, rowH: 10, cellY: y });
      x += cols[1].w;
      doc.text(row.punto_toma ?? item.label, x, y + 1, { width: cols[2].w });
      x += cols[2].w;
      doc.text(row.ph ?? '7.0', x, y + 1, { width: cols[3].w, align: 'center' });
      x += cols[3].w;
      drawTextOrClosed(doc, row.cloro_residual, x, y + 1, {
        width: cols[4].w,
        rowH: 10,
        cellY: y,
        align: 'center',
      });
      x += cols[4].w;
      x = drawCncCells(doc, x, y + 1, cnc, cW, showNa);
      drawTextOrClosed(doc, row.corrective ?? row.observation, x, y + 1, {
        width: corrW,
        rowH: 10,
        cellY: y,
      });
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
      const row = valueMap[item.key] ?? {};
      const cnc = normalizeCnc(row.cnc);
      y = ensurePageSpace(doc, ctx, y, 10);
      drawTableRowBorder(doc, y, 10);
      doc.fontSize(5.5).font('Helvetica').fillColor('#111');
      x = MARGIN;
      doc.text(item.label, x, y + 1, { width: cols[0].w });
      x += cols[0].w;
      drawTextOrClosed(doc, row.hora, x, y + 1, { width: cols[1].w, rowH: 10, cellY: y });
      x += cols[1].w;
      drawTextOrClosed(doc, row.temperatura, x, y + 1, {
        width: cols[2].w,
        rowH: 10,
        cellY: y,
        align: 'center',
      });
      x += cols[2].w;
      x = drawCncCells(doc, x, y + 1, cnc, cW, showNa);
      drawTextOrClosed(doc, row.observation, x, y + 1, { width: obsW, rowH: 10, cellY: y, closeIfEmpty: false });
      y += 10;
    });
    return y + 6;
  }

  if (tableType === 'pediluvios') {
    const areaLabel = items[0]?.label ?? 'Pediluvios';
    const operativo = opts.pediluviosLayout === 'operativo';
    const rowsFromValue = (): MeasureRow[] => {
      if (Array.isArray(value)) return value as MeasureRow[];
      if (value && typeof value === 'object') {
        if (opts.allowAddRows) {
          return Object.values(value as Record<string, MeasureRow>);
        }
        return items.map((item) => valueMap[item.key] ?? {});
      }
      return [];
    };
    const rows = rowsFromValue();

    y = ensurePageSpace(doc, ctx, y, 12);
    drawTableRowBorder(doc, y, 11, '#f3f4f6');
    doc.fontSize(5.5).font('Helvetica-Bold');
    let x = MARGIN;
    if (operativo) {
      const cols = [
        { l: 'Área', w: 90 },
        { l: 'Hora', w: 34 },
        { l: 'Principio activo', w: 90 },
        { l: 'Conc. ppm', w: 40 },
      ];
      const cW = 12;
      const corrW = w - cols.reduce((a, c) => a + c.w, 0) - cW * 2;
      cols.forEach((c) => {
        doc.text(c.l, x, y + 2, { width: c.w });
        x += c.w;
      });
      doc.text('C', x, y + 2, { width: cW, align: 'center' });
      doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
      doc.text('Corrección', x + cW * 2, y + 2, { width: corrW });
      y += 11;

      rows.forEach((row) => {
        const cnc = normalizeCnc(row.cnc);
        y = ensurePageSpace(doc, ctx, y, 10);
        drawTableRowBorder(doc, y, 10);
        doc.fontSize(5.5).font('Helvetica').fillColor('#111');
        x = MARGIN;
        doc.text(areaLabel, x, y + 1, { width: cols[0].w });
        x += cols[0].w;
        drawTextOrClosed(doc, row.hora, x, y + 1, { width: cols[1].w, rowH: 10, cellY: y });
        x += cols[1].w;
        drawTextOrClosed(doc, row.principio_activo, x, y + 1, { width: cols[2].w, rowH: 10, cellY: y });
        x += cols[2].w;
        drawTextOrClosed(doc, row.concentracion, x, y + 1, {
          width: cols[3].w,
          rowH: 10,
          cellY: y,
          align: 'center',
        });
        x += cols[3].w;
        x = drawCncCells(doc, x, y + 1, cnc, cW, false);
        drawTextOrClosed(doc, row.corrective, x, y + 1, { width: corrW, rowH: 10, cellY: y });
        y += 10;
      });
    } else {
      items.forEach((item) => {
        const row = valueMap[item.key] ?? {};
        const parts = [
          row.principio_activo && `PA: ${row.principio_activo}`,
          row.concentracion && `ppm: ${row.concentracion}`,
          row.cnc && `C/NC: ${row.cnc}`,
          row.corrective && `Corr: ${row.corrective}`,
        ].filter(Boolean);
        y = ensurePageSpace(doc, ctx, y, 10);
        doc.fontSize(5.5).font('Helvetica').text(`${item.label}: ${parts.join(' · ') || '—'}`, MARGIN, y, {
          width: w,
        });
        y += 10;
      });
    }
    return y + 6;
  }

  if (tableType === 'monitoreo') {
    const valorLabel = opts.valorLabel ?? 'Valor';
    const aspectRows = opts.aspectRows === true;
    const hasValor = opts.monitoreoVariant === 'tiempos' || opts.monitoreoVariant === 'temperatura';
    const cW = 12;
    const cCols = 2;
    const aspectW = 95;
    const turnoW = 36;
    const valorW = hasValor ? 40 : 0;
    const tailW = w - aspectW - turnoW - valorW - cW * cCols;
    const obsW = tailW;

    const normalizePdfEntries = (raw: unknown, minSlots: number): Record<string, unknown>[] => {
      if (Array.isArray(raw)) {
        const arr = raw as Record<string, unknown>[];
        if (arr.length >= minSlots) return arr;
        return [...arr, ...Array.from({ length: minSlots - arr.length }, () => ({}))];
      }
      if (raw && typeof raw === 'object') {
        return [raw as Record<string, unknown>, ...Array.from({ length: minSlots - 1 }, () => ({}))];
      }
      return Array.from({ length: minSlots }, () => ({}));
    };

    y = ensurePageSpace(doc, ctx, y, aspectRows && hasValor ? 20 : 12);
    drawTableRowBorder(doc, y, 11, '#d9ead3');
    doc.fontSize(5.5).font('Helvetica-Bold');
    let x = MARGIN;
    if (aspectRows && hasValor) {
      doc.text('Aspecto', x, y + 2, { width: aspectW });
      x += aspectW;
      doc.text('Condiciones de proceso', x, y + 2, { width: turnoW + valorW, align: 'center' });
      x += turnoW + valorW;
      doc.text('C', x, y + 2, { width: cW, align: 'center' });
      doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
      doc.text('Obs.', x + cW * cCols, y + 2, { width: obsW });
      y += 11;
      drawTableRowBorder(doc, y, 10, '#e8f4e8');
      x = MARGIN + aspectW;
      doc.text('Turno', x, y + 1, { width: turnoW });
      doc.text(valorLabel, x + turnoW, y + 1, { width: valorW });
      y += 10;
    } else {
      doc.text('Aspecto', x, y + 2, { width: aspectW });
      x += aspectW;
      doc.text('Turno', x, y + 2, { width: turnoW });
      x += turnoW;
      if (hasValor) {
        doc.text(valorLabel, x, y + 2, { width: valorW });
        x += valorW;
      }
      doc.text('C', x, y + 2, { width: cW, align: 'center' });
      doc.text('NC', x + cW, y + 2, { width: cW, align: 'center' });
      doc.text(aspectRows ? 'Obs.' : 'Obs.', x + cW * cCols, y + 2, { width: obsW });
      if (!aspectRows) doc.text('AC', x + cW * cCols + obsW * 0.55, y + 2, { width: obsW * 0.45 });
      y += 11;
    }

    items.forEach((item) => {
      const minSlots = (item as { slotCount?: number }).slotCount ?? (aspectRows ? 4 : 1);
      const entries = aspectRows ? normalizePdfEntries(valueMap[item.key], minSlots) : [valueMap[item.key] ?? {}];
      entries.forEach((row, ei) => {
        const cnc = normalizeCnc(row.cnc);
        y = ensurePageSpace(doc, ctx, y, 10);
        drawTableRowBorder(doc, y, 10);
        doc.fontSize(5).font('Helvetica').fillColor('#111');
        x = MARGIN;
        if (ei === 0 || !aspectRows) {
          doc.text(item.label, x, y + 1, { width: aspectW });
        } else {
          doc.text('', x, y + 1, { width: aspectW });
        }
        x += aspectW;
        drawTextOrClosed(doc, row.turno, x, y + 1, { width: turnoW, rowH: 10, cellY: y, fontSize: 5 });
        x += turnoW;
        if (hasValor) {
          const valor = row.valor ?? row.minutos ?? row.temperatura;
          drawTextOrClosed(doc, valor, x, y + 1, {
            width: valorW,
            rowH: 10,
            cellY: y,
            align: 'center',
            fontSize: 5,
          });
          x += valorW;
        }
        x = drawCncCells(doc, x, y + 1, cnc, cW, false);
        drawTextOrClosed(doc, row.observation, x, y + 1, {
          width: aspectRows ? obsW : obsW * 0.55,
          rowH: 10,
          cellY: y,
          fontSize: 5,
          closeIfEmpty: false,
        });
        if (!aspectRows) {
          drawTextOrClosed(doc, row.corrective, x + obsW * 0.55, y + 1, {
            width: obsW * 0.45,
            rowH: 10,
            cellY: y,
            fontSize: 5,
          });
        }
        y += 10;
      });
    });
    return y + 6;
  }

  // Fallback: list rows as text
  items.forEach((item) => {
    const row = valueMap[item.key] ?? {};
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
  y: number,
  sheetData?: Record<string, unknown>
): number {
  if (field.fieldKey === 'empresa') return y;
  if (
    ctx.formatCode === 'POES_OPERATIVO' &&
    (field.fieldKey === 'poes_hora_1' || field.fieldKey === 'poes_hora_2')
  ) {
    return y;
  }
  const opts = (field.options ?? {}) as FieldOptions;
  const maxW = pageWidth(doc) - MARGIN * 2;

  y = ensurePageSpace(doc, ctx, y, 18);
  const isItemChecklist = field.fieldType === 'CHECKLIST' && Boolean(opts.items?.length);
  const isDaySchedule = field.fieldType === 'CHECKLIST' && opts.layout === 'day_schedule_table';
  const isFormalMeasure = field.fieldType === 'CHECKLIST' && opts.layout === 'formal_measure_table';
  const skipBanner = shouldSkipOuterBanner(field, opts);

  if (!skipBanner) {
    const { title, subtitle } = fieldBannerTitle(field);
    y = drawSectionBanner(doc, y, title, subtitle, true);
  }

  if (isDaySchedule) {
    return renderDaySchedule(doc, ctx, field, (value as Record<string, Record<string, string>>) ?? {}, y);
  }

  if (isFormalMeasure) {
    return renderFormalMeasureTable(
      doc,
      ctx,
      field,
      (value as Record<string, MeasureRow> | MeasureRow[]) ?? {},
      y
    );
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'poes_operativo_table') {
    return renderPoesOperativoTable(doc, ctx, field, (value as Record<string, Record<string, unknown>>) ?? {}, y, sheetData);
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'poes_bpm_table') {
    return renderPoesBpmTable(doc, ctx, field, (value as Record<string, Record<string, unknown>>) ?? {}, y, sheetData);
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'pc_operativo_table') {
    return renderPcOperativoTable(doc, ctx, field, (value as Record<string, PcMeasureRow | PcMeasureRow[]>) ?? {}, y);
  }

  if (field.fieldType === 'READONLY') {
    const text = field.defaultValue ?? str(value);
    doc.fontSize(7).font('Helvetica').fillColor('#111').text(text, MARGIN, y, { width: maxW });
    return y + doc.heightOfString(text, { width: maxW }) + 8;
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
      drawClosedBlank(doc, MARGIN, y, maxW, 12);
      return y + 16;
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
    if (isBlankPdfValue(value)) {
      if (isObservationPdfField(field.fieldKey) || isObservationPdfField(field.label)) {
        return y + 14;
      }
      drawClosedBlank(doc, MARGIN, y, maxW, 16);
      return y + 22;
    }
    const text = str(value);
    const textH = Math.min(120, Math.max(10, doc.heightOfString(text, { width: maxW })));
    y = ensurePageSpace(doc, ctx, y, textH + 4);
    doc.fontSize(7).font('Helvetica').fillColor('#111').text(text, MARGIN, y, {
      width: maxW,
      height: textH,
      ellipsis: true,
      lineGap: 0,
    });
    return y + textH + 8;
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
    if (value.length === 0) {
      drawClosedBlank(doc, MARGIN, y, maxW, 12);
      return y + 16;
    }
    doc.fontSize(7).font('Helvetica').text(value.join(', '), MARGIN, y, { width: maxW });
    return y + 14;
  }

  if (isBlankPdfValue(value)) {
    if (isObservationPdfField(field.fieldKey) || isObservationPdfField(field.label)) {
      return y + 12;
    }
    drawClosedBlank(doc, MARGIN, y, maxW, 12);
    return y + 16;
  }
  const plain = str(value);
  doc.fontSize(7).font('Helvetica').fillColor('#111').text(plain, MARGIN, y, {
    width: maxW,
    height: 28,
    ellipsis: true,
    lineGap: 0,
  });
  return y + Math.min(28, doc.heightOfString(plain, { width: maxW })) + 8;
}

type RenderSheetOptions = {
  showBoundaries?: boolean;
  isLastInPdf?: boolean;
};

/** Inspección de Hábitos: área (y OPL) una sola vez; luego personal. */
function renderHabitosSheet(
  doc: PdfDoc,
  ctx: SheetPageContext,
  fields: FormatField[],
  sheetData: Record<string, unknown>,
  startY: number
): number {
  let y = startY;
  const area = String(sheetData.area_evaluada ?? '').trim();
  const opl = String(sheetData.opl_externo ?? '').trim();

  if (area) {
    const subtitle =
      area === 'Externos OPL' && opl ? `${area} · OPL externo: ${opl}` : area;
    y = drawSectionBanner(doc, y, 'Área evaluada', subtitle, true);
  }

  for (const field of fields) {
    if (field.fieldKey === 'area_evaluada' || field.fieldKey === 'opl_externo') continue;
    y = renderField(doc, ctx, field, sheetData[field.fieldKey], y, sheetData);
    y += 4;
  }
  return y;
}

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
    LANDSCAPE_FORMAT_CODES.has(submission.format.code) ||
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
  } else if (code === 'HABITOS_HIGIENICOS') {
    y = renderHabitosSheet(doc, ctx, fields, sheetData, y);
  } else {
    for (const field of fields) {
      y = renderField(doc, ctx, field, sheetData[field.fieldKey], y, sheetData);
      y += 4;
    }
  }

  // Firmas después del contenido; página nueva limpia (sin cabecera larga) si no caben
  const sigH = 40;
  y += 8;
  if (y + sigH > contentBottom(doc)) {
    y = startContentPage(doc, ctx);
  }
  drawSignatures(doc, submission.operator.fullName, y, {
    submittedByName: submission.submittedBy?.fullName,
    collaboratorNames: (submission.collaborators ?? []).map((c) => c.user.fullName),
  });

  if (renderOpts?.showBoundaries && !renderOpts.isLastInPdf) {
    drawSheetBoundaryEnd(doc, ctx.sheetIndex, ctx.totalSheets, ctx.sheetName);
  }
}

function drawCollaborationSummaryPage(doc: PDFKit.PDFDocument, submission: SubmissionForPdf) {
  doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
  let y = MARGIN;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text('Resumen de elaboración', MARGIN, y);
  y += 18;
  doc.fontSize(9).font('Helvetica').fillColor('#333');
  doc.text(`Inició: ${submission.operator.fullName}`, MARGIN, y);
  y += 14;
  const collabs = (submission.collaborators ?? []).map((c) => c.user.fullName);
  doc.text(
    collabs.length ? `Colaboradores: ${collabs.join(', ')}` : 'Colaboradores: (ninguno)',
    MARGIN,
    y
  );
  y += 14;
  doc.text(`Entregó: ${submission.submittedBy?.fullName ?? submission.operator.fullName}`, MARGIN, y);
  y += 14;
  if (submission.reviewedBy?.fullName) {
    doc.text(`Revisó: ${submission.reviewedBy.fullName}`, MARGIN, y);
    y += 14;
  }
  // Movimientos/trazabilidad de edición: solo en UI (operario/admin), no en PDF
  return y;
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
      stampPdfPageNumbers(doc);
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

    const hasCollaborators = (submission.collaborators?.length ?? 0) > 0;
    if (hasCollaborators && !options?.sheetId) {
      drawCollaborationSummaryPage(doc, submission);
    }

    stampPdfPageNumbers(doc);
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
