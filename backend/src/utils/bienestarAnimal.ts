/** Fórmulas AC-FR-008 para PDF (misma lógica que frontend/src/lib/bienestarAnimal.ts). */

export type SummaryRow = {
  id: string;
  label: string;
  pctLabel: string;
  calificacion: string;
  puntos: number;
};

const ANIMAL = [
  { id: 1, key: 'c1_marks', label: '1. Eficacia aturdimiento 1er disparo', n: 50, thr: 0.96 },
  { id: 2, key: 'c2_marks', label: '2. Intervalo aturdimiento–sangrado', n: 50, thr: 1 },
  { id: 3, key: 'c3_marks', label: '3. Insensibles en riel de sangrado', n: 50, thr: 1 },
  { id: 4, key: 'c4_marks', label: '4. Tiempo de sangría', n: 50, thr: 1 },
  { id: 5, key: 'c5_marks', label: '5. Resbalones/caídas manejo', n: 50, thr: 0.98 },
  { id: 6, key: 'c6_marks', label: '6. Uso de tábanos eléctricos', n: 50, thr: 0.75 },
  { id: 7, key: 'c7_marks', label: '7. Vocalización', n: 50, thr: 0.96 },
  { id: 8, key: 'c8_marks', label: '8. Resbalones/caídas desembarco', n: 100, thr: 0.98 },
] as const;

function parseMarks(raw: unknown, n: number): string[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) arr = p;
    } catch {
      /* ignore */
    }
  }
  return Array.from({ length: n }, (_, i) => String(arr[i] ?? '').trim().toUpperCase());
}

function pct(marks: string[], n: number) {
  return marks.filter((m) => m === 'X').length / n;
}

function fmt(p: number) {
  return `${(p * 100).toFixed(1)}%`;
}

function cumpleSiNo(key: string, value: string): boolean {
  const v = value.trim().toUpperCase();
  if (
    key === 'c9_actos_abuso' ||
    key === 'c10_1' ||
    key === 'c10_desviaciones' ||
    key === 'c12_desviaciones' ||
    key === 'c13_desviaciones' ||
    key === 'c11_aristas'
  ) {
    return v === 'NO';
  }
  return v === 'SI';
}

export function buildBienestarSummary(data: Record<string, unknown>): {
  rows: SummaryRow[];
  totalLabel: string;
} {
  const rows: SummaryRow[] = [];
  for (const c of ANIMAL) {
    const marks = parseMarks(data[c.key], c.n);
    const p = pct(marks, c.n);
    const ok = p + 1e-9 >= c.thr;
    rows.push({
      id: `c${c.id}`,
      label: c.label,
      pctLabel: fmt(p),
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: ok ? 1 : 0,
    });
  }

  const yn = [
    { id: 'c9', label: '9. Actos de abuso', key: 'c9_actos_abuso' },
    { id: 'c10_1', label: '10.1 Aristas/salientes', key: 'c10_1' },
    { id: 'c10_2', label: '10.2 Densidad adecuada', key: 'c10_2' },
    { id: 'c10_3', label: '10.3 Bebederos', key: 'c10_3' },
    { id: 'c10_4', label: '10.4 Sombra', key: 'c10_4' },
    { id: 'c10_5', label: '10.5 Áreas adyacentes', key: 'c10_5' },
    { id: 'c10_6', label: '10.6 Agua limpia', key: 'c10_6' },
  ];
  for (const item of yn) {
    const raw = String(data[item.key] ?? '').trim();
    if (!raw) {
      rows.push({ id: item.id, label: item.label, pctLabel: '—', calificacion: '—', puntos: 0 });
      continue;
    }
    const ok = cumpleSiNo(item.key, raw);
    rows.push({
      id: item.id,
      label: item.label,
      pctLabel: raw.toUpperCase(),
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: ok ? 1 : 0,
    });
  }

  const c11Keys = ['c11_vias', 'c11_acoples', 'c11_antideslizante', 'c11_aristas'];
  if (c11Keys.every((k) => String(data[k] ?? '').trim())) {
    const ok = c11Keys.every((k) => cumpleSiNo(k, String(data[k])));
    rows.push({
      id: 'c11',
      label: '11. Instalaciones de acceso',
      pctLabel: ok ? 'SI' : 'NO',
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: ok ? 1 : 0,
    });
  } else {
    rows.push({ id: 'c11', label: '11. Instalaciones de acceso', pctLabel: '—', calificacion: '—', puntos: 0 });
  }

  for (const item of [
    { id: 'c12', label: '12. Transporte', key: 'c12_desviaciones' },
    { id: 'c13', label: '13. Reposo/alimentación', key: 'c13_desviaciones' },
  ]) {
    const raw = String(data[item.key] ?? '').trim();
    if (!raw) {
      rows.push({ id: item.id, label: item.label, pctLabel: '—', calificacion: '—', puntos: 0 });
      continue;
    }
    const ok = cumpleSiNo(item.key, raw);
    rows.push({
      id: item.id,
      label: item.label,
      pctLabel: raw.toUpperCase(),
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: ok ? 1 : 0,
    });
  }

  const sum = rows.slice(0, 16).reduce((a, r) => a + r.puntos, 0);
  return { rows, totalLabel: fmt(sum / 18) };
}

export function parseMarksForPdf(raw: unknown, n: number): string[] {
  return parseMarks(raw, n);
}
