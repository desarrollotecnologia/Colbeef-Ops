import type { FormatField } from '@prisma/client';
import {
  MARGIN,
  contentBottom,
  drawClosedBlank,
  drawMainSheetHeader,
  drawSectionBanner,
  drawTextOrClosed,
  isBlankPdfValue,
  pageWidth,
  str,
  type PdfDoc,
} from './submissionPdfDraw';
import {
  buildBienestarSummary,
  CORRAL_ITEM_KEYS,
  CORRALES_KEY,
  cumpleSiNo,
  parseCorralRows,
  parseMarksForPdf,
} from '../utils/bienestarAnimal';

type ChecklistItemData = {
  cnc?: string;
  observation?: string;
};

type FieldOptions = {
  items?: { key: string; label: string; section?: string }[];
  columns?: unknown[];
  columns_def?: { key: string; label: string }[];
};

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
  const labelGap = compact ? 7 : 9;

  pairs.forEach((pair, i) => {
    const col = i % cols;
    if (col === 0 && i > 0) {
      rowY += maxRowH + (compact ? 3 : 6);
      maxRowH = 0;
    }
    const x = MARGIN + col * colW;
    doc.fontSize(labelSize).font('Helvetica-Bold').fillColor('#555').text(pair.label, x, rowY, { width: colW - 6 });
    const valY = rowY + labelGap;
    const valueH = isBlankPdfValue(pair.value)
      ? valSize + 2
      : doc.fontSize(valSize).font('Helvetica').heightOfString(pair.value, { width: colW - 6 });
    const cellH = labelGap + valueH;
    if (isBlankPdfValue(pair.value)) {
      drawClosedBlank(doc, x, valY, colW - 6, valSize + 4);
    } else {
      doc.fontSize(valSize).font('Helvetica').fillColor('#111').text(pair.value, x, valY, { width: colW - 6 });
    }
    maxRowH = Math.max(maxRowH, cellH);
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
  const rowH = 12;
  const headerH = 13;
  let cy = y;
  const dataRows = rows.length > 0 ? rows : [{}];

  doc.rect(MARGIN, cy, w, headerH).fill('#d9ead3').strokeColor('#888').lineWidth(0.4).stroke();
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#333');
  doc.text('Alimentos que transporta', MARGIN + 2, cy + 3, { width: labelW - 4, align: 'center' });
  doc.text('Cantidad', MARGIN + labelW + 2, cy + 3, { width: cantW - 4, align: 'center' });
  doc.text('Producto', MARGIN + labelW + cantW + 2, cy + 3, { width: prodW - 4, align: 'center' });
  cy += headerH;

  const bodyH = Math.max(rowH, dataRows.length * rowH);
  doc.rect(MARGIN, cy, labelW, bodyH).fill('#f3f4f6').strokeColor('#888').lineWidth(0.4).stroke();
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#333').text('Alimentos que transporta', MARGIN + 3, cy + bodyH / 2 - 8, {
    width: labelW - 6,
    align: 'center',
  });

  dataRows.forEach((row, ri) => {
    const ry = cy + ri * rowH;
    doc.rect(MARGIN + labelW, ry, cantW, rowH).strokeColor('#888').lineWidth(0.4).stroke();
    doc.rect(MARGIN + labelW + cantW, ry, prodW, rowH).strokeColor('#888').lineWidth(0.4).stroke();
    drawTextOrClosed(doc, row.cantidad, MARGIN + labelW + 2, ry + 2.5, {
      width: cantW - 4,
      rowH,
      cellY: ry,
      fontSize: 7,
    });
    drawTextOrClosed(doc, row.producto, MARGIN + labelW + cantW + 2, ry + 2.5, {
      width: prodW - 4,
      rowH,
      cellY: ry,
      fontSize: 7,
    });
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
  const weights = columns.map((c) => {
    const blob = `${c.key} ${c.label}`.toLowerCase();
    if (/producto|alimento|nombre|observ/.test(blob)) return 2.2;
    if (c.key === '_idx') return 0.4;
    return 1;
  });
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const colWidths = weights.map((wt) => (wt / sum) * w);
  let cy = y;
  const fs = compact ? 5.5 : 6.5;
  const headerH = compact ? 9 : 11;
  const padY = 2;
  const minRowH = compact ? 10 : 12;
  const maxRowH = 64;

  doc.fontSize(fs).font('Helvetica-Bold').fillColor('#333');
  doc.rect(MARGIN, cy, w, headerH).fill('#f3f4f6').strokeColor('#ccc').lineWidth(0.4).stroke();
  let hx = MARGIN;
  columns.forEach((col, i) => {
    doc.text(col.label, hx + 2, cy + 2, { width: colWidths[i] - 4 });
    hx += colWidths[i];
  });
  cy += headerH;

  if (rows.length === 0) {
    doc.fontSize(7).font('Helvetica').fillColor('#666').text('Sin registros', MARGIN, cy + 2);
    return cy + 12;
  }

  rows.forEach((row, ri) => {
    let contentH = fs + 2;
    columns.forEach((col, i) => {
      if (col.key.startsWith('decomiso_')) return;
      if (isBlankPdfValue(row[col.key])) return;
      doc.fontSize(compact ? 6 : 7).font('Helvetica');
      contentH = Math.max(
        contentH,
        Math.max(fs + 2, doc.heightOfString(str(row[col.key]), { width: Math.max(8, colWidths[i] - 4), lineGap: 0 }))
      );
    });
    const rowH = Math.min(maxRowH, Math.max(minRowH, contentH + padY * 2));

    if (cy + rowH > contentBottom(doc)) {
      doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
      cy = MARGIN;
      doc.fontSize(fs).font('Helvetica-Bold').fillColor('#333');
      doc.rect(MARGIN, cy, w, headerH).fill('#f3f4f6').strokeColor('#ccc').lineWidth(0.4).stroke();
      hx = MARGIN;
      columns.forEach((col, i) => {
        doc.text(col.label, hx + 2, cy + 2, { width: colWidths[i] - 4 });
        hx += colWidths[i];
      });
      cy += headerH;
    }

    if (ri % 2 === 1) doc.rect(MARGIN, cy, w, rowH).fill('#f9fafb');
    doc.rect(MARGIN, cy, w, rowH).strokeColor('#ccc').lineWidth(0.4).stroke();
    let cx = MARGIN;
    columns.forEach((col, i) => {
      if (col.key === 'decomiso_parcial') {
        const marked = String(row[col.key] ?? '') === 'Parcial';
        if (marked) {
          doc.fontSize(compact ? 6 : 7).font('Helvetica-Bold').fillColor('#111').text('X', cx + 2, cy + padY, {
            width: colWidths[i] - 4,
            align: 'center',
          });
        } else {
          drawClosedBlank(doc, cx + 2, cy, colWidths[i] - 4, rowH);
        }
      } else if (col.key === 'decomiso_total') {
        const marked = String(row[col.key] ?? '') === 'Total';
        if (marked) {
          doc.fontSize(compact ? 6 : 7).font('Helvetica-Bold').fillColor('#111').text('X', cx + 2, cy + padY, {
            width: colWidths[i] - 4,
            align: 'center',
          });
        } else {
          drawClosedBlank(doc, cx + 2, cy, colWidths[i] - 4, rowH);
        }
      } else {
        drawTextOrClosed(doc, row[col.key], cx + 2, cy + padY, {
          width: colWidths[i] - 4,
          rowH,
          cellY: cy,
          fontSize: compact ? 6 : 7,
          closeIfEmpty: !/observ/i.test(col.key) && !/observ/i.test(col.label),
        });
      }
      cx += colWidths[i];
    });
    cy += rowH;
  });

  return cy + 2;
}

function drawChecklistTwoColumn(
  doc: PdfDoc,
  y: number,
  field: FormatField,
  value: Record<string, ChecklistItemData>,
  larger = false
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const w = pageWidth(doc) - MARGIN * 2;
  const halfW = w / 2 - 4;
  const itemW = halfW - 52;
  let cy = y;
  const headerFs = larger ? 6.5 : 5.5;
  const sectionFs = larger ? 6 : 5;
  const itemFs = larger ? 6 : 5;
  const rowStep = larger ? 8.5 : 7;
  const sectionH = larger ? 11 : 9;

  const drawColumnHeader = (x: number) => {
    doc.fontSize(headerFs).font('Helvetica-Bold').fillColor('#333');
    doc.text('Aspecto', x, cy, { width: itemW });
    doc.text('C', x + itemW + 2, cy, { width: 14, align: 'center' });
    doc.text('NC', x + itemW + 16, cy, { width: 14, align: 'center' });
    doc.text('NA', x + itemW + 30, cy, { width: 14, align: 'center' });
  };

  drawColumnHeader(MARGIN);
  drawColumnHeader(MARGIN + halfW + 8);
  cy += larger ? 10 : 8;

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
        doc.rect(x, ry, halfW, sectionH).fill('#dcfce7');
        doc.fontSize(sectionFs).font('Helvetica-Bold').fillColor('#111').text(row.item.label.toUpperCase(), x + 2, ry + 2.5, {
          width: halfW - 4,
        });
        ry += sectionH + 1;
        continue;
      }
      const data = value[row.item.key] ?? {};
      const cnc = data.cnc ?? '';
      doc.fontSize(itemFs).font('Helvetica').fillColor('#111').text(row.item.label, x + 1, ry, { width: itemW - 2 });
      doc.text(cnc === 'C' ? 'X' : '', x + itemW + 2, ry, { width: 14, align: 'center' });
      doc.text(cnc === 'NC' ? 'X' : '', x + itemW + 16, ry, { width: 14, align: 'center' });
      doc.text(cnc === 'NA' ? 'X' : '', x + itemW + 30, ry, { width: 14, align: 'center' });
      ry += rowStep;
    }
    return ry;
  };

  const yLeft = drawRows(leftRows, MARGIN, cy);
  const yRight = drawRows(rightRows, MARGIN + halfW + 8, cy);
  return Math.max(yLeft, yRight) + 4;
}

const DECOMISO_KG_KEYS = [
  'hematoma_kg',
  'absceso_kg',
  'fibrosis_kg',
  'vacuna_kg',
  'contaminacion_kg',
] as const;

type DecomisoCol = { key: string; label: string; width: number };

function decomisosTableCols(): DecomisoCol[] {
  return [
    { key: '_idx', label: '#', width: 0.04 },
    { key: 'nombre_corte', label: 'Nombre del corte', width: 0.23 },
    { key: 'unidades', label: 'Unid.', width: 0.07 },
    { key: 'hematoma_kg', label: 'Hematoma', width: 0.09 },
    { key: 'absceso_kg', label: 'Absceso', width: 0.09 },
    { key: 'fibrosis_kg', label: 'Fibrosis', width: 0.09 },
    { key: 'vacuna_kg', label: 'Vacuna', width: 0.09 },
    { key: 'contaminacion_kg', label: 'Contaminación', width: 0.12 },
    { key: 'decomiso_parcial', label: 'Parcial', width: 0.09 },
    { key: 'decomiso_total', label: 'Total', width: 0.09 },
  ];
}

function drawDecomisoTipoMark(
  doc: PdfDoc,
  x: number,
  cellY: number,
  width: number,
  rowH: number,
  marked: boolean
): void {
  if (marked) {
    doc.fontSize(6).font('Helvetica-Bold').fillColor('#111').text('X', x, cellY + rowH / 2 - 3.5, {
      width,
      align: 'center',
    });
    return;
  }
  drawClosedBlank(doc, x, cellY, width, rowH);
}

function drawDecomisosTableHeader(doc: PdfDoc, y: number, cols: DecomisoCol[], widths: number[], tableW: number): number {
  const headerH = 20;
  doc.rect(MARGIN, y, tableW, headerH).fill('#d9ead3').strokeColor('#888').lineWidth(0.4).stroke();
  doc.fontSize(5).font('Helvetica-Bold').fillColor('#333');

  let x = MARGIN;
  for (let i = 0; i < 3; i++) {
    doc.text(cols[i].label, x + 1, y + 7, { width: widths[i] - 2, align: 'center' });
    x += widths[i];
  }

  const causalStart = 3;
  const causalEnd = 3 + DECOMISO_KG_KEYS.length;
  const causalW = widths.slice(causalStart, causalEnd).reduce((a, b) => a + b, 0);
  doc.text('CAUSAL DE DECOMISO / KG', x + 1, y + 2, { width: causalW - 2, align: 'center' });
  x += causalW;

  const tipoW = widths[causalEnd] + widths[causalEnd + 1];
  doc.text('TIPO DE DECOMISO', x + 1, y + 2, { width: tipoW - 2, align: 'center' });

  x = MARGIN + widths[0] + widths[1] + widths[2];
  for (let i = causalStart; i < cols.length; i++) {
    doc.text(cols[i].label, x + 1, y + 11, { width: widths[i] - 2, align: 'center' });
    x += widths[i];
  }
  return y + headerH;
}

function drawDecomisosTable(doc: PdfDoc, y: number, rows: Record<string, unknown>[]): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const cols = decomisosTableCols();
  const widths = cols.map((c) => c.width * w);
  let cy = drawDecomisosTableHeader(doc, y, cols, widths, w);

  const dataRows = rows.length > 0 ? rows : [{}];
  dataRows.forEach((row, ri) => {
    let contentH = 7;
    cols.forEach((col, i) => {
      if (col.key === '_idx' || col.key.startsWith('decomiso_')) return;
      if (isBlankPdfValue(row[col.key])) return;
      doc.fontSize(5.5).font('Helvetica');
      contentH = Math.max(
        contentH,
        Math.max(7, doc.heightOfString(str(row[col.key]), { width: Math.max(8, widths[i] - 2), lineGap: 0 }))
      );
    });
    const dynRowH = Math.min(64, Math.max(11, contentH + 4));

    if (cy + dynRowH > contentBottom(doc)) {
      doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
      cy = drawDecomisosTableHeader(doc, MARGIN, cols, widths, w);
    }

    if (ri % 2 === 1) doc.rect(MARGIN, cy, w, dynRowH).fill('#f9fafb');
    doc.rect(MARGIN, cy, w, dynRowH).strokeColor('#888').lineWidth(0.4).stroke();

    const isParcial = String(row.decomiso_parcial ?? '') === 'Parcial';
    const isTotal = String(row.decomiso_total ?? '') === 'Total';

    let cx = MARGIN;
    cols.forEach((col, i) => {
      const cellW = widths[i] - 2;
      if (col.key === '_idx') {
        doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#111').text(String(ri + 1), cx + 1, cy + 2, {
          width: cellW,
          align: 'center',
        });
      } else if (col.key === 'decomiso_parcial') {
        drawDecomisoTipoMark(doc, cx + 1, cy, cellW, dynRowH, isParcial);
      } else if (col.key === 'decomiso_total') {
        drawDecomisoTipoMark(doc, cx + 1, cy, cellW, dynRowH, isTotal);
      } else {
        drawTextOrClosed(doc, row[col.key], cx + 1, cy + 2, {
          width: cellW,
          rowH: dynRowH,
          cellY: cy,
          align: col.key === 'nombre_corte' ? 'left' : 'center',
          fontSize: 5.5,
        });
      }
      cx += widths[i];
    });
    cy += dynRowH;
  });

  return cy + 2;
}

function decomisoTotals(rows: Record<string, unknown>[]) {
  const parseNum = (v: unknown) => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const totals: Record<string, number> = {
    unidades: rows.reduce((acc, row) => acc + parseNum(row.unidades), 0),
  };
  for (const key of DECOMISO_KG_KEYS) {
    totals[key] = rows.reduce((acc, row) => acc + parseNum(row[key]), 0);
  }
  const pesoTotal = DECOMISO_KG_KEYS.reduce((acc, k) => acc + totals[k], 0);
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
  const respRevisionKeys = ['resp_revision_nombre', 'resp_revision_cargo'];

  y = drawSectionBanner(doc, y, 'Datos del vehículo', 'T° canales < 7 °C · P.C. < 5 °C · Refrig. 0–4 °C · Cong. > -18 °C');
  const headerPairs = headerKeys
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));
  y = drawFieldGrid(doc, y, headerPairs, 4);

  const cargaField = fields.find((f) => f.fieldKey === 'carga_productos');
  if (cargaField) {
    y = drawSectionBanner(doc, y, 'Carga del vehículo', 'Ácido láctico al 2% (± 0,1)');
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
        rows
      );
    } else {
      y = drawVehiculosCargaTable(doc, y, rows);
    }
  }

  const checklist = fields.find((f) => f.fieldKey === 'inspeccion_items');
  if (checklist) {
    y = drawSectionBanner(doc, y, 'Inspección de aspectos', 'C · NC · NA');
    y = drawChecklistTwoColumn(
      doc,
      y,
      checklist,
      (sheetData.inspeccion_items as Record<string, ChecklistItemData>) ?? {},
      true
    );
  }

  const respPairs = respRevisionKeys
    .map((key) => {
      const f = fields.find((x) => x.fieldKey === key);
      if (!f) return null;
      return { label: f.label, value: str(sheetData[f.fieldKey]) };
    })
    .filter(Boolean) as { label: string; value: string }[];

  if (respPairs.length > 0) {
    y = drawSectionBanner(doc, y, 'Responsable de la revisión');
    y = drawFieldGrid(doc, y, respPairs, 2);
  }

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
    y = drawSectionBanner(doc, y, 'Registro de decomisos', 'Causal en kg · Parcial / Total · totales automáticos', true);
    const rows = Array.isArray(sheetData.decomisos) ? (sheetData.decomisos as Record<string, unknown>[]) : [];
    y = drawDecomisosTable(doc, y, rows);

    const { totals, pesoTotal } = decomisoTotals(rows);
    const cols = decomisosTableCols();
    const w = pageWidth(doc) - MARGIN * 2;
    const widths = cols.map((c) => c.width * w);
    const totalsH = 14;
    if (y + totalsH > contentBottom(doc)) {
      doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
      y = MARGIN;
    }
    doc.rect(MARGIN, y, w, totalsH).fill('#f3f4f6').strokeColor('#888').lineWidth(0.4).stroke();
    doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#111');

    const labelW = widths[0] + widths[1];
    doc.text('TOTALES', MARGIN + 2, y + 4, { width: labelW - 4, align: 'center' });
    let x = MARGIN + labelW;
    doc.text(String(totals.unidades || '0'), x, y + 4, { width: widths[2] - 2, align: 'center' });
    x += widths[2];
    for (let i = 3; i < 3 + DECOMISO_KG_KEYS.length; i++) {
      const key = cols[i].key;
      doc.text(totals[key] ? String(totals[key]) : '0', x, y + 4, { width: widths[i] - 2, align: 'center' });
      x += widths[i];
    }
    const tipoW = widths[widths.length - 2] + widths[widths.length - 1];
    doc.fontSize(5).text('PESO TOTAL', x + 1, y + 1, { width: tipoW - 2, align: 'center' });
    doc.fontSize(6).text(`${pesoTotal.toFixed(2)} kg`, x + 1, y + 7, { width: tipoW - 2, align: 'center' });
    y += totalsH + 4;
  }

  y = drawSectionBanner(doc, y, 'Añadir fotos / Observaciones');
  const fotosField = fields.find((f) => f.fieldKey === 'fotos');
  const obsFijas = fields.find((f) => f.fieldKey === 'observaciones_fijas');
  const obsAdic = fields.find((f) => f.fieldKey === 'observaciones_adicionales');

  if (fotosField) {
    const raw = sheetData.fotos;
    const photos: string[] = [];
    if (Array.isArray(raw)) {
      photos.push(...raw.filter((v): v is string => typeof v === 'string' && v.startsWith('data:image')));
    } else if (typeof raw === 'string' && raw.startsWith('data:image')) {
      photos.push(raw);
    }

    if (photos.length === 0) {
      doc.fontSize(7).font('Helvetica').fillColor('#666').text('Sin fotos adjuntas', MARGIN, y);
      y += 14;
    } else {
      const maxW = pageWidth(doc) - MARGIN * 2;
      const gap = 8;
      const colW = (maxW - gap) / 2;
      const imgH = 100;
      let col = 0;
      let rowTop = y;

      for (const src of photos.slice(0, 12)) {
        if (col === 0 && rowTop + imgH + 8 > contentBottom(doc)) {
          doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
          rowTop = MARGIN;
          y = MARGIN;
        }
        const x = MARGIN + col * (colW + gap);
        try {
          doc.image(src, x, rowTop, { fit: [colW, imgH], align: 'center', valign: 'center' });
        } catch {
          doc.fontSize(7).fillColor('#666').text('(imagen no disponible)', x, rowTop);
        }
        col += 1;
        if (col >= 2) {
          col = 0;
          rowTop += imgH + gap;
          y = rowTop;
        }
      }
      if (col !== 0) {
        y = rowTop + imgH + gap;
      } else {
        y = rowTop;
      }
      y += 4;
    }
  } else if (obsFijas) {
    doc
      .fontSize(7)
      .font('Helvetica-Bold')
      .fillColor('#333')
      .text(str(obsFijas.defaultValue ?? sheetData.observaciones_fijas), MARGIN, y + 2, {
        width: pageWidth(doc) - MARGIN * 2,
      });
    y += 14;
  }

  if (obsAdic) {
    y = drawSectionBanner(doc, y, 'Observaciones', undefined, true);
    const rawObs = sheetData.observaciones_adicionales;
    if (isBlankPdfValue(rawObs)) {
      y += 10;
    } else {
      const obsText = str(rawObs);
      doc.fontSize(7).font('Helvetica').fillColor('#111').text(obsText, MARGIN, y, {
        width: pageWidth(doc) - MARGIN * 2,
      });
      y += doc.heightOfString(obsText, { width: pageWidth(doc) - MARGIN * 2 }) + 6;
    }
  }

  return y;
}

type PediluvioRow = Record<string, unknown>;

function pediluvioRowFilled(row: PediluvioRow): boolean {
  return ['fecha', 'hora', 'desinfectante', 'concentracion_ppm', 'observaciones'].some(
    (k) => String(row[k] ?? '').trim() !== ''
  );
}

/** LD-FR-004 — tabla de cambios de pediluvios (multi-página, landscape). */
export function renderPediluviosCambiosSheet(
  doc: PdfDoc,
  sheetData: Record<string, unknown>,
  startY: number,
  opts: {
    ensureSpace: (y: number, needed: number) => number;
    fechaInicio: Date;
    fechaCierre?: Date | null;
  }
): number {
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;

  const inicio = formatWorkDateSafe(opts.fechaInicio);
  const cierre = opts.fechaCierre ? formatWorkDateSafe(opts.fechaCierre) : '—';

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#111');
  doc.text(`Fecha inicio: ${inicio}`, MARGIN, y, { width: w / 2 - 4, height: 10, lineBreak: false });
  doc.text(`Fecha cierre: ${cierre}`, MARGIN + w / 2, y, { width: w / 2 - 4, height: 10, lineBreak: false });
  y += 14;

  const cols: { key: string; label: string; width: number }[] = [
    { key: 'fecha', label: 'Fecha', width: 0.12 },
    { key: 'hora', label: 'Hora', width: 0.08 },
    { key: 'desinfectante', label: 'Desinfectante', width: 0.2 },
    { key: 'concentracion_ppm', label: 'Conc. (ppm)', width: 0.1 },
    { key: 'num_pediluvios', label: 'N°', width: 0.06 },
    { key: 'responsable', label: 'Responsable', width: 0.22 },
    { key: 'observaciones', label: 'Observaciones', width: 0.22 },
  ];

  const allRows = Array.isArray(sheetData.registros) ? (sheetData.registros as PediluvioRow[]) : [];
  const rows = allRows.filter(pediluvioRowFilled);
  const dataRows = rows.length > 0 ? rows : [{}];

  const drawHeader = (yy: number) => {
    const headerH = 16;
    doc.rect(MARGIN, yy, w, headerH).fill('#d9ead3');
    doc.strokeColor('#666').lineWidth(0.4).rect(MARGIN, yy, w, headerH).stroke();
    let x = MARGIN;
    for (const col of cols) {
      const cw = w * col.width;
      doc
        .fontSize(6)
        .font('Helvetica-Bold')
        .fillColor('#222')
        .text(col.label, x + 2, yy + 4, { width: cw - 4, height: 10, lineBreak: false, ellipsis: true });
      x += cw;
    }
    return yy + headerH;
  };

  y = opts.ensureSpace(y, 40);
  y = drawHeader(y);

  for (const row of dataRows) {
    const cellTexts = cols.map((col) => {
      if (col.key === 'num_pediluvios') return '2';
      const v = row[col.key];
      if (col.key === 'responsable') {
        return str(v || row.ownerName || '');
      }
      return str(v);
    });

    let rowH = 12;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const h = doc
        .fontSize(6.5)
        .font('Helvetica')
        .heightOfString(cellTexts[i] === '—' ? ' ' : cellTexts[i], { width: cw - 4 });
      rowH = Math.max(rowH, Math.min(36, h + 6));
    }

    const nextY = opts.ensureSpace(y, rowH + 4);
    if (nextY !== y) {
      y = drawHeader(nextY);
    }

    doc.strokeColor('#999').lineWidth(0.3).rect(MARGIN, y, w, rowH).stroke();
    let x = MARGIN;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const text = cellTexts[i];
      if (isBlankPdfValue(text) || text === '—') {
        drawClosedBlank(doc, x + 2, y + 3, cw - 4, rowH - 6);
      } else {
        doc
          .fontSize(6.5)
          .font('Helvetica')
          .fillColor('#111')
          .text(text, x + 2, y + 3, {
            width: cw - 4,
            height: rowH - 5,
            ellipsis: true,
            lineGap: 0,
          });
      }
      x += cw;
    }
    y += rowH;
  }

  return y + 6;
}

function formatWorkDateSafe(date: Date): string {
  try {
    const iso = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
    const [y, m, d] = iso.split('-').map(Number);
    const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return noonUtc.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return String(date);
  }
}

function lacticoRowFilled(row: Record<string, unknown>): boolean {
  return ['fecha', 'hora', 'volumen_naoh', 'cumple', 'no_cumple', 'actividad', 'monitoreo_pcc'].some(
    (k) => String(row[k] ?? '').trim() !== ''
  );
}

/** AC-FR-033 — titulación / monitoreo ácido láctico. */
export function renderLacticoFormatoSheet(
  doc: PdfDoc,
  sheetData: Record<string, unknown>,
  startY: number,
  opts: {
    ensureSpace: (y: number, needed: number) => number;
    variant: 'titulacion' | 'monitoreo';
  }
): number {
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;
  const isMon = opts.variant === 'monitoreo';

  const cols: { key: string; label: string; width: number }[] = isMon
    ? [
        { key: 'fecha', label: 'Fecha', width: 0.1 },
        { key: 'hora', label: 'Hora', width: 0.07 },
        { key: 'volumen_naoh', label: 'Vol. NaOH', width: 0.09 },
        { key: 'concentracion', label: 'Conc.', width: 0.08 },
        { key: 'cumple', label: 'C', width: 0.05 },
        { key: 'no_cumple', label: 'NC', width: 0.05 },
        { key: 'correccion', label: 'Corrección', width: 0.14 },
        { key: 'monitoreo_pcc', label: 'PCC', width: 0.06 },
        { key: 'responsable', label: 'Responsable', width: 0.16 },
        { key: 'verifico', label: 'Verificó', width: 0.2 },
      ]
    : [
        { key: 'fecha', label: 'Fecha', width: 0.1 },
        { key: 'hora', label: 'Hora', width: 0.07 },
        { key: 'volumen_naoh', label: 'Vol. NaOH', width: 0.1 },
        { key: 'concentracion', label: 'Conc.', width: 0.09 },
        { key: 'cumple', label: 'C', width: 0.05 },
        { key: 'no_cumple', label: 'NC', width: 0.05 },
        { key: 'correccion', label: 'Corrección', width: 0.14 },
        { key: 'actividad', label: 'Actividad', width: 0.14 },
        { key: 'responsable', label: 'Responsable', width: 0.26 },
      ];

  const allRows = Array.isArray(sheetData.registros) ? (sheetData.registros as Record<string, unknown>[]) : [];
  const dataRows = allRows.filter(lacticoRowFilled);
  const rows = dataRows.length > 0 ? dataRows : [{}];

  const drawHeader = (yy: number) => {
    const headerH = 14;
    doc.rect(MARGIN, yy, w, headerH).fill('#d9ead3');
    doc.strokeColor('#666').lineWidth(0.4).rect(MARGIN, yy, w, headerH).stroke();
    let x = MARGIN;
    for (const col of cols) {
      const cw = w * col.width;
      doc
        .fontSize(5.5)
        .font('Helvetica-Bold')
        .fillColor('#222')
        .text(col.label, x + 1, yy + 3, { width: cw - 2, height: 9, lineBreak: false, ellipsis: true });
      x += cw;
    }
    return yy + headerH;
  };

  y = opts.ensureSpace(y, 36);
  y = drawHeader(y);

  for (const row of rows) {
    const cellTexts = cols.map((col) => {
      if (col.key === 'cumple') return String(row.cumple ?? '') === 'C' ? 'C' : '';
      if (col.key === 'no_cumple') return String(row.no_cumple ?? '') === 'NC' ? 'NC' : '';
      if (col.key === 'monitoreo_pcc') return String(row.monitoreo_pcc ?? '') === 'X' ? 'X' : '';
      if (col.key === 'verifico') {
        const mark = String(row.verifico_mark ?? '');
        const name = String(row.verifico_nombre ?? row.ownerName ?? '');
        if (mark === 'OK') return name ? `✓ ${name}` : '✓';
        if (mark === 'X') return '✗';
        return '';
      }
      if (col.key === 'responsable') return str(row.responsable || row.ownerName || '');
      return str(row[col.key]);
    });

    let rowH = 11;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const h = doc.fontSize(6).font('Helvetica').heightOfString(cellTexts[i] || ' ', { width: cw - 2 });
      rowH = Math.max(rowH, Math.min(28, h + 5));
    }

    const nextY = opts.ensureSpace(y, rowH + 4);
    if (nextY !== y) y = drawHeader(nextY);

    doc.strokeColor('#999').lineWidth(0.3).rect(MARGIN, y, w, rowH).stroke();
    let x = MARGIN;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const text = cellTexts[i];
      if (!text) {
        drawClosedBlank(doc, x + 1, y + 2, cw - 2, Math.max(6, rowH - 4));
      } else {
        doc
          .fontSize(6)
          .font('Helvetica')
          .fillColor('#111')
          .text(text, x + 1, y + 2, { width: cw - 2, height: rowH - 3, ellipsis: true, lineGap: 0 });
      }
      x += cw;
    }
    y += rowH;
  }

  y = opts.ensureSpace(y + 6, 28);
  doc.fontSize(6.5).font('Helvetica').fillColor('#333');
  const formula =
    'Fórmula: % Ácido láctico = V × N × #eq × 100.  Constantes: N = 0,1 y #eq = 0,09.';
  doc.text(formula, MARGIN, y, { width: w, height: 10, lineBreak: false });
  y += 11;
  if (isMon) {
    doc.text('Rango aceptable de concentración: 1,9% a 2,1%.', MARGIN, y, {
      width: w,
      height: 10,
      lineBreak: false,
    });
    y += 11;
  }
  doc.text('C: Cumple    NC: No cumple', MARGIN, y, { width: w, height: 10, lineBreak: false });
  return y + 8;
}

function visceraRowFilled(row: Record<string, unknown>): boolean {
  return [
    'codigo',
    'c1_fecha',
    'c1_hora_inicio',
    'c1_hora_final',
    'c1_temp',
    'c2_fecha',
    'c2_temp',
    'c3_fecha',
    'c3_temp',
    'observaciones',
  ].some((k) => String(row[k] ?? '').trim() !== '');
}

/** SAI-CAL-F005 — control temperatura vísceras en cava (roja / blanca). */
export function renderViscerasCavaSheet(
  doc: PdfDoc,
  sheetData: Record<string, unknown>,
  startY: number,
  opts: {
    ensureSpace: (y: number, needed: number) => number;
    sheetName: string;
  }
): number {
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;

  y = drawSectionBanner(doc, y, opts.sheetName, 'SAI-CAL-F005 · Controles de temperatura', true);
  y = drawFieldGrid(
    doc,
    y,
    [
      { label: 'Cava de almacenamiento', value: str(sheetData.cava_almacenamiento) },
      { label: 'Cliente / destino', value: str(sheetData.cliente_destino) },
    ],
    2,
    true
  );

  const allRows = Array.isArray(sheetData.registros)
    ? (sheetData.registros as Record<string, unknown>[])
    : [];
  const rows = allRows.filter(visceraRowFilled);
  const dataRows = rows.length > 0 ? rows : [{}];

  const controlW = 0.18;
  const cols: { key: string; label: string; width: number }[] = [
    { key: 'item', label: 'Item', width: 0.05 },
    { key: 'codigo', label: 'Código', width: 0.12 },
    { key: 'c1', label: 'T° Control 1\nFecha · H.ini · H.fin · T°', width: controlW },
    { key: 'c2', label: 'T° Control 2\nFecha · H.ini · H.fin · T°', width: controlW },
    { key: 'c3', label: 'T° Control 3\nFecha · H.ini · H.fin · T°', width: controlW },
    { key: 'observaciones', label: 'Observaciones', width: 0.11 },
    { key: 'responsable', label: 'Responsable', width: 0.18 },
  ];

  const formatControl = (row: Record<string, unknown>, n: 1 | 2 | 3) => {
    const fecha = str(row[`c${n}_fecha`]);
    const hi = str(row[`c${n}_hora_inicio`]);
    const hf = str(row[`c${n}_hora_final`]);
    const temp = str(row[`c${n}_temp`]);
    if ([fecha, hi, hf, temp].every((v) => !v || v === '—')) return '—';
    return `${fecha === '—' ? '' : fecha}  ${hi === '—' ? '' : hi}-${hf === '—' ? '' : hf}  ${temp === '—' ? '' : `${temp}°`}`.trim();
  };

  const drawHeader = (yy: number) => {
    const headerH = 22;
    doc.rect(MARGIN, yy, w, headerH).fill('#d9ead3');
    doc.strokeColor('#666').lineWidth(0.4).rect(MARGIN, yy, w, headerH).stroke();
    let x = MARGIN;
    for (const col of cols) {
      const cw = w * col.width;
      doc
        .fontSize(5.5)
        .font('Helvetica-Bold')
        .fillColor('#222')
        .text(col.label, x + 2, yy + 3, {
          width: cw - 4,
          height: headerH - 4,
          align: 'center',
        });
      x += cw;
    }
    return yy + headerH;
  };

  y = opts.ensureSpace(y, 50);
  y = drawHeader(y);

  dataRows.forEach((row, idx) => {
    const cellTexts = [
      String(idx + 1),
      str(row.codigo),
      formatControl(row, 1),
      formatControl(row, 2),
      formatControl(row, 3),
      str(row.observaciones),
      str(row.ownerName || ''),
    ];

    let rowH = 14;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const h = doc
        .fontSize(6)
        .font('Helvetica')
        .heightOfString(cellTexts[i] === '—' ? ' ' : cellTexts[i], { width: cw - 4 });
      rowH = Math.max(rowH, Math.min(40, h + 6));
    }

    const nextY = opts.ensureSpace(y, rowH + 4);
    if (nextY !== y) {
      y = drawHeader(nextY);
    }

    doc.strokeColor('#999').lineWidth(0.3).rect(MARGIN, y, w, rowH).stroke();
    let x = MARGIN;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const text = cellTexts[i];
      if (isBlankPdfValue(text) || text === '—') {
        drawClosedBlank(doc, x + 2, y + 3, cw - 4, rowH - 6);
      } else {
        doc
          .fontSize(6)
          .font('Helvetica')
          .fillColor('#111')
          .text(text, x + 2, y + 3, {
            width: cw - 4,
            height: rowH - 5,
            ellipsis: true,
            lineGap: 0,
          });
      }
      x += cw;
    }
    y += rowH;
  });

  return y + 6;
}

function canalesRowFilled(row: Record<string, unknown>): boolean {
  return ['codigo', 'temp_c1', 'temp_c2', 'temp_c3', 'temp_c4', 'temp_liberacion', 'ph'].some(
    (k) => String(row[k] ?? '').trim() !== ''
  );
}

/** AC-FR-034 — control temperatura y pH de canales (multi-día, landscape). */
export function renderCanalesTempPhSheet(
  doc: PdfDoc,
  sheetData: Record<string, unknown>,
  startY: number,
  opts: {
    ensureSpace: (y: number, needed: number) => number;
    fechaInicio: Date;
    fechaCierre?: Date | null;
  }
): number {
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;

  const inicio = formatWorkDateSafe(opts.fechaInicio);
  const cierre = opts.fechaCierre ? formatWorkDateSafe(opts.fechaCierre) : '—';
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#111');
  doc.text(`Fecha inicio: ${inicio}`, MARGIN, y, { width: w / 2 - 4, height: 10, lineBreak: false });
  doc.text(`Fecha cierre: ${cierre}`, MARGIN + w / 2, y, { width: w / 2 - 4, height: 10, lineBreak: false });
  y += 14;

  y = drawSectionBanner(doc, y, 'Encabezado', 'Rango cavas 0–4 °C · pH 5,4–5,8 · Despacho T° < 7 °C · Desposte T° < 4 °C', true);
  y = drawFieldGrid(
    doc,
    y,
    [
      { label: 'Cliente', value: str(sheetData.cliente) },
      { label: 'Tiempo almacenamiento (h)', value: str(sheetData.tiempo_almacenamiento_horas) },
    ],
    2,
    true
  );

  for (let n = 1; n <= 4; n++) {
    const pairs = [
      { label: `Ctrl ${n} — Cava`, value: str(sheetData[`c${n}_cava`]) },
      { label: `Ctrl ${n} — T°C cava`, value: str(sheetData[`c${n}_temp_cava`]) },
      { label: `Ctrl ${n} — Fecha`, value: str(sheetData[`c${n}_fecha`]) },
      { label: `Ctrl ${n} — Hora`, value: str(sheetData[`c${n}_hora`]) },
    ];
    y = drawSectionBanner(doc, y, `Control ${n}`, undefined, true);
    y = drawFieldGrid(doc, y, pairs, 4, true);
  }

  y = drawSectionBanner(doc, y, 'Liberación de canales', undefined, true);
  y = drawFieldGrid(
    doc,
    y,
    [
      { label: 'Cava', value: str(sheetData.lib_cava) },
      { label: 'T°C cava', value: str(sheetData.lib_temp_cava) },
      { label: 'Fecha', value: str(sheetData.lib_fecha) },
      { label: 'Hora', value: str(sheetData.lib_hora) },
    ],
    4,
    true
  );

  y = drawSectionBanner(doc, y, 'Registro de canales', 'Temperatura en almacenamiento y liberación', true);

  const cols: { key: string; label: string; width: number }[] = [
    { key: 'item', label: 'N°', width: 0.04 },
    { key: 'codigo', label: 'Código', width: 0.14 },
    { key: 'temp_c1', label: 'Ctrl 1', width: 0.1 },
    { key: 'temp_c2', label: 'Ctrl 2', width: 0.1 },
    { key: 'temp_c3', label: 'Ctrl 3', width: 0.1 },
    { key: 'temp_c4', label: 'Ctrl 4', width: 0.1 },
    { key: 'temp_liberacion', label: 'T° despacho', width: 0.1 },
    { key: 'ph', label: 'pH', width: 0.08 },
  ];

  const allRows = Array.isArray(sheetData.registros) ? (sheetData.registros as Record<string, unknown>[]) : [];
  const rows = allRows.filter(canalesRowFilled);
  const dataRows = rows.length > 0 ? rows : [{}];

  const drawHeader = (yy: number) => {
    const headerH = 16;
    doc.rect(MARGIN, yy, w, headerH).fill('#d9ead3');
    doc.strokeColor('#666').lineWidth(0.4).rect(MARGIN, yy, w, headerH).stroke();
    let x = MARGIN;
    for (const col of cols) {
      const cw = w * col.width;
      doc.fontSize(5.5).font('Helvetica-Bold').fillColor('#222').text(col.label, x + 2, yy + 4, {
        width: cw - 4,
        height: 10,
        lineBreak: false,
        ellipsis: true,
      });
      x += cw;
    }
    return yy + headerH;
  };

  y = opts.ensureSpace(y, 40);
  y = drawHeader(y);

  dataRows.forEach((row, idx) => {
    const cellTexts = [
      String(idx + 1),
      str(row.codigo),
      str(row.temp_c1),
      str(row.temp_c2),
      str(row.temp_c3),
      str(row.temp_c4),
      str(row.temp_liberacion),
      str(row.ph),
    ];

    let rowH = 12;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const h = doc.fontSize(6).font('Helvetica').heightOfString(cellTexts[i] === '—' ? ' ' : cellTexts[i], {
        width: cw - 4,
      });
      rowH = Math.max(rowH, Math.min(36, h + 6));
    }

    const nextY = opts.ensureSpace(y, rowH + 4);
    if (nextY !== y) y = drawHeader(nextY);

    doc.strokeColor('#999').lineWidth(0.3).rect(MARGIN, y, w, rowH).stroke();
    let x = MARGIN;
    for (let i = 0; i < cols.length; i++) {
      const cw = w * cols[i].width;
      const text = cellTexts[i];
      if (isBlankPdfValue(text) || text === '—') {
        drawClosedBlank(doc, x + 2, y + 3, cw - 4, rowH - 6);
      } else {
        doc.fontSize(6).font('Helvetica').fillColor('#111').text(text, x + 2, y + 3, {
          width: cw - 4,
          height: rowH - 5,
          ellipsis: true,
          lineGap: 0,
        });
      }
      x += cw;
    }
    y += rowH;
  });

  const obs = str(sheetData.observaciones_generales);
  if (!isBlankPdfValue(obs) && obs !== '—') {
    y = opts.ensureSpace(y, 30);
    y = drawSectionBanner(doc, y, 'Observaciones', undefined, true);
    doc.fontSize(7).font('Helvetica').fillColor('#111').text(obs, MARGIN, y, { width: w });
    y += doc.heightOfString(obs, { width: w }) + 6;
  }

  return y + 6;
}

const BA_GREEN = '#166534';
const BA_GREEN_LIGHT = '#dcfce7';
const BA_RED = '#b91c1c';
const BA_RED_LIGHT = '#fee2e2';
const BA_AMBER_LIGHT = '#fef3c7';
const BA_AMBER = '#92400e';
const BA_GRAY_LIGHT = '#f3f4f6';

const BA_ANIMAL = [
  {
    key: 'c1_marks',
    obs: 'c1_obs',
    n: 50,
    thr: 0.96,
    title: '1. Eficacia de aturdimiento al primer disparo',
    legend: 'X: aturdido correctamente · E: falla del equipo · P: deficiente puntería',
  },
  {
    key: 'c2_marks',
    obs: 'c2_obs',
    n: 50,
    thr: 1,
    title: '2. Intervalo de tiempo entre el aturdimiento y el corte de grandes vasos',
    legend: 'X: cumple tiempo · F: falla (aturdimiento/tiempo)',
  },
  {
    key: 'c3_marks',
    obs: 'c3_obs',
    n: 50,
    thr: 1,
    title: '3. Animales insensibles en el riel de sangrado',
    legend: 'X: insensible · S: sensible',
  },
  {
    key: 'c4_marks',
    obs: 'c4_obs',
    n: 50,
    thr: 1,
    title: '4. Tiempo de sangría posterior al corte de grandes vasos',
    legend: 'X: cumple tiempo · F: falla',
  },
  {
    key: 'c5_marks',
    obs: 'c5_obs',
    n: 50,
    thr: 0.98,
    title: '5. Resbalones y caídas durante el manejo',
    legend: 'X: sin resbalón/caída · R: resbaló · C: cayó',
  },
  {
    key: 'c6_marks',
    obs: 'c6_obs',
    n: 50,
    thr: 0.75,
    title: '6. Uso de tábanos eléctricos',
    legend: 'X: no se usó tábano · T: se usó tábano',
  },
  {
    key: 'c7_marks',
    obs: 'c7_obs',
    n: 50,
    thr: 0.96,
    title: '7. Vocalización',
    legend: 'X: no vocalizó · V: vocalizó',
  },
  {
    key: 'c8_marks',
    obs: 'c8_obs',
    n: 50,
    thr: 0.98,
    title: '8. Resbalones y caídas durante el desembarco',
    legend: 'X: no resbaló/cayó · R: resbaló · C: cayó',
  },
] as const;

const BA_CORRAL_TEXTS: Record<string, string> = {
  c10_1: 'Pisos, paredes, bebederos y divisiones presentan aristas, salientes o punzantes',
  c10_2: 'Densidad animal adecuada',
  c10_3: 'Bebederos en funcionamiento',
  c10_4: 'Sombra en buen estado',
  c10_5: 'Áreas adyacentes presentan materiales extraños, aristas o salientes punzantes',
  c10_6: 'Se cuenta con acceso a agua limpia',
};

function baPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function baColors(ok: boolean | null) {
  if (ok === null) return { bg: BA_GRAY_LIGHT, fg: '#4b5563', border: '#d1d5db' };
  return ok
    ? { bg: BA_GREEN_LIGHT, fg: BA_GREEN, border: '#86efac' }
    : { bg: BA_RED_LIGHT, fg: BA_RED, border: '#fca5a5' };
}

function drawBaBadge(
  doc: PdfDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  ok: boolean | null,
  fontSize = 6
): void {
  const c = baColors(ok);
  doc.lineWidth(0.5).roundedRect(x, y, w, h, 2).fillAndStroke(c.bg, c.border);
  doc
    .fontSize(fontSize)
    .font('Helvetica-Bold')
    .fillColor(c.fg)
    .text(text, x + 1, y + (h - fontSize) / 2 + 0.5, {
      width: w - 2,
      height: fontSize + 2,
      align: 'center',
      lineBreak: false,
      ellipsis: true,
    });
}

/** Barra de título de un criterio con insignia de resultado a la derecha. */
function drawBaCriterionBar(
  doc: PdfDoc,
  y: number,
  title: string,
  subtitle: string | undefined,
  resultText: string,
  ok: boolean | null
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const h = subtitle ? 22 : 16;
  const badgeW = 104;
  doc.rect(MARGIN, y, w, h).fill('#f0fdf4');
  doc.rect(MARGIN, y, 3, h).fill(BA_GREEN);
  doc.lineWidth(0.4).strokeColor('#bbf7d0').rect(MARGIN, y, w, h).stroke();
  const textW = w - badgeW - 16;
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#111')
    .text(title, MARGIN + 8, y + 4, { width: textW, height: 9, lineBreak: false, ellipsis: true });
  if (subtitle) {
    doc
      .fontSize(5.8)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text(subtitle, MARGIN + 8, y + 13, { width: textW, height: 8, lineBreak: false, ellipsis: true });
  }
  drawBaBadge(doc, MARGIN + w - badgeW - 4, y + 3, badgeW, h - 6, resultText, ok, 6.5);
  return y + h + 4;
}

/** Cuadrícula de 25 casillas por fila, como en el formato impreso. */
function drawBaMarksGrid(doc: PdfDoc, y: number, marks: string[]): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const perRow = 25;
  const cw = w / perRow;
  const ch = 15;
  marks.forEach((m, i) => {
    const x = MARGIN + (i % perRow) * cw;
    const cy = y + Math.floor(i / perRow) * ch;
    const fill = m === 'X' ? BA_GREEN_LIGHT : m ? BA_AMBER_LIGHT : '#ffffff';
    doc.rect(x, cy, cw, ch).fill(fill);
    doc.lineWidth(0.3).strokeColor('#9ca3af').rect(x, cy, cw, ch).stroke();
    doc
      .fontSize(3.8)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(String(i + 1), x + 1.2, cy + 1.2, { width: cw - 2, height: 5, lineBreak: false });
    if (m) {
      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(m === 'X' ? BA_GREEN : BA_AMBER)
        .text(m, x, cy + 5.5, { width: cw, height: 8, align: 'center', lineBreak: false });
    }
  });
  return y + Math.ceil(marks.length / perRow) * ch + 3;
}

function drawBaObs(
  doc: PdfDoc,
  y: number,
  value: unknown,
  ensureSpace: (y: number, needed: number) => number
): number {
  const obs = str(value);
  if (isBlankPdfValue(obs)) return y;
  const w = pageWidth(doc) - MARGIN * 2;
  const text = `Observaciones: ${obs}`;
  const h = doc.fontSize(6.5).font('Helvetica').heightOfString(text, { width: w - 8 }) + 6;
  y = ensureSpace(y, h + 2);
  doc.rect(MARGIN, y, w, h).fill('#fafafa');
  doc.lineWidth(0.3).strokeColor('#e5e7eb').rect(MARGIN, y, w, h).stroke();
  doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#374151').text('Observaciones: ', MARGIN + 4, y + 3, {
    width: w - 8,
    continued: true,
  });
  doc.font('Helvetica').fillColor('#111').text(obs);
  return y + h + 3;
}

/** Fila pregunta · respuesta SI/NO · resultado. */
function drawBaQuestionRow(
  doc: PdfDoc,
  y: number,
  question: string,
  answer: string,
  ok: boolean | null,
  ensureSpace: (y: number, needed: number) => number
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const ansW = 44;
  const resW = 104;
  const qW = w - ansW - resW - 12;
  const textH = doc.fontSize(6.5).font('Helvetica').heightOfString(question, { width: qW - 6 });
  const h = Math.max(16, textH + 7);
  y = ensureSpace(y, h + 2);
  doc.lineWidth(0.3).strokeColor('#d1d5db').rect(MARGIN, y, w, h).stroke();
  doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(question, MARGIN + 4, y + (h - textH) / 2, {
    width: qW - 6,
  });
  const bh = 11;
  drawBaBadge(doc, MARGIN + qW, y + (h - bh) / 2, ansW, bh, answer || '—', null, 6.5);
  drawBaBadge(
    doc,
    MARGIN + qW + ansW + 8,
    y + (h - bh) / 2,
    resW,
    bh,
    ok === null ? 'SIN DILIGENCIAR' : ok ? 'CUMPLE' : 'NO CUMPLE',
    ok,
    6.5
  );
  return y + h;
}

function baSiNo(sheetData: Record<string, unknown>, key: string): { answer: string; ok: boolean | null } {
  const raw = String(sheetData[key] ?? '').trim().toUpperCase();
  if (!raw) return { answer: '', ok: null };
  return { answer: raw, ok: cumpleSiNo(key, raw) };
}

function drawBaNote(doc: PdfDoc, y: number, text: string): number {
  const w = pageWidth(doc) - MARGIN * 2;
  doc.fontSize(5.8).font('Helvetica-Oblique').fillColor('#4b5563').text(text, MARGIN + 2, y + 1, { width: w - 4 });
  return y + doc.heightOfString(text, { width: w - 4 }) + 4;
}

/** AC-FR-008 — hoja Formato (inspección bienestar animal). */
export function renderBienestarAnimalSheet(
  doc: PdfDoc,
  sheetData: Record<string, unknown>,
  startY: number,
  opts: {
    ensureSpace: (y: number, needed: number) => number;
    fechaInicio: Date;
    fechaCierre?: Date | null;
  }
): number {
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;
  const ensure = opts.ensureSpace;
  const inicio = formatWorkDateSafe(opts.fechaInicio);
  const cierre = opts.fechaCierre ? formatWorkDateSafe(opts.fechaCierre) : '—';
  const summary = buildBienestarSummary(sheetData);

  // Franja superior: fechas + puntaje total
  const stripH = 26;
  doc.rect(MARGIN, y, w, stripH).fill(BA_GRAY_LIGHT);
  doc.lineWidth(0.4).strokeColor('#d1d5db').rect(MARGIN, y, w, stripH).stroke();
  const scoreW = 130;
  const halfW = (w - scoreW) / 2;
  const infoCell = (label: string, value: string, x: number) => {
    doc.fontSize(5.8).font('Helvetica-Bold').fillColor('#6b7280').text(label, x + 6, y + 4, {
      width: halfW - 10,
      lineBreak: false,
    });
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#111').text(value, x + 6, y + 13, {
      width: halfW - 10,
      height: 10,
      lineBreak: false,
      ellipsis: true,
    });
  };
  infoCell('FECHA INICIO', inicio, MARGIN);
  infoCell('FECHA CIERRE', cierre, MARGIN + halfW);
  doc.rect(MARGIN + w - scoreW, y, scoreW, stripH).fill(BA_GREEN);
  doc.fontSize(5.8).font('Helvetica-Bold').fillColor('#bbf7d0').text('PUNTAJE TOTAL OBTENIDO', MARGIN + w - scoreW, y + 4, {
    width: scoreW,
    align: 'center',
    lineBreak: false,
  });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text(summary.totalLabel, MARGIN + w - scoreW, y + 12, {
    width: scoreW,
    align: 'center',
    lineBreak: false,
  });
  y += stripH + 6;

  y = drawSectionBanner(doc, y, 'Encabezado', 'AC-FR-008 Inspección de Bienestar Animal', true);
  y = drawFieldGrid(
    doc,
    y,
    [
      { label: 'Inspector(es)', value: str(sheetData.inspectores) },
      { label: 'Método de aturdimiento', value: str(sheetData.metodo_aturdimiento) },
      { label: 'Auxiliar de línea responsable del insensibilizado', value: str(sheetData.auxiliar_insensibilizado) },
      { label: 'Auxiliar de corrales responsable de enmangado', value: str(sheetData.auxiliar_enmangado) },
    ],
    2,
    true
  );

  // Criterios 1–8
  y = ensure(y, 90);
  y = drawSectionBanner(
    doc,
    y,
    'Criterios evaluados por animal',
    '% de cumplimiento = CONTAR.SI("X") / muestra · verde: cumple (X) · ámbar: falla',
    true
  );
  for (const a of BA_ANIMAL) {
    const marks = parseMarksForPdf(sheetData[a.key], a.n);
    const xCount = marks.filter((m) => m === 'X').length;
    const filled = marks.filter((m) => m).length;
    const p = a.n ? xCount / a.n : 0;
    const ok = filled === 0 ? null : p + 1e-9 >= a.thr;
    y = ensure(y, 22 + Math.ceil(a.n / 25) * 15 + 22);
    y = drawBaCriterionBar(
      doc,
      y,
      a.title,
      a.legend,
      ok === null ? 'SIN DILIGENCIAR' : `${baPct(p)} · ${ok ? 'APROBADO' : 'DESAPROBADO'}`,
      ok
    );
    y = drawBaMarksGrid(doc, y, marks);
    doc
      .fontSize(6)
      .font('Helvetica')
      .fillColor('#374151')
      .text(
        `Animales marcados: ${filled}/${a.n}  ·  Cumplen (X): ${xCount}  ·  Fallas: ${filled - xCount}  ·  ` +
          `% cumplimiento = ${xCount} / ${a.n} = ${baPct(p)}  ·  Mínimo para aprobar: ${Math.round(a.thr * 100)}%`,
        MARGIN + 2,
        y,
        { width: w - 4, height: 8, lineBreak: false, ellipsis: true }
      );
    y += 10;
    y = drawBaObs(doc, y, sheetData[a.obs], ensure);
    y += 5;
  }

  // Criterio 9
  y = ensure(y, 60);
  y = drawSectionBanner(doc, y, 'Criterios de verificación', 'Respuesta SI/NO y resultado según el formato', true);
  const c9 = baSiNo(sheetData, 'c9_actos_abuso');
  y = drawBaCriterionBar(doc, y, '9. Actos de abuso', 'Tolerancia cero para actos de abuso voluntarios', c9.ok === null ? 'SIN DILIGENCIAR' : c9.ok ? 'APROBADO' : 'DESAPROBADO', c9.ok);
  y = drawBaQuestionRow(doc, y, '¿Se presentaron actos de abuso?', c9.answer, c9.ok, ensure);
  y = drawBaObs(doc, y + 3, sheetData.c9_obs, ensure);
  y += 6;

  // Criterio 10
  const c10 = baSiNo(sheetData, 'c10_desviaciones');
  y = ensure(y, 90);
  y = drawBaCriterionBar(
    doc,
    y,
    '10. Estado de corrales',
    'C: Cumple · NC: No cumple · Tolerancia cero desviaciones',
    c10.ok === null ? 'SIN DILIGENCIAR' : c10.ok ? 'APROBADO' : 'DESAPROBADO',
    c10.ok
  );
  for (const k of CORRAL_ITEM_KEYS) {
    const num = k.replace('c', '').replace('_', '.');
    doc.fontSize(5.8).font('Helvetica-Bold').fillColor('#111').text(`${num} `, MARGIN + 4, y, { continued: true });
    doc.font('Helvetica').fillColor('#374151').text(BA_CORRAL_TEXTS[k], { width: w - 8 });
    y = doc.y + 1;
  }
  y += 3;

  const corralRows = parseCorralRows(sheetData[CORRALES_KEY]);
  if (corralRows.length > 0) {
    const cRowH = 13;
    const cWidths = [0.05, 0.12, 0.075, 0.075, 0.075, 0.075, 0.075, 0.075, 0.38];
    const header = ['N°', 'Corrales', '10.1', '10.2', '10.3', '10.4', '10.5', '10.6', 'Observaciones'];
    const drawCorralHeader = () => {
      let cx = MARGIN;
      doc.rect(MARGIN, y, w, cRowH).fill(BA_GREEN);
      header.forEach((text, i) => {
        const cw = w * cWidths[i];
        doc.lineWidth(0.3).strokeColor('#14532d').rect(cx, y, cw, cRowH).stroke();
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#ffffff').text(text, cx + 2, y + 3.5, {
          width: cw - 4,
          height: 8,
          align: 'center',
          lineBreak: false,
        });
        cx += cw;
      });
      y += cRowH;
    };
    y = ensure(y, cRowH * 3);
    drawCorralHeader();
    corralRows.forEach((r, idx) => {
      const nextY = ensure(y, cRowH + 2);
      if (nextY !== y) {
        y = nextY;
        drawCorralHeader();
      }
      let cx = MARGIN;
      const cells = [String(idx + 1), r.corral || '—', ...CORRAL_ITEM_KEYS.map((k) => r[k] || ''), r.obs || ''];
      cells.forEach((text, i) => {
        const cw = w * cWidths[i];
        const isMark = i >= 2 && i <= 7;
        if (isMark && text) doc.rect(cx, y, cw, cRowH).fill(text === 'C' ? BA_GREEN_LIGHT : BA_RED_LIGHT);
        else if (idx % 2 === 1) doc.rect(cx, y, cw, cRowH).fill('#f9fafb');
        doc.lineWidth(0.3).strokeColor('#9ca3af').rect(cx, y, cw, cRowH).stroke();
        doc
          .fontSize(isMark ? 6.5 : 6)
          .font(isMark || i === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isMark ? (text === 'C' ? BA_GREEN : BA_RED) : '#111')
          .text(text || (isMark ? '—' : ''), cx + 2, y + 3.5, {
            width: cw - 4,
            height: 8,
            align: i === 8 ? 'left' : 'center',
            lineBreak: false,
            ellipsis: true,
          });
        cx += cw;
      });
      y += cRowH;
    });
    y += 4;
  }
  y = drawBaQuestionRow(doc, y, '¿Se presentaron desviaciones?', c10.answer, c10.ok, ensure);
  y = drawBaNote(doc, y + 2, 'Nota: Durante las inspecciones del mes se debe cubrir la revisión total de los corrales, más el corral de observación.');
  y = drawBaObs(doc, y, sheetData.c10_obs, ensure);
  y += 6;

  // Criterio 11
  const c11Items = [
    { key: 'c11_vias', q: 'Las vías o carreteras de acceso se evidencian en buen estado, sin baches o desniveles' },
    { key: 'c11_acoples', q: 'Los desembarcaderos cuentan con acoples que garantizan la correcta posición de los vehículos' },
    { key: 'c11_antideslizante', q: 'Los desembarcaderos cuentan con piso antideslizante' },
    { key: 'c11_aristas', q: 'Los pisos y barandas presentan aristas, salientes o punzantes' },
  ];
  const c11Res = c11Items.map((it) => baSiNo(sheetData, it.key));
  const c11Ok = c11Res.every((r) => r.ok !== null) ? c11Res.every((r) => r.ok) : null;
  y = ensure(y, 90);
  y = drawBaCriterionBar(
    doc,
    y,
    '11. Estado de instalaciones de acceso a corrales',
    'Pisos, barandas y rutas de ingreso · Tolerancia cero',
    c11Ok === null ? 'SIN DILIGENCIAR' : c11Ok ? 'APROBADO' : 'DESAPROBADO',
    c11Ok
  );
  c11Items.forEach((it, i) => {
    y = drawBaQuestionRow(doc, y, it.q, c11Res[i].answer, c11Res[i].ok, ensure);
  });
  y = drawBaObs(doc, y + 3, sheetData.c11_obs, ensure);
  y += 6;

  // Criterios 12 y 13
  const c12 = baSiNo(sheetData, 'c12_desviaciones');
  y = ensure(y, 60);
  y = drawBaCriterionBar(
    doc,
    y,
    '12. Bienestar animal asociado al transporte',
    'Tolerancia cero: animales caídos o muertos en la inspección de portería',
    c12.ok === null ? 'SIN DILIGENCIAR' : c12.ok ? 'APROBADO' : 'DESAPROBADO',
    c12.ok
  );
  y = drawBaQuestionRow(doc, y, '¿Se presentaron desviaciones de Bienestar Animal por transporte?', c12.answer, c12.ok, ensure);
  y = drawBaObs(doc, y + 3, sheetData.c12_obs, ensure);
  y += 6;

  const c13 = baSiNo(sheetData, 'c13_desviaciones');
  y = ensure(y, 60);
  y = drawBaCriterionBar(
    doc,
    y,
    '13. Cumplimiento en tiempos de reposo y alimentación',
    'Tolerancia cero respecto a tiempos de reposo y alimentación',
    c13.ok === null ? 'SIN DILIGENCIAR' : c13.ok ? 'APROBADO' : 'DESAPROBADO',
    c13.ok
  );
  y = drawBaQuestionRow(
    doc,
    y,
    '¿Se presentaron desviaciones de Bienestar Animal por tiempos de reposo y alimentación?',
    c13.answer,
    c13.ok,
    ensure
  );
  y = drawBaObs(doc, y + 3, sheetData.c13_obs, ensure);
  y += 8;

  const obsAdicionales = str(sheetData.observaciones_adicionales);
  if (!isBlankPdfValue(obsAdicionales)) {
    y = ensure(y, 30);
    y = drawSectionBanner(doc, y, 'Observaciones adicionales', undefined, true);
    doc.fontSize(7).font('Helvetica').fillColor('#111').text(obsAdicionales, MARGIN, y, { width: w });
    y += doc.heightOfString(obsAdicionales, { width: w }) + 8;
  }

  // Resumen: criterios auditados
  const rowH = 12;
  const cols = [
    { label: 'N°', width: 0.07, align: 'center' as const },
    { label: 'Criterio auditado', width: 0.5, align: 'left' as const },
    { label: '% obtenido', width: 0.14, align: 'center' as const },
    { label: 'Calificación', width: 0.17, align: 'center' as const },
    { label: 'Puntaje', width: 0.12, align: 'center' as const },
  ];
  const drawSummaryHeader = () => {
    let x = MARGIN;
    doc.rect(MARGIN, y, w, rowH + 2).fill(BA_GREEN);
    for (const c of cols) {
      const cw = w * c.width;
      doc.lineWidth(0.3).strokeColor('#14532d').rect(x, y, cw, rowH + 2).stroke();
      doc.fontSize(6.3).font('Helvetica-Bold').fillColor('#ffffff').text(c.label, x + 3, y + 4, {
        width: cw - 6,
        height: 8,
        align: c.align,
        lineBreak: false,
      });
      x += cw;
    }
    y += rowH + 2;
  };
  y = ensure(y, 30 + (summary.rows.length + 1) * rowH + 40);
  y = drawSectionBanner(doc, y, 'Criterios auditados', 'Resumen de calificación del formato', true);
  drawSummaryHeader();

  summary.rows.forEach((r, idx) => {
    const nextY = ensure(y, rowH + 2);
    if (nextY !== y) {
      y = nextY;
      drawSummaryHeader();
    }
    const ok = r.calificacion === 'CUMPLE' ? true : r.calificacion === 'NO CUMPLE' ? false : null;
    const num = r.id.replace('c', '').replace('_', '.');
    const counts = idx < 16;
    const cells = [num, r.label, r.pctLabel, r.calificacion, counts ? String(r.puntos) : `${r.puntos}*`];
    let x = MARGIN;
    if (idx % 2 === 1) doc.rect(MARGIN, y, w, rowH).fill('#f9fafb');
    cells.forEach((text, i) => {
      const cw = w * cols[i].width;
      if (i === 3 && ok !== null) doc.rect(x, y, cw, rowH).fill(baColors(ok).bg);
      doc.lineWidth(0.3).strokeColor('#d1d5db').rect(x, y, cw, rowH).stroke();
      doc
        .fontSize(6)
        .font(i === 3 || i === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(i === 3 ? baColors(ok).fg : '#111')
        .text(text, x + 3, y + 3.5, {
          width: cw - 6,
          height: 8,
          align: cols[i].align,
          lineBreak: false,
          ellipsis: true,
        });
      x += cw;
    });
    y += rowH;
  });

  const sumPts = summary.rows.slice(0, 16).reduce((a, r) => a + r.puntos, 0);
  y = ensure(y, 30);
  const totalH = 18;
  doc.rect(MARGIN, y, w, totalH).fill(BA_GREEN_LIGHT);
  doc.lineWidth(0.6).strokeColor(BA_GREEN).rect(MARGIN, y, w, totalH).stroke();
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor(BA_GREEN)
    .text(`PUNTAJE TOTAL OBTENIDO  (${sumPts} / 18)`, MARGIN + 8, y + 5.5, {
      width: w * 0.7,
      lineBreak: false,
    });
  doc.fontSize(10).text(summary.totalLabel, MARGIN + w * 0.7, y + 4, {
    width: w * 0.3 - 8,
    align: 'right',
    lineBreak: false,
  });
  y += totalH + 3;
  y = drawBaNote(
    doc,
    y,
    '* Puntaje total = suma de los criterios 1 a 11 / 18 (fórmula del formato AC-FR-008). Los criterios 12 y 13 se califican pero no suman al puntaje.'
  );

  return y + 4;
}

/** AC-FR-008 — hoja Consolidado mes. */
export function renderBienestarConsolidadoSheet(
  doc: PdfDoc,
  sheetData: Record<string, unknown>,
  startY: number,
  opts: { ensureSpace: (y: number, needed: number) => number }
): number {
  let y = startY;
  const w = pageWidth(doc) - MARGIN * 2;
  y = drawSectionBanner(doc, y, 'Consolidado mes', str(sheetData.mes_en_curso) || undefined, true);

  const rows = [
    'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9',
    'c10_1', 'c10_2', 'c10_3', 'c10_4', 'c10_5', 'c10_6', 'c11', 'c12', 'c13',
  ];
  const labels: Record<string, string> = {
    c1: '1. Aturdimiento',
    c2: '2. Intervalo',
    c3: '3. Insensibles',
    c4: '4. Sangría',
    c5: '5. Resbalones manejo',
    c6: '6. Tábanos',
    c7: '7. Vocalización',
    c8: '8. Desembarco',
    c9: '9. Abuso',
    c10_1: '10.1 Aristas',
    c10_2: '10.2 Densidad',
    c10_3: '10.3 Bebederos',
    c10_4: '10.4 Sombra',
    c10_5: '10.5 Adyacentes',
    c10_6: '10.6 Agua',
    c11: '11. Acceso',
    c12: '12. Transporte',
    c13: '13. Reposo',
  };
  const weeks = ['s1', 's2', 's3', 's4', 'acum'] as const;
  const weekLabels = ['S1', 'S2', 'S3', 'S4', 'Acum'];
  const widths = [0.28, 0.144, 0.144, 0.144, 0.144, 0.144];
  const rowH = 11;

  let x = MARGIN;
  doc.fontSize(6).font('Helvetica-Bold');
  ['Criterio', ...weekLabels].forEach((label, i) => {
    const cw = w * widths[i];
    doc.rect(x, y, cw, rowH).stroke('#666');
    doc.text(label, x + 2, y + 2, { width: cw - 4, height: rowH - 3, lineBreak: false });
    x += cw;
  });
  y += rowH;

  for (const key of rows) {
    y = opts.ensureSpace(y, rowH + 2);
    x = MARGIN;
    const cells = [
      labels[key] || key,
      ...weeks.map((wk) => str(sheetData[`${key}_${wk}`])),
    ];
    doc.fontSize(5.5).font('Helvetica');
    cells.forEach((text, i) => {
      const cw = w * widths[i];
      doc.rect(x, y, cw, rowH).stroke('#999');
      doc.fillColor('#111').text(text || '—', x + 2, y + 2, {
        width: cw - 4,
        height: rowH - 3,
        ellipsis: true,
        lineBreak: false,
      });
      x += cw;
    });
    y += rowH;
  }

  y = opts.ensureSpace(y, 20);
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .text(`TOTAL CUMPLIMIENTO: ${str(sheetData.total_cumplimiento_mes) || '—'}`, MARGIN, y, { width: w });
  y += 14;
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
