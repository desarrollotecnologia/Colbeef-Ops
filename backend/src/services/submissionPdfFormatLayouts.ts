import type { FormatField } from '@prisma/client';
import {
  MARGIN,
  contentBottom,
  drawMainSheetHeader,
  drawSectionBanner,
  pageWidth,
  str,
  type PdfDoc,
} from './submissionPdfDraw';

type ChecklistItemData = {
  cnc?: string;
  observation?: string;
};

type FieldOptions = {
  items?: { key: string; label: string; section?: string }[];
  columns?: unknown[];
  columns_def?: { key: string; label: string }[];
};

function markCell(value: unknown, expected: string): string {
  return String(value ?? '') === expected ? 'X' : '';
}

function drawFieldGrid(
  doc: PdfDoc,
  y: number,
  pairs: { label: string; value: string }[],
  cols = 3,
  compact = false
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const colW = w / cols;
  let rowY = y;
  let maxRowH = 0;
  const labelSize = compact ? 5.5 : 6.5;
  const valSize = compact ? 7 : 8;

  pairs.forEach((pair, i) => {
    const col = i % cols;
    if (col === 0 && i > 0) {
      rowY += maxRowH + (compact ? 3 : 6);
      maxRowH = 0;
    }
    const x = MARGIN + col * colW;
    doc.fontSize(labelSize).font('Helvetica-Bold').fillColor('#555').text(pair.label, x, rowY, { width: colW - 6 });
    const valY = rowY + (compact ? 7 : 9);
    doc.fontSize(valSize).font('Helvetica').fillColor('#111').text(pair.value, x, valY, { width: colW - 6 });
    const h = (compact ? 7 : 9) + doc.heightOfString(pair.value, { width: colW - 6 });
    maxRowH = Math.max(maxRowH, h);
  });

  return rowY + maxRowH + (compact ? 4 : 8);
}

function drawVehiculosCargaTable(
  doc: PdfDoc,
  y: number,
  rows: Record<string, unknown>[]
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const labelW = w * 0.28;
  const cantW = w * 0.22;
  const prodW = w * 0.5;
  const rowH = 10;
  const headerH = 11;
  let cy = y;
  const dataRows = rows.length > 0 ? rows : [{}];

  doc.rect(MARGIN, cy, w, headerH).fill('#d9ead3').strokeColor('#888').lineWidth(0.4).stroke();
  doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
  doc.text('Alimentos que transporta', MARGIN + 2, cy + 2, { width: labelW - 4, align: 'center' });
  doc.text('Cantidad', MARGIN + labelW + 2, cy + 2, { width: cantW - 4, align: 'center' });
  doc.text('Producto', MARGIN + labelW + cantW + 2, cy + 2, { width: prodW - 4, align: 'center' });
  cy += headerH;

  const bodyH = Math.max(rowH, dataRows.length * rowH);
  doc.rect(MARGIN, cy, labelW, bodyH).fill('#f3f4f6').strokeColor('#888').lineWidth(0.4).stroke();
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#333').text('Alimentos que transporta', MARGIN + 3, cy + bodyH / 2 - 8, {
    width: labelW - 6,
    align: 'center',
  });

  dataRows.forEach((row, ri) => {
    const ry = cy + ri * rowH;
    doc.rect(MARGIN + labelW, ry, cantW, rowH).strokeColor('#888').lineWidth(0.4).stroke();
    doc.rect(MARGIN + labelW + cantW, ry, prodW, rowH).strokeColor('#888').lineWidth(0.4).stroke();
    doc.fontSize(6).font('Helvetica').fillColor('#111');
    doc.text(str(row.cantidad), MARGIN + labelW + 2, ry + 2, { width: cantW - 4 });
    doc.text(str(row.producto), MARGIN + labelW + cantW + 2, ry + 2, { width: prodW - 4 });
  });

  return cy + bodyH + 6;
}

function drawRepeaterTable(
  doc: PdfDoc,
  y: number,
  columns: { key: string; label: string }[],
  rows: Record<string, unknown>[],
  compact = false
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const colW = w / columns.length;
  let cy = y;
  const fs = compact ? 5.5 : 6.5;
  const rowH = compact ? 9 : 11;

  doc.fontSize(fs).font('Helvetica-Bold').fillColor('#333');
  doc.rect(MARGIN, cy, w, rowH).fill('#f3f4f6').strokeColor('#ccc').lineWidth(0.4).stroke();
  columns.forEach((col, i) => {
    doc.text(col.label, MARGIN + i * colW + 2, cy + 2, { width: colW - 4 });
  });
  cy += rowH;

  if (rows.length === 0) {
    doc.fontSize(7).font('Helvetica').fillColor('#666').text('Sin registros', MARGIN, cy + 2);
    return cy + 12;
  }

  rows.forEach((row, ri) => {
    if (cy > contentBottom(doc) - rowH) return;
    if (ri % 2 === 1) doc.rect(MARGIN, cy, w, rowH).fill('#f9fafb');
    doc.rect(MARGIN, cy, w, rowH).strokeColor('#ccc').lineWidth(0.4).stroke();
    columns.forEach((col, i) => {
      let cell = str(row[col.key]);
      if (col.key === 'decomiso_parcial') cell = markCell(row[col.key], 'Parcial') || '—';
      if (col.key === 'decomiso_total') cell = markCell(row[col.key], 'Total') || '—';
      doc.fontSize(compact ? 6 : 7).font('Helvetica').fillColor('#111').text(cell, MARGIN + i * colW + 2, cy + 1, {
        width: colW - 4,
        align: col.key.startsWith('decomiso_') ? 'center' : 'left',
      });
    });
    cy += rowH;
  });

  return cy + 2;
}

function drawChecklistTwoColumn(
  doc: PdfDoc,
  y: number,
  field: FormatField,
  value: Record<string, ChecklistItemData>
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const w = pageWidth(doc) - MARGIN * 2;
  const halfW = w / 2 - 4;
  const itemW = halfW - 52;
  let cy = y;

  const drawColumnHeader = (x: number) => {
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#333');
    doc.text('Aspecto', x, cy, { width: itemW });
    doc.text('C', x + itemW + 2, cy, { width: 14, align: 'center' });
    doc.text('NC', x + itemW + 16, cy, { width: 14, align: 'center' });
    doc.text('NA', x + itemW + 30, cy, { width: 14, align: 'center' });
  };

  drawColumnHeader(MARGIN);
  drawColumnHeader(MARGIN + halfW + 8);
  cy += 8;

  type Row = { item: (typeof items)[0]; section: string };
  const rows: Row[] = [];
  let lastSec = '';
  for (const item of items) {
    const sec = item.section ?? '';
    if (sec && sec !== lastSec) {
      rows.push({ item: { key: `__sec_${sec}`, label: sec, section: sec }, section: sec });
      lastSec = sec;
    }
    rows.push({ item, section: sec });
  }

  const mid = Math.ceil(rows.length / 2);
  const leftRows = rows.slice(0, mid);
  const rightRows = rows.slice(mid);

  const drawRows = (list: Row[], x: number, startY: number): number => {
    let ry = startY;
    for (const row of list) {
      if (ry > contentBottom(doc) - 8) break;
      if (row.item.key.startsWith('__sec_')) {
        doc.rect(x, ry, halfW, 9).fill('#dcfce7');
        doc.fontSize(5).font('Helvetica-Bold').fillColor('#111').text(row.item.label.toUpperCase(), x + 2, ry + 2, {
          width: halfW - 4,
        });
        ry += 10;
        continue;
      }
      const data = value[row.item.key] ?? {};
      const cnc = data.cnc ?? '';
      doc.fontSize(5).font('Helvetica').fillColor('#111').text(row.item.label, x + 1, ry, { width: itemW - 2 });
      doc.text(cnc === 'C' ? 'X' : '', x + itemW + 2, ry, { width: 14, align: 'center' });
      doc.text(cnc === 'NC' ? 'X' : '', x + itemW + 16, ry, { width: 14, align: 'center' });
      doc.text(cnc === 'NA' ? 'X' : '', x + itemW + 30, ry, { width: 14, align: 'center' });
      ry += 7;
    }
    return ry;
  };

  const yLeft = drawRows(leftRows, MARGIN, cy);
  const yRight = drawRows(rightRows, MARGIN + halfW + 8, cy);
  return Math.max(yLeft, yRight) + 4;
}

function decomisoTotals(rows: Record<string, unknown>[]) {
  const kgKeys = ['hematoma_kg', 'absceso_kg', 'fibrosis_kg', 'vacuna_kg'] as const;
  const parseNum = (v: unknown) => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const totals: Record<string, number> = {
    unidades: rows.reduce((acc, row) => acc + parseNum(row.unidades), 0),
    parcial: rows.filter((row) => String(row.decomiso_parcial ?? '') === 'Parcial').length,
    total: rows.filter((row) => String(row.decomiso_total ?? '') === 'Total').length,
  };
  for (const key of kgKeys) {
    totals[key] = rows.reduce((acc, row) => acc + parseNum(row[key]), 0);
  }
  const pesoTotal = kgKeys.reduce((acc, k) => acc + totals[k], 0);
  return { totals, pesoTotal };
}

export function renderVehiculosSheet(
  doc: PdfDoc,
  fields: FormatField[],
  sheetData: Record<string, unknown>,
  startY: number
): number {
  let y = startY;
  const headerKeys = [
    'hora', 'placa', 'conductor', 'documento', 'destino',
    'temp_vehiculo', 'temp_producto', 'desinfeccion_vehiculo',
  ];
  const firmaResp = ['resp_revision_nombre', 'resp_revision_cargo', 'resp_revision_firma'];
  const firmaCond = ['conductor_firma_nombre', 'conductor_firma_doc', 'conductor_firma'];

  y = drawSectionBanner(doc, y, 'Datos del vehículo', 'T° canales < 7 °C · P.C. < 5 °C · Refrig. 0–4 °C · Cong. > -18 °C', true);
  const headerPairs = headerKeys
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));
  y = drawFieldGrid(doc, y, headerPairs, 4, true);

  const cargaField = fields.find((f) => f.fieldKey === 'carga_productos');
  if (cargaField) {
    y = drawSectionBanner(doc, y, 'Carga del vehículo', 'Ácido láctico al 2% (± 0,1)', true);
    const rows = Array.isArray(sheetData.carga_productos)
      ? (sheetData.carga_productos as Record<string, unknown>[])
      : [];
    const opts = (cargaField.options ?? {}) as { columns?: { key: string }[] };
    const hasAlimento =
      Array.isArray(opts.columns) && opts.columns.some((c) => typeof c === 'object' && c?.key === 'alimento');

    if (hasAlimento) {
      y = drawRepeaterTable(
        doc,
        y,
        [
          { key: 'alimento', label: 'Alimentos' },
          { key: 'cantidad', label: 'Cantidad' },
          { key: 'producto', label: 'Producto' },
        ],
        rows,
        true
      );
    } else {
      y = drawVehiculosCargaTable(doc, y, rows);
    }
  }

  const checklist = fields.find((f) => f.fieldKey === 'inspeccion_items');
  if (checklist) {
    y = drawSectionBanner(doc, y, 'Inspección de aspectos', 'C · NC · NA', true);
    y = drawChecklistTwoColumn(
      doc,
      y,
      checklist,
      (sheetData.inspeccion_items as Record<string, ChecklistItemData>) ?? {}
    );
  }

  y = drawSectionBanner(doc, y, 'Firmas', undefined, true);
  const respPairs = firmaResp
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));
  const condPairs = firmaCond
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));

  doc.fontSize(6).font('Helvetica-Bold').fillColor('#444').text('Responsable revisión', MARGIN, y);
  y = drawFieldGrid(doc, y + 8, respPairs, 3, true);
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#444').text('Conductor', MARGIN, y);
  y = drawFieldGrid(doc, y + 8, condPairs, 3, true);

  return y;
}

export function renderDecomisosSheet(
  doc: PdfDoc,
  fields: FormatField[],
  sheetData: Record<string, unknown>,
  startY: number
): number {
  let y = startY;
  const headerKeys = ['cliente', 'lote', 'especie', 'temp_inicio_proceso'];

  y = drawSectionBanner(doc, y, 'Datos del proceso');
  const headerPairs = headerKeys
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));
  y = drawFieldGrid(doc, y, headerPairs, 4);

  const decomisosField = fields.find((f) => f.fieldKey === 'decomisos');
  if (decomisosField) {
    y = drawSectionBanner(doc, y, 'Registro de decomisos', 'Marque parcial o total · totales en kg');
    const cols = [
      { key: 'nombre_corte', label: 'Corte' },
      { key: 'unidades', label: 'Unid.' },
      { key: 'hematoma_kg', label: 'Hematoma' },
      { key: 'absceso_kg', label: 'Absceso' },
      { key: 'fibrosis_kg', label: 'Fibrosis' },
      { key: 'vacuna_kg', label: 'Vacuna' },
      { key: 'decomiso_parcial', label: 'Parcial' },
      { key: 'decomiso_total', label: 'Total' },
    ];
    const rows = Array.isArray(sheetData.decomisos) ? (sheetData.decomisos as Record<string, unknown>[]) : [];
    y = drawRepeaterTable(doc, y, cols, rows);

    const { totals, pesoTotal } = decomisoTotals(rows);
    const w = pageWidth(doc) - MARGIN * 2;
    doc.rect(MARGIN, y, w, 12).fill('#f3f4f6').strokeColor('#ccc').stroke();
    doc.fontSize(6).font('Helvetica-Bold').fillColor('#111');
    doc.text('Σ', MARGIN + 4, y + 2, { width: 20 });
    doc.text(String(totals.unidades || '—'), MARGIN + 70, y + 2, { width: 40, align: 'center' });
    let x = MARGIN + 110;
    const tw = (w - 110) / 6;
    [totals.hematoma_kg, totals.absceso_kg, totals.fibrosis_kg, totals.vacuna_kg, totals.parcial, totals.total].forEach((v) => {
      doc.text(v ? String(v) : '—', x, y + 2, { width: tw - 2, align: 'center' });
      x += tw;
    });
    y += 14;
    doc.rect(MARGIN, y, w, 14).fill('#dcfce7').strokeColor('#ccc').stroke();
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#111').text(
      `Peso total de decomisos: ${pesoTotal.toFixed(2)} kg`,
      MARGIN,
      y + 3,
      { width: w, align: 'right' }
    );
    y += 18;
  }

  y = drawSectionBanner(doc, y, 'Observaciones');
  const obsFijas = fields.find((f) => f.fieldKey === 'observaciones_fijas');
  const obsAdic = fields.find((f) => f.fieldKey === 'observaciones_adicionales');
  if (obsFijas) {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333').text(str(obsFijas.defaultValue ?? sheetData.observaciones_fijas), MARGIN, y + 2, {
      width: pageWidth(doc) - MARGIN * 2,
    });
    y += 14;
  }
  if (obsAdic) {
    doc.fontSize(7).font('Helvetica').fillColor('#111').text(str(sheetData.observaciones_adicionales), MARGIN, y, {
      width: pageWidth(doc) - MARGIN * 2,
    });
    y += doc.heightOfString(str(sheetData.observaciones_adicionales), { width: pageWidth(doc) - MARGIN * 2 }) + 6;
  }

  return y;
}

export function drawCompactSheetHeader(
  doc: PdfDoc,
  submission: { format: { name: string; documentCode: string | null }; workDate: Date; operator: { fullName: string } },
  sheetName: string,
  sheetIndex = 0,
  totalSheets = 1
): number {
  return drawMainSheetHeader(doc, {
    formatName: submission.format.name,
    documentCode: submission.format.documentCode,
    sheetName,
    sheetIndex,
    totalSheets,
    workDate: submission.workDate,
    operatorName: submission.operator.fullName,
    compact: true,
  });
}
