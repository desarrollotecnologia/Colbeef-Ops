import type { FormatField, FieldOptions } from '@/types';

/** Definición completa — debe coincidir con backend/prisma/seeds/fields/format1-beneficio.ts */
export const AREA_REFRI_COLUMN_DEFS = [
  { key: 'C#10', mode: 'cnc_na' as const },
  { key: 'C#9', mode: 'cnc_na' as const },
  { key: 'C#8', mode: 'cnc_na' as const },
  { key: 'C#7', mode: 'cnc_na' as const },
  { key: 'M7', mode: 'cnc' as const },
  { key: 'C#6B', mode: 'cnc_na' as const },
  { key: 'M6', mode: 'cnc' as const },
  { key: 'C#6A', mode: 'cnc_na' as const },
  { key: 'C#5', mode: 'cnc_na' as const },
  { key: 'M5', mode: 'cnc' as const },
  { key: 'C#4', mode: 'cnc_na' as const },
  { key: 'M4', mode: 'cnc' as const },
  { key: 'C#3', mode: 'cnc_na' as const },
  { key: 'M#3', mode: 'cnc' as const },
  { key: 'C#2', mode: 'cnc_na' as const },
  { key: 'M2', mode: 'cnc' as const },
  { key: 'C#1', mode: 'cnc_na' as const },
  { key: 'M1', mode: 'cnc' as const },
  { key: 'PRE', mode: 'cnc' as const },
];

/** Ítems que ya no van en la matriz (evaluación única al final) */
const AREA_REFRI_GLOBAL_KEYS = new Set(['ar_12', 'ar_13', 'ar_14', 'ag_0', 'ag_1', 'ag_2']);
const AREA_REFRI_GLOBAL_LABELS = new Set([
  'Sierra circular de cuarteo',
  'Pasillos cavas',
  'Muelle pre-refrigeración',
]);

function mergeOptions(field: FormatField, patch: Partial<FieldOptions>): FormatField {
  return { ...field, options: { ...field.options, ...patch } };
}

/** Si el servidor aún tiene campos viejos (solo 4 cavas), completar desde el código nuevo */
export function resolveHoja7Field(field: FormatField | undefined): FormatField | undefined {
  if (!field) return undefined;

  if (field.fieldKey === 'area_refri') {
    const cols = field.options?.columnDefs ?? [];
    const rawItems = field.options?.items ?? [];
    const items = rawItems.filter(
      (item) =>
        !AREA_REFRI_GLOBAL_KEYS.has(item.key) && !AREA_REFRI_GLOBAL_LABELS.has(item.label)
    );
    const patch: Partial<FieldOptions> = {
      columns: ['cavaColumns', 'observation', 'corrective'],
      areaLabel: field.options?.areaLabel ?? 'Área de refrigeración',
    };
    if (items.length > 0 && items.length !== rawItems.length) {
      patch.items = items;
    }
    if (cols.length < AREA_REFRI_COLUMN_DEFS.length) {
      patch.columnDefs = AREA_REFRI_COLUMN_DEFS;
    }
    return mergeOptions(field, patch);
  }

  return field;
}
