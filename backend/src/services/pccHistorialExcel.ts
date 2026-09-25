import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { resolveLogoPath } from './submissionPdfDraw';

const PCC_CODE = 'AC-FR-010';
const PCC_VERSION = '02';
const HEADER_BORDER_COLOR = '1E4A8C';
const TITLE_FILL = '1B6B4A'; // verde institucional para títulos de columna

export type PccExcelRow = {
  fecha: string;
  idProducto: string;
  propietario: string;
  mc1: string;
  mc2: string;
  responsable: string;
  observacion: string;
  accion: string;
  usuario: string;
  externalInsId: string;
};

function thinBorder(color = '000000'): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: `FF${color}` } };
  return { top: side, left: side, bottom: side, right: side };
}

function resolvePccLogoPath(): string | null {
  const fromPdf = resolveLogoPath();
  if (fromPdf) return fromPdf;
  const candidates = [
    path.join(__dirname, '../../../frontend/public/colbeef-logo.png'),
    path.join(__dirname, '../../../frontend/public/colbeef-wordmark.png'),
    path.join(process.cwd(), '../frontend/public/colbeef-logo.png'),
    path.join(process.cwd(), 'frontend/public/colbeef-logo.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Genera el workbook del historial PCC con encabezado AC-FR-010. */
export async function buildPccHistorialWorkbook(
  rows: PccExcelRow[],
  opts: { fechaLabel: string }
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Colbeef-Ops';
  wb.created = new Date();

  const ws = wb.addWorksheet('Historial PCC', {
    views: [{ showGridLines: false }],
  });

  const colCount = 10;
  ws.columns = [
    { key: 'fecha', width: 20 },
    { key: 'idProducto', width: 14 },
    { key: 'propietario', width: 36 },
    { key: 'mc1', width: 14 },
    { key: 'mc2', width: 14 },
    { key: 'responsable', width: 22 },
    { key: 'observacion', width: 32 },
    { key: 'accion', width: 32 },
    { key: 'usuario', width: 26 },
    { key: 'externalInsId', width: 18 },
  ];

  // ── Encabezado institucional (filas 1–3) ──────────────────────────
  // Logo | títulos | código/versión/fecha
  ws.mergeCells('A1:B3');
  ws.mergeCells('C1:G1');
  ws.mergeCells('C2:G2');
  ws.mergeCells('C3:G3');
  ws.mergeCells('H1:J1');
  ws.mergeCells('H2:J2');
  ws.mergeCells('H3:J3');

  const logoCell = ws.getCell('A1');
  logoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  logoCell.value = '';

  const logoPath = resolvePccLogoPath();
  if (logoPath) {
    const imageId = wb.addImage({
      filename: logoPath,
      extension: 'png',
    });
    ws.addImage(imageId, {
      tl: { col: 0.15, row: 0.2 },
      ext: { width: 130, height: 48 },
    });
  } else {
    logoCell.value = 'Colbeef';
    logoCell.font = { bold: true, size: 14, color: { argb: 'FF1B6B4A' } };
  }

  const titleLines = [
    { cell: 'C1', text: 'COLBEEF S.A.S' },
    { cell: 'C2', text: 'PROCESO DE ASEGURAMIENTO DE LA CALIDAD' },
    { cell: 'C3', text: 'FORMATO VERIFICACIÓN DEL PCC' },
  ];
  for (const t of titleLines) {
    const c = ws.getCell(t.cell);
    c.value = t.text;
    c.font = { bold: true, size: 11, color: { argb: 'FF111827' } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }

  const meta = [
    { cell: 'H1', text: `Código: ${PCC_CODE}` },
    { cell: 'H2', text: `Versión: ${PCC_VERSION}` },
    { cell: 'H3', text: `Fecha: ${opts.fechaLabel}` },
  ];
  for (const m of meta) {
    const c = ws.getCell(m.cell);
    c.value = m.text;
    c.font = { bold: true, size: 10 };
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  }

  // Bordes del bloque de encabezado (contorno azul + rejilla interna)
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= colCount; c++) {
      const isTop = r === 1;
      const isBottom = r === 3;
      const isLeft = c === 1;
      const isRight = c === colCount;
      const blue = { style: 'medium' as const, color: { argb: `FF${HEADER_BORDER_COLOR}` } };
      const gray = { style: 'thin' as const, color: { argb: 'FF333333' } };
      ws.getCell(r, c).border = {
        top: isTop ? blue : gray,
        bottom: isBottom ? blue : gray,
        left: isLeft ? blue : gray,
        right: isRight ? blue : gray,
      };
    }
  }

  ws.getRow(1).height = 22;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;

  // ── Fila de títulos de columnas (fila 4) ──────────────────────────
  const headers = [
    'Fecha y hora',
    'ID producto',
    'Propietario',
    'Media canal 1',
    'Media canal 2',
    'Responsable puesto',
    'Observación',
    'Acción correctiva',
    'Verificado por',
    'ID ins. externo',
  ];

  const headerRow = ws.getRow(4);
  headerRow.height = 24;
  headers.forEach((title, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = title;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${TITLE_FILL}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder('145A3A');
  });

  // ── Datos ─────────────────────────────────────────────────────────
  rows.forEach((r, idx) => {
    const row = ws.getRow(5 + idx);
    const values = [
      r.fecha,
      r.idProducto,
      r.propietario,
      r.mc1,
      r.mc2,
      r.responsable,
      r.observacion,
      r.accion,
      r.usuario,
      r.externalInsId,
    ];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = thinBorder('D1D5DB');
      if (idx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' },
        };
      }
    });
  });

  return wb;
}
