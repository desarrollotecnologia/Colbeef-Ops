import type { FormatField, FieldOptions } from '@/types';

/** Definición completa — debe coincidir con backend/prisma/seeds/fields/format1-beneficio.ts */
export const AREA_REFRI_COLUMN_DEFS = [
  { key: 'C#10', mode: 'cnc_na' as const },
  { key: 'C#9', mode: 'cnc_na' as const },
  { key: 'C#8', mode: 'cnc_na' as const },
  { key: 'C#7', mode: 'cnc_na' as const },
  { key: 'M7', mode: 'cnc' as const },
  { key: 'C#6B', mode: 'cnc_na' as const },
  { key: 'M6B', mode: 'cnc' as const },
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

export const AREAS_REFRIGERACION_COLUMN_DEFS = [
  { key: 'PAN1', mode: 'cnc_na' as const },
  { key: 'CAV2', mode: 'cnc_na' as const },
  { key: 'CAV3', mode: 'cnc_na' as const },
  { key: 'CAV4', mode: 'cnc_na' as const },
  { key: 'FIL1', mode: 'cnc_na' as const },
  { key: 'PAS2', mode: 'cnc_na' as const },
  { key: 'DES1', mode: 'cnc_na' as const },
  { key: 'CON1', mode: 'cnc_na' as const },
  { key: 'FIL2', mode: 'cnc_na' as const },
  { key: 'TUN1', mode: 'cnc_na' as const },
  { key: 'LAV1', mode: 'cnc_na' as const },
  { key: 'CAV5', mode: 'cnc_na' as const },
  { key: 'BAÑ1', mode: 'cnc_na' as const },
  { key: 'ESP1', mode: 'cnc_na' as const },
  { key: 'ASE1', mode: 'cnc_na' as const },
  { key: 'MAN1', mode: 'cnc_na' as const },
  { key: 'PER1', mode: 'cnc_na' as const },
];

const AREAS_REFRIGERACION_ITEMS = [
  'Entrada de canales', 'Pasillos', 'Filtros', 'Lavabos y lava botas', 'Puerta de ingreso',
  'Despacho de carne y vísceras', 'Cuarto de decomisos', 'Túnel de oreo', 'Lavado de canastillas',
  'Lavado de ganchos', 'Muelle de carga', 'Baños', 'Sala de espera de conductores',
  'Cuarto de aseo', 'Cuarto de mantenimiento',
].map((label, i) => ({ key: `arz_${i}`, label }));

function mergeOptions(field: FormatField, patch: Partial<FieldOptions>): FormatField {
  return { ...field, options: { ...field.options, ...patch } };
}

/** Si el servidor aún tiene campos viejos (solo 4 cavas), completar desde el código nuevo */
export function resolveHoja7Field(field: FormatField | undefined): FormatField | undefined {
  if (!field) return undefined;

  if (field.fieldKey === 'area_refri') {
    const cols = field.options?.columnDefs ?? [];
    if (cols.length < AREA_REFRI_COLUMN_DEFS.length) {
      return mergeOptions(field, {
        columnDefs: AREA_REFRI_COLUMN_DEFS,
        columns: ['cavaColumns', 'observation', 'corrective'],
        areaLabel: field.options?.areaLabel ?? 'Área de refrigeración',
      });
    }
  }

  if (field.fieldKey === 'areas_refrigeracion') {
    const cols = field.options?.columnDefs ?? [];
    if (cols.length < AREAS_REFRIGERACION_COLUMN_DEFS.length) {
      return mergeOptions(field, {
        columnDefs: AREAS_REFRIGERACION_COLUMN_DEFS,
        columns: ['cavaColumns', 'observation', 'corrective'],
        items: field.options?.items?.length ? field.options.items : AREAS_REFRIGERACION_ITEMS,
        areaLabel: 'Áreas de refrigeración',
        matrixRowLabel: 'Área',
      });
    }
  }

  return field;
}

export function syntheticAreasRefrigeracionField(fields: FormatField[]): FormatField | undefined {
  if (fields.some((f) => f.fieldKey === 'areas_refrigeracion')) return undefined;
  return {
    id: 'synthetic-areas-refrigeracion',
    fieldKey: 'areas_refrigeracion',
    label: 'Áreas de refrigeración',
    fieldType: 'CHECKLIST',
    required: false,
    manualOnly: true,
    sortOrder: 3,
    options: {
      columnDefs: AREAS_REFRIGERACION_COLUMN_DEFS,
      columns: ['cavaColumns', 'observation', 'corrective'],
      items: AREAS_REFRIGERACION_ITEMS,
      areaLabel: 'Áreas de refrigeración',
      matrixRowLabel: 'Área',
    },
  };
}
