import fs from 'fs';
import path from 'path';
import type PDFDocument from 'pdfkit';

export type PdfDoc = InstanceType<typeof PDFDocument>;

export const MARGIN = 28;
export const FOOTER_H = 36;

const CALIDAD_CODES = new Set([
  'SAI-CAL-F015',
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

export function formatWorkDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Bogota',
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
  doc.fillColor('#111').fontSize(compact ? 6.5 : 8).font('Helvetica-Bold').text(title.toUpperCase(), MARGIN + 4, y + 3, {
    width: w - 8,
  });
  if (subtitle) {
    doc.fontSize(compact ? 5.5 : 6.5).font('Helvetica').fillColor('#444').text(subtitle, MARGIN + 4, y + (compact ? 10 : 13), {
      width: w - 8,
    });
    return y + h + 4;
  }
  return y + h + 4;
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
  }
): number {
  const width = pageWidth(doc);
  const w = width - MARGIN * 2;
  let y = MARGIN;
  const logoW = opts.compact ? 70 : 88;
  const rowH = opts.compact ? 44 : 52;

  doc.rect(MARGIN, y, w, rowH).strokeColor('#333').lineWidth(1).stroke();
  doc.moveTo(MARGIN + logoW + 8, y).lineTo(MARGIN + logoW + 8, y + rowH).strokeColor('#333').stroke();
  doc.moveTo(MARGIN + w * 0.62, y).lineTo(MARGIN + w * 0.62, y + rowH).strokeColor('#333').stroke();

  const logo = resolveLogoPath();
  if (logo) {
    try {
      doc.image(logo, MARGIN + 6, y + 6, { width: logoW - 12 });
    } catch {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF', MARGIN + 8, y + 16);
    }
  } else {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF', MARGIN + 8, y + 16);
  }

  const titleX = MARGIN + logoW + 14;
  const titleW = w * 0.62 - logoW - 20;
  doc.fontSize(opts.compact ? 5.5 : 6).font('Helvetica-Bold').fillColor('#555').text(sistemaLabel(opts.documentCode), titleX, y + 8, {
    width: titleW,
    align: 'center',
  });
  doc.fontSize(opts.compact ? 7 : 8).fillColor('#111').text(opts.formatName.toUpperCase(), titleX, y + (opts.compact ? 16 : 18), {
    width: titleW,
    align: 'center',
  });
  doc.fontSize(opts.compact ? 6 : 7).fillColor('#1a5f2a').text('COLBEEF S.A.S', titleX, y + (opts.compact ? 28 : 32), {
    width: titleW,
    align: 'center',
  });

  const metaX = MARGIN + w * 0.62 + 8;
  const metaW = w * 0.38 - 16;
  doc.fontSize(6.5).font('Helvetica').fillColor('#111');
  doc.text(`Hoja: ${opts.sheetIndex + 1} / ${opts.totalSheets}`, metaX, y + 10, { width: metaW });
  if (opts.documentCode) {
    doc.text(`Código: ${opts.documentCode}`, metaX, y + 20, { width: metaW });
    doc.text(`Versión: ${VERSION_BY_CODE[opts.documentCode] ?? '2.0.0'}`, metaX, y + 30, { width: metaW });
  }

  y += rowH;
  const barH = opts.compact ? 18 : 22;
  doc.rect(MARGIN, y, w, barH).fill('#e8edf2');
  doc.rect(MARGIN, y, w, barH).strokeColor('#333').lineWidth(0.5).stroke();

  const colW = w / 3;
  const barY = y + (opts.compact ? 5 : 6);
  doc.fontSize(opts.compact ? 6 : 6.5).font('Helvetica-Bold').fillColor('#111');
  doc.text('Fecha: ', MARGIN + 6, barY, { continued: true, width: colW - 8 });
  doc.font('Helvetica').text(formatWorkDate(opts.workDate), { width: colW - 8 });
  doc.font('Helvetica-Bold').text('Operario: ', MARGIN + colW + 6, barY, { continued: true, width: colW - 8 });
  doc.font('Helvetica').text(opts.operatorName, { width: colW - 8 });
  doc.font('Helvetica-Bold').text('Hoja: ', MARGIN + colW * 2 + 6, barY, { continued: true, width: colW - 8 });
  doc.font('Helvetica').text(opts.sheetName, { width: colW - 8 });

  y += barH + 8;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + w, y).strokeColor('#999').lineWidth(0.5).stroke();
  return y + 8;
}

export function drawContinuationHeader(
  doc: PdfDoc,
  formatName: string,
  sheetName: string,
  sheetIndex: number,
  totalSheets: number
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  let y = MARGIN;
  doc.rect(MARGIN, y, w, 14).fill('#f3f4f6');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#333').text(
    `${formatName} — ${sheetName} (${sheetIndex + 1}/${totalSheets}) · continuación`,
    MARGIN + 4,
    y + 3,
    { width: w - 8 }
  );
  return y + 20;
}

export function drawSignatures(doc: PdfDoc, operatorName: string, y: number): number {
  const bottom = contentBottom(doc);
  if (y > bottom - 40) y = bottom - 40;

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#555').text('ELABORÓ', MARGIN, y);
  doc.fontSize(9).font('Helvetica').fillColor('#111').text(operatorName, MARGIN, y + 10, {
    width: (pageWidth(doc) - MARGIN * 2) / 2 - 10,
  });
  doc.moveTo(MARGIN, y + 24).lineTo(MARGIN + (pageWidth(doc) - MARGIN * 2) / 2 - 16, y + 24).strokeColor('#666').stroke();
  return y + 32;
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

export function startSheetPage(doc: PdfDoc, ctx: SheetPageContext, continued = false): number {
  doc.addPage({
    size: 'A4',
    layout: ctx.landscape ? 'landscape' : 'portrait',
    margin: MARGIN,
  });
  if (continued) {
    return drawContinuationHeader(doc, ctx.formatName, ctx.sheetName, ctx.sheetIndex, ctx.totalSheets);
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
  });
}

export function ensurePageSpace(doc: PdfDoc, ctx: SheetPageContext, y: number, needed: number): number {
  if (y + needed <= contentBottom(doc)) return y;
  return startSheetPage(doc, ctx, true);
}

export function str(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
