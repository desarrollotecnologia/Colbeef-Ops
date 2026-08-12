import {
  MARGIN,
  contentBottom,
  pageWidth,
  type PdfDoc,
  type SheetPageContext,
  ensurePageSpace,
  startSheetPage,
} from './submissionPdfDraw';

// Shared PDF table helpers: dynamic row height, weighted columns, page-break + header redraw.

export type PdfTableColumn = {
  key: string;
  label: string;
  /** Peso relativo de ancho (default 1). */
  weight?: number;
  align?: 'left' | 'center' | 'right';
  /** Si true, no envuelve mucho (marca C/NC). */
  compact?: boolean;
};

export function measureTextHeight(
  doc: PdfDoc,
  text: string,
  width: number,
  fontSize = 5.5,
  font: 'Helvetica' | 'Helvetica-Bold' = 'Helvetica'
): number {
  if (!text || text === '—') return fontSize + 2;
  doc.fontSize(fontSize).font(font);
  return Math.max(fontSize + 2, doc.heightOfString(text, { width: Math.max(8, width), lineGap: 0 }));
}

export function allocateColWidths(tableW: number, columns: PdfTableColumn[]): number[] {
  if (columns.length === 0) return [];
  const compactCount = columns.filter((c) => c.compact || c.key === '_idx').length;
  const weights = columns.map((c) => {
    if (c.weight != null) return Math.max(0.25, c.weight);
    if (c.key === '_idx' || c.compact) return 0.45;
    const blob = `${c.key} ${c.label}`.toLowerCase();
    if (/producto|nombre|observ|descrip|corte|equipo|superficie|aspecto|punto/.test(blob)) return 2.4;
    if (/fecha|lote|hora|temp|unidad|principio|concentra|correcc/.test(blob)) return 1.15;
    return 1;
  });
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * tableW);
  // Con muchas columnas C/NC, bajar mínimos de texto para no aplastar marcas
  const minText = compactCount >= 10 ? 24 : 36;
  const minCompact = compactCount >= 10 ? 12 : 14;
  const adjusted = raw.map((w, i) => {
    if (columns[i].compact || columns[i].key === '_idx') return Math.max(minCompact, w);
    return Math.max(minText, w);
  });
  const adjSum = adjusted.reduce((a, b) => a + b, 0);
  const scale = tableW / adjSum;
  return adjusted.map((w) => w * scale);
}

export function drawRowBackground(
  doc: PdfDoc,
  y: number,
  h: number,
  fill?: string,
  x = MARGIN,
  w = pageWidth(doc) - MARGIN * 2
) {
  if (fill) {
    doc.fillColor(fill).rect(x, y, w, h).fill();
  }
  doc.strokeColor('#ccc').lineWidth(0.4).rect(x, y, w, h).stroke();
  doc.fillColor('#111');
}

/**
 * Dibuja filas de tabla con altura dinámica y re-dibuja cabecera al cambiar de página.
 */
export function drawFlexibleDataRows(params: {
  doc: PdfDoc;
  ctx: SheetPageContext;
  y: number;
  columns: PdfTableColumn[];
  colWidths: number[];
  rows: string[][]; // cells[row][col]
  drawHeader: (doc: PdfDoc, y: number) => number; // returns new y after header
  fontSize?: number;
  minRowH?: number;
  maxRowH?: number;
  padY?: number;
}): number {
  const {
    doc,
    ctx,
    columns,
    colWidths,
    rows,
    drawHeader,
    fontSize = 5.5,
    minRowH = 11,
    maxRowH = 72,
    padY = 3,
  } = params;
  let y = params.y;
  const tableW = colWidths.reduce((a, b) => a + b, 0);

  for (let ri = 0; ri < rows.length; ri++) {
    const cells = rows[ri];
    let contentH = 0;
    for (let ci = 0; ci < columns.length; ci++) {
      const h = measureTextHeight(doc, cells[ci] ?? '—', colWidths[ci] - 4, fontSize);
      contentH = Math.max(contentH, h);
    }
    const rowH = Math.min(maxRowH, Math.max(minRowH, contentH + padY * 2));

    if (y + rowH > contentBottom(doc)) {
      y = ensurePageSpace(doc, ctx, y, rowH + 8);
      y = drawHeader(doc, y);
    }

    drawRowBackground(doc, y, rowH, ri % 2 === 1 ? '#f9fafb' : undefined, MARGIN, tableW);

    let x = MARGIN;
    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci];
      const text = cells[ci] ?? '—';
      const align = col.align ?? (col.compact || col.key === '_idx' ? 'center' : 'left');
      doc.fontSize(fontSize).font(col.key === '_idx' ? 'Helvetica-Bold' : 'Helvetica').fillColor('#111');
      doc.text(text, x + 2, y + padY, {
        width: colWidths[ci] - 4,
        align,
        lineGap: 0,
        height: rowH - padY,
        ellipsis: false,
      });
      x += colWidths[ci];
    }
    y += rowH;
  }

  return y;
}

/** Asegura espacio; si salta de página, vuelve a pintar cabecera de tabla. */
export function ensureTablePageSpace(
  doc: PdfDoc,
  ctx: SheetPageContext,
  y: number,
  needed: number,
  redrawHeader: (doc: PdfDoc, y: number) => number
): number {
  if (y + needed <= contentBottom(doc)) return y;
  const nextY = startSheetPage(doc, ctx, true);
  return redrawHeader(doc, nextY);
}
