import fs from 'fs';
import path from 'path';
import type PDFDocument from 'pdfkit';
import { workDateToString } from '../utils/workDate';

export type PdfDoc = InstanceType<typeof PDFDocument>;

export const MARGIN = 28;
export const FOOTER_H = 36;

const CALIDAD_CODES = new Set([
  'SAI-CAL-F015',
  'SAI-CAL-F010',
  'AC-FR-017',
  'AC-FR-006',
  'AC-FR-007',
  'AC-FR-009',
  'AC-FR-010',
]);

const VERSION_BY_CODE: Record<string, string> = {
  'AC-FR-017': '03',
  'AC-FR-006': '04',
  'AC-FR-007': '03',
  'AC-FR-009': '03',
  'AC-FR-010': '02',
  'AC-FR-018': '02',
  'SAI-CAL-F010': '01',
  'LD-FR-004': '03',
};

export function pageWidth(doc: PdfDoc) {
  return doc.page.width;
}

export function pageHeight(doc: PdfDoc) {
  return doc.page.height;
}

export function contentBottom(doc: PdfDoc) {
  return pageHeight(doc) - MARGIN - FOOTER_H;
}

/** Fecha de trabajo @db.Date: mostrar el día calendario guardado (sin restar un día por zona horaria). */
export function formatWorkDate(date: Date): string {
  const ymd = workDateToString(date);
  const [y, m, d] = ymd.split('-').map(Number);
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return noonUtc.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function resolveLogoPath(): string | null {
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

function sistemaLabel(documentCode: string | null | undefined): string {
  return documentCode && CALIDAD_CODES.has(documentCode)
    ? 'SISTEMA DE ASEGURAMIENTO DE LA CALIDAD'
    : 'SISTEMA DE ASEGURAMIENTO DE LA INOCUIDAD';
}

export function drawSectionBanner(
  doc: PdfDoc,
  y: number,
  title: string,
  subtitle?: string,
  compact = false
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const h = compact ? (subtitle ? 16 : 12) : subtitle ? 22 : 16;
  doc.rect(MARGIN, y, w, h).fill('#dcfce7');
  doc
    .fillColor('#111')
    .fontSize(compact ? 6.5 : 8)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), MARGIN + 4, y + 3, {
      width: w - 8,
      height: compact ? 7 : 9,
      ellipsis: true,
      lineGap: 0,
    });
  if (subtitle) {
    doc
      .fontSize(compact ? 5.5 : 6.5)
      .font('Helvetica')
      .fillColor('#444')
      .text(subtitle, MARGIN + 4, y + (compact ? 10 : 13), {
        width: w - 8,
        height: compact ? 5 : 7,
        ellipsis: true,
        lineGap: 0,
      });
  }
  return y + h + 4;
}

export function drawSheetBoundaryStart(
  doc: PdfDoc,
  sheetIndex: number,
  totalSheets: number,
  sheetName: string,
  startY = MARGIN
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const h = 14;
  doc.fillColor('#166534').rect(MARGIN, startY, w, h).fill();
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#fff')
    .text(`HOJA ${sheetIndex + 1} DE ${totalSheets} · ${sheetName.toUpperCase()}`, MARGIN + 4, startY + 3, {
      width: w - 8,
      align: 'center',
      height: 10,
      ellipsis: true,
      lineBreak: false,
    });
  return startY + h + 4;
}

export function drawSheetBoundaryEnd(
  doc: PdfDoc,
  sheetIndex: number,
  totalSheets: number,
  sheetName: string
): void {
  const w = pageWidth(doc) - MARGIN * 2;
  // Zona de pie: por encima de la numeración de página
  const y = pageHeight(doc) - MARGIN - FOOTER_H + 4;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + w, y).strokeColor('#166534').lineWidth(1.2).stroke();
  doc
    .fontSize(6.5)
    .font('Helvetica-Bold')
    .fillColor('#166534')
    .text(`FIN HOJA ${sheetIndex + 1}/${totalSheets}: ${sheetName.toUpperCase()}`, MARGIN, y + 4, {
      width: w,
      align: 'center',
      height: 10,
      ellipsis: true,
      lineBreak: false,
    });
}

export function drawMainSheetHeader(
  doc: PdfDoc,
  opts: {
    formatName: string;
    documentCode: string | null;
    sheetName: string;
    sheetIndex: number;
    totalSheets: number;
    workDate: Date;
    operatorName: string;
    compact?: boolean;
    startY?: number;
  }
): number {
  const width = pageWidth(doc);
  const w = width - MARGIN * 2;
  const y0 = opts.startY ?? MARGIN;
  const compact = opts.compact ?? false;
  const logoW = compact ? 56 : 64;
  const logoH = compact ? 22 : 26;
  const pad = compact ? 3 : 4;

  const titleX = MARGIN + logoW + 8;
  const titleW = w * 0.62 - logoW - 12;
  const metaX = MARGIN + w * 0.62 + 6;
  const metaW = w * 0.38 - 12;

  const sistFont = compact ? 5 : 5.5;
  const nameFont = compact ? 6 : 6.5;
  const empresaFont = compact ? 5.5 : 6;
  const sistema = sistemaLabel(opts.documentCode);
  const formatTitle = opts.formatName.toUpperCase();

  doc.fontSize(sistFont).font('Helvetica-Bold');
  const sistH = doc.heightOfString(sistema, { width: titleW, align: 'center' });
  doc.fontSize(nameFont).font('Helvetica-Bold');
  const nameH = doc.heightOfString(formatTitle, { width: titleW, align: 'center' });
  doc.fontSize(empresaFont).font('Helvetica-Bold');
  const empH = doc.heightOfString('COLBEEF S.A.S', { width: titleW, align: 'center' });

  const titleBlockH = pad + sistH + 2 + nameH + 2 + empH + pad;
  const metaLineH = compact ? 7.5 : 8;
  const metaLines = opts.documentCode ? 3 : 1;
  const metaH = pad + metaLines * metaLineH + pad;
  const logoBoxH = logoH + pad * 2;
  const rowH = Math.max(titleBlockH, metaH, logoBoxH);

  doc.rect(MARGIN, y0, w, rowH).strokeColor('#333').lineWidth(0.75).stroke();
  doc.moveTo(MARGIN + logoW + 6, y0).lineTo(MARGIN + logoW + 6, y0 + rowH).strokeColor('#333').stroke();
  doc.moveTo(MARGIN + w * 0.62, y0).lineTo(MARGIN + w * 0.62, y0 + rowH).strokeColor('#333').stroke();

  const logo = resolveLogoPath();
  const logoY = y0 + (rowH - logoH) / 2;
  if (logo) {
    try {
      doc.image(logo, MARGIN + 4, logoY, { height: logoH });
    } catch {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF', MARGIN + 6, logoY + 6);
    }
  } else {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF', MARGIN + 6, logoY + 6);
  }

  let ty = y0 + pad;
  doc.fontSize(sistFont).font('Helvetica-Bold').fillColor('#555').text(sistema, titleX, ty, {
    width: titleW,
    align: 'center',
    lineGap: 0,
    height: sistH + 1,
  });
  ty += sistH + 2;
  doc.fontSize(nameFont).font('Helvetica-Bold').fillColor('#111').text(formatTitle, titleX, ty, {
    width: titleW,
    align: 'center',
    lineGap: 0,
    height: nameH + 1,
  });
  ty += nameH + 2;
  doc.fontSize(empresaFont).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF S.A.S', titleX, ty, {
    width: titleW,
    align: 'center',
    height: empH + 1,
    lineBreak: false,
  });

  doc.fontSize(compact ? 5.5 : 6).font('Helvetica').fillColor('#111');
  let my = y0 + pad;
  doc.text(`Hoja: ${opts.sheetIndex + 1} / ${opts.totalSheets}`, metaX, my, {
    width: metaW,
    height: metaLineH,
    lineBreak: false,
  });
  my += metaLineH;
  if (opts.documentCode) {
    doc.text(`Código: ${opts.documentCode}`, metaX, my, { width: metaW, height: metaLineH, lineBreak: false });
    my += metaLineH;
    doc.text(`Versión: ${VERSION_BY_CODE[opts.documentCode] ?? '2.0.0'}`, metaX, my, {
      width: metaW,
      height: metaLineH,
      lineBreak: false,
    });
  }

  let y = y0 + rowH;
  const colW = w / 3;
  const fechaStr = formatWorkDate(opts.workDate);
  const metaFont = compact ? 5.5 : 6;

  doc.fontSize(metaFont).font('Helvetica-Bold');
  const fechaLabelH = doc.heightOfString('Fecha:', { width: colW - 8 });
  doc.font('Helvetica');
  const fechaValH = doc.heightOfString(fechaStr, { width: colW - 10 });
  doc.font('Helvetica-Bold');
  const opLabelH = doc.heightOfString('Operario:', { width: colW - 8 });
  doc.font('Helvetica');
  const opValH = doc.heightOfString(opts.operatorName, { width: colW - 10 });
  doc.font('Helvetica-Bold');
  const hojaLabelH = doc.heightOfString('Hoja:', { width: colW - 8 });
  doc.font('Helvetica');
  const hojaValH = doc.heightOfString(opts.sheetName, { width: colW - 10 });

  const barH = Math.max(fechaLabelH + fechaValH, opLabelH + opValH, hojaLabelH + hojaValH) + 6;

  doc.fillColor('#e8edf2').rect(MARGIN, y, w, barH).fill();
  doc.strokeColor('#333').lineWidth(0.5).rect(MARGIN, y, w, barH).stroke();

  const barY = y + 3;
  doc.fontSize(metaFont).font('Helvetica-Bold').fillColor('#111').text('Fecha:', MARGIN + 4, barY, {
    width: colW - 8,
    height: fechaLabelH + 1,
  });
  doc.font('Helvetica').text(fechaStr, MARGIN + 4, barY + fechaLabelH, {
    width: colW - 8,
    lineGap: 0,
    height: fechaValH + 1,
  });
  doc.font('Helvetica-Bold').text('Operario:', MARGIN + colW + 4, barY, {
    width: colW - 8,
    height: opLabelH + 1,
  });
  doc.font('Helvetica').text(opts.operatorName, MARGIN + colW + 4, barY + opLabelH, {
    width: colW - 8,
    lineGap: 0,
    height: opValH + 1,
  });
  doc.font('Helvetica-Bold').text('Hoja:', MARGIN + colW * 2 + 4, barY, {
    width: colW - 8,
    height: hojaLabelH + 1,
  });
  doc.font('Helvetica').text(opts.sheetName, MARGIN + colW * 2 + 4, barY + hojaLabelH, {
    width: colW - 8,
    lineGap: 0,
    height: hojaValH + 1,
  });

  y += barH + 4;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + w, y).strokeColor('#999').lineWidth(0.5).stroke();
  return y + 4;
}

export function drawContinuationHeader(
  doc: PdfDoc,
  formatName: string,
  sheetName: string,
  sheetIndex: number,
  totalSheets: number
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const y = MARGIN;
  const h = 14;
  doc.rect(MARGIN, y, w, h).fill('#f3f4f6');
  doc.strokeColor('#ccc').lineWidth(0.4).rect(MARGIN, y, w, h).stroke();
  // Texto corto + height fijo: evita que PDFKit cree páginas fantasma por desborde
  const label = `${sheetName} (${sheetIndex + 1}/${totalSheets}) · cont.`;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#333').text(label, MARGIN + 4, y + 3, {
    width: w - 8,
    height: 9,
    ellipsis: true,
    lineBreak: false,
  });
  return y + h + 4;
}

/** Numera páginas del PDF (requiere bufferPages: true). Llamar antes de doc.end(). */
export function stampPdfPageNumbers(doc: PdfDoc): void {
  const range = doc.bufferedPageRange();
  if (!range.count) return;
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const w = pageWidth(doc);
    const h = pageHeight(doc);
    // Banda inferior, sin solaparse con FIN HOJA (que usa la zona FOOTER_H)
    doc
      .fontSize(6.5)
      .font('Helvetica')
      .fillColor('#666')
      .text(`Pág. ${i + 1} de ${range.count}`, MARGIN, h - 14, {
        width: w - MARGIN * 2,
        align: 'center',
        lineBreak: false,
        height: 10,
      });
  }
}

export function drawSignatures(
  doc: PdfDoc,
  operatorName: string,
  y: number,
  opts?: {
    submittedByName?: string | null;
    collaboratorNames?: string[];
    /** Solo Verificó (sin Elaboró / Entregó) */
    verificoOnly?: boolean;
    verificoName?: string | null;
  }
): number {
  const bottom = contentBottom(doc);
  const sigH = 40;
  if (y + sigH > bottom) {
    y = Math.max(MARGIN, bottom - sigH);
  }

  const fullW = pageWidth(doc) - MARGIN * 2 - 16;

  if (opts?.verificoOnly) {
    const name = opts.verificoName?.trim() || '—';
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#555').text('VERIFICÓ', MARGIN, y, {
      width: fullW,
      lineBreak: false,
    });
    doc.fontSize(8).font('Helvetica').fillColor('#111').text(name, MARGIN, y + 10, {
      width: fullW,
      height: 12,
      ellipsis: true,
      lineBreak: false,
    });
    doc
      .moveTo(MARGIN, y + 24)
      .lineTo(MARGIN + fullW, y + 24)
      .strokeColor('#666')
      .stroke();
    return y + 32;
  }

  const hasCollaborators = (opts?.collaboratorNames?.length ?? 0) > 0;
  const elaboro = hasCollaborators
    ? [operatorName, ...(opts?.collaboratorNames ?? [])].filter((n, i, arr) => arr.indexOf(n) === i).join(', ')
    : operatorName;
  const halfW = (pageWidth(doc) - MARGIN * 2) / 2 - 10;

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#555').text('ELABORÓ', MARGIN, y, {
    width: hasCollaborators ? halfW : fullW,
    lineBreak: false,
  });
  doc.fontSize(8).font('Helvetica').fillColor('#111').text(elaboro, MARGIN, y + 10, {
    width: hasCollaborators ? halfW : fullW,
    height: 12,
    ellipsis: true,
    lineBreak: false,
  });
  doc
    .moveTo(MARGIN, y + 24)
    .lineTo(MARGIN + (hasCollaborators ? halfW : fullW), y + 24)
    .strokeColor('#666')
    .stroke();

  if (hasCollaborators) {
    const entrego = opts?.submittedByName || operatorName;
    const midX = MARGIN + (pageWidth(doc) - MARGIN * 2) / 2 + 8;
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#555').text('ENTREGÓ', midX, y, {
      width: halfW,
      lineBreak: false,
    });
    doc.fontSize(8).font('Helvetica').fillColor('#111').text(entrego, midX, y + 10, {
      width: halfW,
      height: 12,
      ellipsis: true,
      lineBreak: false,
    });
    doc
      .moveTo(midX, y + 24)
      .lineTo(midX + halfW, y + 24)
      .strokeColor('#666')
      .stroke();
  }

  return y + 32;
}

export function drawActivityTrail(
  doc: PdfDoc,
  y: number,
  activities: {
    type: string;
    createdAt: Date;
    notes?: string | null;
    actor?: { fullName: string } | null;
    targetUser?: { fullName: string } | null;
    metadata?: unknown;
  }[]
): number {
  if (!activities.length) return y;

  const bump = (needed: number) => {
    if (y + needed > contentBottom(doc)) {
      doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
      y = MARGIN;
    }
  };

  bump(40);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333').text('Trazabilidad del envío', MARGIN, y);
  y += 12;

  const labels: Record<string, string> = {
    CREATED: 'Inició el formato',
    COLLABORATOR_ADDED: 'Agregó colaborador',
    COLLABORATOR_REMOVED: 'Quitó colaborador',
    SHEET_SAVED: 'Guardó / editó hoja',
    SUBMITTED: 'Entregó a revisión',
    REJECTED: 'Rechazado (devolver para ajustar)',
    APPROVED: 'Aprobado y firmado',
  };

  for (const a of activities) {
    bump(18);
    const when = a.createdAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    const actor = a.actor?.fullName ?? '—';
    const meta = (a.metadata ?? {}) as { sheetName?: string; changedCount?: number };
    let action = labels[a.type] ?? a.type;
    if (a.type === 'SHEET_SAVED') {
      if (meta.sheetName) action += ` «${meta.sheetName}»`;
      if (typeof meta.changedCount === 'number' && meta.changedCount > 0) {
        action += ` (${meta.changedCount} cambio${meta.changedCount === 1 ? '' : 's'})`;
      }
    }
    let line = `${when} · ${action} · ${actor}`;
    if (a.targetUser?.fullName) line += ` → ${a.targetUser.fullName}`;
    if (a.type === 'REJECTED' && a.notes) line += ` · Motivo: ${a.notes}`;
    doc.fontSize(7).font('Helvetica').fillColor('#444').text(line, MARGIN, y, {
      width: pageWidth(doc) - MARGIN * 2,
    });
    y += doc.heightOfString(line, { width: pageWidth(doc) - MARGIN * 2 }) + 3;
  }
  return y + 4;
}

export type SheetPageContext = {
  landscape: boolean;
  formatName: string;
  documentCode: string | null;
  sheetName: string;
  sheetIndex: number;
  totalSheets: number;
  workDate: Date;
  operatorName: string;
  formatCode: string;
  compactHeader?: boolean;
};

export function startSheetPage(
  doc: PdfDoc,
  ctx: SheetPageContext,
  continued = false,
  pageOpts?: { sheetBoundary?: boolean }
): number {
  doc.addPage({
    size: 'A4',
    layout: ctx.landscape ? 'landscape' : 'portrait',
    margin: MARGIN,
  });
  if (continued) {
    return drawContinuationHeader(doc, ctx.formatName, ctx.sheetName, ctx.sheetIndex, ctx.totalSheets);
  }
  let startY = MARGIN;
  if (pageOpts?.sheetBoundary) {
    startY = drawSheetBoundaryStart(doc, ctx.sheetIndex, ctx.totalSheets, ctx.sheetName, MARGIN);
  }
  return drawMainSheetHeader(doc, {
    formatName: ctx.formatName,
    documentCode: ctx.documentCode,
    sheetName: ctx.sheetName,
    sheetIndex: ctx.sheetIndex,
    totalSheets: ctx.totalSheets,
    workDate: ctx.workDate,
    operatorName: ctx.operatorName,
    compact: ctx.compactHeader,
    startY,
  });
}

/** Nueva página sin cabecera larga (p. ej. solo firmas). */
export function startContentPage(doc: PdfDoc, ctx: SheetPageContext): number {
  doc.addPage({
    size: 'A4',
    layout: ctx.landscape ? 'landscape' : 'portrait',
    margin: MARGIN,
  });
  return MARGIN;
}

export function ensurePageSpace(doc: PdfDoc, ctx: SheetPageContext, y: number, needed: number): number {
  const bottom = contentBottom(doc);
  if (y > bottom) {
    return startSheetPage(doc, ctx, true);
  }
  const maxBlock = Math.max(24, bottom - MARGIN - 12);
  const req = Math.min(Math.max(0, needed), maxBlock);
  // Margen de seguridad: no dibujar pegado al pie (PDFKit desborda y crea hojas vacías)
  if (y + req <= bottom - 4) return y;
  return startSheetPage(doc, ctx, true);
}

export function str(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** Vacío para efectos de PDF (incluye el guión legado). */
export function isBlankPdfValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0 || value.every((v) => isBlankPdfValue(v));
  const s = String(value).trim();
  return s === '' || s === '—';
}

/** Línea fina a media altura: cierra un campo texto/número/obs no diligenciado. */
export function drawClosedBlank(
  doc: PdfDoc,
  x: number,
  cellY: number,
  width: number,
  rowH = 10
): void {
  if (cellY > contentBottom(doc) + 2) return;
  const safeW = Math.max(6, width);
  const pad = Math.min(4, safeW * 0.12);
  const midY = cellY + rowH / 2;
  doc
    .strokeColor('#555')
    .lineWidth(0.55)
    .moveTo(x + pad, midY)
    .lineTo(x + safeW - pad, midY)
    .stroke();
  doc.fillColor('#111');
}

/**
 * Dibuja texto de celda; si está vacío, cierra con línea (no aplica a C/NC).
 * Observaciones: pasar `closeIfEmpty: false` para dejar la celda en blanco.
 */
export function drawTextOrClosed(
  doc: PdfDoc,
  value: unknown,
  x: number,
  textY: number,
  opts: {
    width: number;
    rowH?: number;
    cellY?: number;
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
    lineGap?: number;
    font?: 'Helvetica' | 'Helvetica-Bold';
    /** Default true. false = vacío sin línea (p. ej. observaciones). */
    closeIfEmpty?: boolean;
  }
): void {
  const rowH = opts.rowH ?? 10;
  const cellY = opts.cellY ?? Math.max(0, textY - 1);
  if (isBlankPdfValue(value)) {
    if (opts.closeIfEmpty !== false) {
      drawClosedBlank(doc, x, cellY, opts.width, rowH);
    }
    return;
  }
  doc
    .fontSize(opts.fontSize ?? 5.5)
    .font(opts.font ?? 'Helvetica')
    .fillColor('#111')
    .text(String(value), x, textY, {
      width: opts.width,
      height: Math.max(opts.fontSize ?? 5.5, rowH - 1),
      align: opts.align ?? 'left',
      lineGap: opts.lineGap ?? 0,
      ellipsis: true,
    });
}

/** Clave/etiqueta de observación: no se cierra con línea si va vacía. */
export function isObservationPdfField(keyOrLabel: string): boolean {
  return /observ/i.test(keyOrLabel);
}
