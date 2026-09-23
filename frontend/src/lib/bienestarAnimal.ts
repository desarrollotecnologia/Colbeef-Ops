/** Fórmulas AC-FR-008 — Inspección de Bienestar Animal (replican el Excel). */

export type AnimalCriterionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const ANIMAL_CRITERIA: {
  id: AnimalCriterionId;
  title: string;
  marksKey: string;
  obsKey: string;
  sampleSize: number;
  threshold: number; // 0-1
  marks: string[];
  legend: string;
  note: string;
}[] = [
  {
    id: 1,
    title: '1. Eficacia de aturdimiento al primer disparo',
    marksKey: 'c1_marks',
    obsKey: 'c1_obs',
    sampleSize: 50,
    threshold: 0.96,
    marks: ['', 'X', 'E', 'P'],
    legend: 'X: correcto · E: falla equipo · P: deficiente puntería',
    note: 'Aprobado con ≥ 96%. Inspeccionar 50 animales.',
  },
  {
    id: 2,
    title: '2. Intervalo aturdimiento y corte de grandes vasos (≤ 1,5 min)',
    marksKey: 'c2_marks',
    obsKey: 'c2_obs',
    sampleSize: 50,
    threshold: 1,
    marks: ['', 'X', 'F'],
    legend: 'X: cumple tiempo · F: falla (aturdimiento/tiempo)',
    note: 'Aprobado con 100%. Inspeccionar 50 animales.',
  },
  {
    id: 3,
    title: '3. Animales insensibles en el riel de sangría',
    marksKey: 'c3_marks',
    obsKey: 'c3_obs',
    sampleSize: 50,
    threshold: 1,
    marks: ['', 'X', 'S'],
    legend: 'X: insensible · S: sensible',
    note: 'Aprobado con 100%. Inspeccionar 50 animales.',
  },
  {
    id: 4,
    title: '4. Tiempo de sangría posterior al corte (≥ 2 min)',
    marksKey: 'c4_marks',
    obsKey: 'c4_obs',
    sampleSize: 50,
    threshold: 1,
    marks: ['', 'X', 'F'],
    legend: 'X: cumple tiempo · F: falla',
    note: 'Aprobado con 100%. Inspeccionar 50 animales.',
  },
  {
    id: 5,
    title: '5. Resbalones y caídas durante el manejo',
    marksKey: 'c5_marks',
    obsKey: 'c5_obs',
    sampleSize: 50,
    threshold: 0.98,
    marks: ['', 'X', 'R', 'C'],
    legend: 'X: sin resbalón/caída · R: resbaló · C: cayó',
    note: 'Aprobado con ≥ 98%. 50 animales (50% corrales / 50% manga-box).',
  },
  {
    id: 6,
    title: '6. Uso de tábanos eléctricos',
    marksKey: 'c6_marks',
    obsKey: 'c6_obs',
    sampleSize: 50,
    threshold: 0.75,
    marks: ['', 'X', 'T'],
    legend: 'X: no se usó tábano · T: se usó tábano',
    note: 'Aprobado con ≥ 75%. Inspeccionar 50 animales.',
  },
  {
    id: 7,
    title: '7. Vocalización',
    marksKey: 'c7_marks',
    obsKey: 'c7_obs',
    sampleSize: 50,
    threshold: 0.96,
    marks: ['', 'X', 'V'],
    legend: 'X: no vocalizó (cumple) · V: vocalizó',
    note: 'Aprobado con ≥ 96%. Inspeccionar 50 animales.',
  },
  {
    id: 8,
    title: '8. Resbalones y caídas durante el desembarco',
    marksKey: 'c8_marks',
    obsKey: 'c8_obs',
    sampleSize: 100,
    threshold: 0.98,
    marks: ['', 'X', 'R', 'C'],
    legend: 'X: no resbaló/cayó · R: resbaló · C: cayó',
    note: 'Aprobado con ≥ 98%. Inspeccionar 100 animales.',
  },
];

export function parseMarks(raw: unknown, sampleSize: number): string[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  }
  const out = Array.from({ length: sampleSize }, (_, i) => String(arr[i] ?? '').trim().toUpperCase());
  return out;
}

/** Excel: COUNTIF(...,"X") / sampleSize */
export function percentFromMarks(marks: string[], sampleSize: number): number {
  if (sampleSize <= 0) return 0;
  const xCount = marks.filter((m) => m === 'X').length;
  return xCount / sampleSize;
}

export function formatPercent(pct: number): string {
  return `${(pct * 100).toFixed(1)}%`;
}

export function cumplePct(pct: number, threshold: number): boolean {
  return pct + 1e-9 >= threshold;
}

/** Criterios 9–13 y 10.x según Excel (SI/NO → CUMPLE). */
export function cumpleSiNo(key: string, value: string): boolean {
  const v = value.trim().toUpperCase();
  // Excel: abuso y 10.1 → CUMPLE si "NO"; resto → CUMPLE si "SI"
  // 10.5 en Excel dice SI=CUMPLE (aunque la pregunta es negativa); se replica el Excel.
  if (key === 'c9_actos_abuso' || key === 'c10_1' || key === 'c10_desviaciones') {
    return v === 'NO';
  }
  if (key === 'c12_desviaciones' || key === 'c13_desviaciones') {
    return v === 'NO';
  }
  if (key === 'c11_aristas') {
    return v === 'NO';
  }
  // 10.2–10.6, 11 vías/acoples/antideslizante: SI = CUMPLE en Excel
  return v === 'SI';
}

export function scoreRow(cumple: boolean): 0 | 1 {
  return cumple ? 1 : 0;
}

export type SummaryRow = {
  id: string;
  label: string;
  pctLabel: string;
  calificacion: 'CUMPLE' | 'NO CUMPLE' | '—';
  puntos: number;
};

export function buildBienestarSummary(data: Record<string, unknown>): {
  rows: SummaryRow[];
  total: number;
  totalLabel: string;
} {
  const rows: SummaryRow[] = [];

  for (const c of ANIMAL_CRITERIA) {
    const marks = parseMarks(data[c.marksKey], c.sampleSize);
    const pct = percentFromMarks(marks, c.sampleSize);
    const ok = cumplePct(pct, c.threshold);
    rows.push({
      id: `c${c.id}`,
      label: c.title,
      pctLabel: formatPercent(pct),
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: scoreRow(ok),
    });
  }

  const yn: { id: string; label: string; key: string }[] = [
    { id: 'c9', label: '9. Actos de abuso', key: 'c9_actos_abuso' },
    { id: 'c10_1', label: '10.1 Aristas/salientes en corrales', key: 'c10_1' },
    { id: 'c10_2', label: '10.2 Densidad animal adecuada', key: 'c10_2' },
    { id: 'c10_3', label: '10.3 Bebederos en funcionamiento', key: 'c10_3' },
    { id: 'c10_4', label: '10.4 Sombra en buen estado', key: 'c10_4' },
    { id: 'c10_5', label: '10.5 Áreas adyacentes', key: 'c10_5' },
    { id: 'c10_6', label: '10.6 Acceso a agua limpia', key: 'c10_6' },
  ];

  for (const item of yn) {
    const raw = String(data[item.key] ?? '').trim();
    if (!raw) {
      rows.push({
        id: item.id,
        label: item.label,
        pctLabel: raw || '—',
        calificacion: '—',
        puntos: 0,
      });
      continue;
    }
    const ok = cumpleSiNo(item.key, raw);
    rows.push({
      id: item.id,
      label: item.label,
      pctLabel: raw.toUpperCase(),
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: scoreRow(ok),
    });
  }

  // 11: Excel usa un solo resultado; consolidamos: CUMPLE solo si todas las preguntas clave cumplen
  const c11Keys = ['c11_vias', 'c11_acoples', 'c11_antideslizante', 'c11_aristas'] as const;
  const c11Filled = c11Keys.every((k) => String(data[k] ?? '').trim());
  if (c11Filled) {
    const ok = c11Keys.every((k) => cumpleSiNo(k, String(data[k])));
    rows.push({
      id: 'c11',
      label: '11. Estado de instalaciones de acceso a corrales',
      pctLabel: ok ? 'SI' : 'NO',
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: scoreRow(ok),
    });
  } else {
    rows.push({
      id: 'c11',
      label: '11. Estado de instalaciones de acceso a corrales',
      pctLabel: '—',
      calificacion: '—',
      puntos: 0,
    });
  }

  for (const item of [
    { id: 'c12', label: '12. Bienestar Animal (transporte)', key: 'c12_desviaciones' },
    { id: 'c13', label: '13. Tiempos de reposo y alimentación', key: 'c13_desviaciones' },
  ]) {
    const raw = String(data[item.key] ?? '').trim();
    if (!raw) {
      rows.push({
        id: item.id,
        label: item.label,
        pctLabel: '—',
        calificacion: '—',
        puntos: 0,
      });
      continue;
    }
    const ok = cumpleSiNo(item.key, raw);
    rows.push({
      id: item.id,
      label: item.label,
      pctLabel: raw.toUpperCase(),
      calificacion: ok ? 'CUMPLE' : 'NO CUMPLE',
      puntos: scoreRow(ok),
    });
  }

  // Excel: suma AI239..AI254 / 18  (16 filas de puntaje en el rango citado; se mantiene /18)
  const scored = rows.slice(0, 16);
  const sum = scored.reduce((a, r) => a + r.puntos, 0);
  const total = sum / 18;

  return {
    rows,
    total,
    totalLabel: formatPercent(total),
  };
}
