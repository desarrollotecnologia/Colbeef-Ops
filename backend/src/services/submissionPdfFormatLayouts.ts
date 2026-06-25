import type { FormatField } from '@prisma/client';
import type PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

type ChecklistItemData = {
  cnc?: string;
  observation?: string;
};

type FieldOptions = {
  items?: { key: string; label: string; section?: string }[];
  columns?: unknown[];
  columns_def?: { key: string; label: string }[];
};

const MARGIN = 28;

function pageWidth(doc: PdfDoc) {
  return doc.page.width;
}

function contentBottom(doc: PdfDoc) {
  return doc.page.height - MARGIN - 36;
}

function str(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function drawSectionBanner(doc: PdfDoc, y: number, title: string, subtitle?: string): number {
  const w = pageWidth(doc) - MARGIN * 2;
  doc.rect(MARGIN, y, w, subtitle ? 22 : 16).fill('#dcfce7');
  doc.fillColor('#111').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), MARGIN + 6, y + 4, { width: w - 12 });
  if (subtitle) {
    doc.fontSize(6.5).font('Helvetica').fillColor('#444').text(subtitle, MARGIN + 6, y + 13, { width: w - 12 });
    return y + 24;
  }
  return y + 18;
}

function drawFieldGrid(
  doc: PdfDoc,
  y: number,
  pairs: { label: string; value: string }[],
  cols = 3
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const colW = w / cols;
  let rowY = y;
  let maxRowH = 0;

  pairs.forEach((pair, i) => {
    const col = i % cols;
    if (col === 0 && i > 0) {
      rowY += maxRowH + 6;
      maxRowH = 0;
    }
    const x = MARGIN + col * colW;
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#555').text(pair.label, x, rowY, { width: colW - 8 });
    const valY = rowY + 9;
    doc.fontSize(8).font('Helvetica').fillColor('#111').text(pair.value, x, valY, { width: colW - 8 });
    const h = 9 + doc.heightOfString(pair.value, { width: colW - 8 });
    maxRowH = Math.max(maxRowH, h);
  });

  return rowY + maxRowH + 8;
}

function drawRepeaterTable(
  doc: PdfDoc,
  y: number,
  columns: { key: string; label: string }[],
  rows: Record<string, unknown>[]
): number {
  const w = pageWidth(doc) - MARGIN * 2;
  const colW = w / columns.length;
  let cy = y;

  doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#333');
  columns.forEach((col, i) => {
    doc.text(col.label, MARGIN + i * colW + 2, cy, { width: colW - 4 });
  });
  cy += 11;
  doc.moveTo(MARGIN, cy).lineTo(MARGIN + w, cy).strokeColor('#999').lineWidth(0.5).stroke();
  cy += 4;

  if (rows.length === 0) {
    doc.fontSize(7).font('Helvetica').fillColor('#666').text('Sin registros', MARGIN, cy);
    return cy + 14;
  }

  rows.forEach((row, ri) => {
    if (cy > contentBottom(doc) - 14) return;
    if (ri % 2 === 1) {
      doc.rect(MARGIN, cy - 1, w, 11).fill('#f9fafb');
      doc.fillColor('#111');
    }
    columns.forEach((col, i) => {
      doc.fontSize(7).font('Helvetica').fillColor('#111').text(str(row[col.key]), MARGIN + i * colW + 2, cy, {
        width: colW - 4,
      });
    });
    cy += 11;
  });

  return cy + 4;
}

function drawChecklistSections(
  doc: PdfDoc,
  y: number,
  field: FormatField,
  value: Record<string, ChecklistItemData>
): number {
  const opts = (field.options ?? {}) as FieldOptions;
  const items = opts.items ?? [];
  const w = pageWidth(doc) - MARGIN * 2;
  const itemW = w - 70;
  let cy = y;

  doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#333');
  doc.text('Aspecto', MARGIN, cy, { width: itemW });
  doc.text('C', MARGIN + itemW + 4, cy, { width: 18, align: 'center' });
  doc.text('NC', MARGIN + itemW + 24, cy, { width: 18, align: 'center' });
  doc.text('NA', MARGIN + itemW + 44, cy, { width: 18, align: 'center' });
  cy += 10;

  let lastSection = '';
  for (const item of items) {
    if (cy > contentBottom(doc) - 12) break;
    const sec = item.section ?? '';
    if (sec && sec !== lastSection) {
      doc.rect(MARGIN, cy, w, 12).fill('#dcfce7');
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#111').text(sec.toUpperCase(), MARGIN + 4, cy + 2, { width: w - 8 });
      cy += 14;
      lastSection = sec;
    }
    const data = value[item.key] ?? {};
    const cnc = data.cnc ?? '';
    doc.fontSize(6.5).font('Helvetica').fillColor('#111').text(item.label, MARGIN + 2, cy, { width: itemW - 4 });
    doc.text(cnc === 'C' ? 'X' : '', MARGIN + itemW + 4, cy, { width: 18, align: 'center' });
    doc.text(cnc === 'NC' ? 'X' : '', MARGIN + itemW + 24, cy, { width: 18, align: 'center' });
    doc.text(cnc === 'NA' ? 'X' : '', MARGIN + itemW + 44, cy, { width: 18, align: 'center' });
    if (data.observation) {
      cy += 9;
      doc.fontSize(6).fillColor('#555').text(`Obs: ${data.observation}`, MARGIN + 8, cy, { width: w - 16 });
      cy += 8;
    } else {
      cy += 9;
    }
  }

  return cy + 4;
}

function decomisoTotals(rows: Record<string, unknown>[]) {
  const keys = ['unidades', 'hematoma_kg', 'absceso_kg', 'fibrosis_kg', 'vacuna_kg', 'parcial_kg', 'total_kg'] as const;
  const parseNum = (v: unknown) => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const totals: Record<string, number> = {};
  for (const key of keys) {
    totals[key] = rows.reduce((acc, row) => acc + parseNum(row[key]), 0);
  }
  const pesoTotal = keys.filter((k) => k !== 'unidades').reduce((acc, k) => acc + totals[k], 0);
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

  y = drawSectionBanner(doc, y, 'Datos del vehículo', 'T° canales < 7 °C · P.C. < 5 °C · Refrig. 0–4 °C · Cong. > -18 °C');
  const headerPairs = headerKeys
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));
  y = drawFieldGrid(doc, y, headerPairs, 3);

  const cargaField = fields.find((f) => f.fieldKey === 'carga_productos');
  if (cargaField) {
    y = drawSectionBanner(doc, y, 'Carga del vehículo', 'Ácido láctico al 2% (± 0,1)');
    const cols = [
      { key: 'alimento', label: 'Alimentos que transporta' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'producto', label: 'Producto' },
    ];
    const rows = Array.isArray(sheetData.carga_productos) ? (sheetData.carga_productos as Record<string, unknown>[]) : [];
    y = drawRepeaterTable(doc, y, cols, rows);
  }

  const checklist = fields.find((f) => f.fieldKey === 'inspeccion_items');
  if (checklist) {
    y = drawSectionBanner(doc, y, 'Inspección de aspectos', 'C · NC · NA');
    y = drawChecklistSections(
      doc,
      y,
      checklist,
      (sheetData.inspeccion_items as Record<string, ChecklistItemData>) ?? {}
    );
  }

  y = drawSectionBanner(doc, y, 'Firmas');
  const respPairs = firmaResp
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));
  const condPairs = firmaCond
    .map((key) => fields.find((f) => f.fieldKey === key))
    .filter(Boolean)
    .map((f) => ({ label: f!.label, value: str(sheetData[f!.fieldKey]) }));

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#444').text('Responsable de la revisión', MARGIN, y);
  y = drawFieldGrid(doc, y + 10, respPairs, 1);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#444').text('Conductor del vehículo', MARGIN, y);
  y = drawFieldGrid(doc, y + 10, condPairs, 1);

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
    y = drawSectionBanner(doc, y, 'Registro de decomisos', 'Totales por causal y peso total');
    const cols = [
      { key: 'nombre_corte', label: 'Nombre del corte' },
      { key: 'unidades', label: 'Unidades' },
      { key: 'hematoma_kg', label: 'Hematoma (kg)' },
      { key: 'absceso_kg', label: 'Absceso (kg)' },
      { key: 'fibrosis_kg', label: 'Fibrosis (kg)' },
      { key: 'vacuna_kg', label: 'Vacuna (kg)' },
      { key: 'parcial_kg', label: 'Parcial (kg)' },
      { key: 'total_kg', label: 'Total (kg)' },
    ];
    const rows = Array.isArray(sheetData.decomisos) ? (sheetData.decomisos as Record<string, unknown>[]) : [];
    y = drawRepeaterTable(doc, y, cols, rows);

    const { totals, pesoTotal } = decomisoTotals(rows);
    const w = pageWidth(doc) - MARGIN * 2;
    doc.rect(MARGIN, y, w, 14).fill('#f3f4f6');
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#111');
    doc.text('Σ Totales', MARGIN + 4, y + 3, { width: 80 });
    let x = MARGIN + 90;
    const tw = (w - 90) / 7;
    const tvals = [
      totals.unidades,
      totals.hematoma_kg,
      totals.absceso_kg,
      totals.fibrosis_kg,
      totals.vacuna_kg,
      totals.parcial_kg,
      totals.total_kg,
    ];
    tvals.forEach((v) => {
      doc.text(v ? String(v) : '—', x, y + 3, { width: tw - 2, align: 'center' });
      x += tw;
    });
    y += 16;
    doc.rect(MARGIN, y, w, 16).fill('#dcfce7');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#111').text(
      `Peso total de decomisos: ${pesoTotal.toFixed(2)} kg`,
      MARGIN,
      y + 4,
      { width: w, align: 'right' }
    );
    y += 20;
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
