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
  const y = pageHeight(doc) - MARGIN - 14;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + w, y).strokeColor('#166534').lineWidth(1.5).stroke();
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#166534')
    .text(`— FIN HOJA ${sheetIndex + 1} DE ${totalSheets}: ${sheetName.toUpperCase()} —`, MARGIN, y + 3, {
      width: w,
      align: 'center',
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
  });
  ty += sistH + 2;
  doc.fontSize(nameFont).font('Helvetica-Bold').fillColor('#111').text(formatTitle, titleX, ty, {
    width: titleW,
    align: 'center',
    lineGap: 0,
  });
  ty += nameH + 2;
  doc.fontSize(empresaFont).font('Helvetica-Bold').fillColor('#1a5f2a').text('COLBEEF S.A.S', titleX, ty, {
    width: titleW,
    align: 'center',
  });

  doc.fontSize(compact ? 5.5 : 6).font('Helvetica').fillColor('#111');
  let my = y0 + pad;
  doc.text(`Hoja: ${opts.sheetIndex + 1} / ${opts.totalSheets}`, metaX, my, { width: metaW });
  my += metaLineH;
  if (opts.documentCode) {
    doc.text(`Código: ${opts.documentCode}`, metaX, my, { width: metaW });
    my += metaLineH;
    doc.text(`Versión: ${VERSION_BY_CODE[opts.documentCode] ?? '2.0.0'}`, metaX, my, { width: metaW });
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
  doc.fontSize(metaFont).font('Helvetica-Bold').fillColor('#111').text('Fecha:', MARGIN + 4, barY, { width: colW - 8 });
  doc.font('Helvetica').text(fechaStr, MARGIN + 4, barY + fechaLabelH, { width: colW - 8, lineGap: 0 });
  doc.font('Helvetica-Bold').text('Operario:', MARGIN + colW + 4, barY, { width: colW - 8 });
  doc.font('Helvetica').text(opts.operatorName, MARGIN + colW + 4, barY + opLabelH, { width: colW - 8, lineGap: 0 });
  doc.font('Helvetica-Bold').text('Hoja:', MARGIN + colW * 2 + 4, barY, { width: colW - 8 });
  doc.font('Helvetica').text(opts.sheetName, MARGIN + colW * 2 + 4, barY + hojaLabelH, { width: colW - 8, lineGap: 0 });

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

export function ensurePageSpace(doc: PdfDoc, ctx: SheetPageContext, y: number, needed: number): number {
  if (y + needed <= contentBottom(doc)) return y;
  return startSheetPage(doc, ctx, true);
}

export function str(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
