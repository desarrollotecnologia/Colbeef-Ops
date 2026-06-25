import { FormatField } from '@prisma/client';
import { getDayKey, slugifyPoint } from './dayKey';

/** Si es false, ningún campo bloquea entregar a revisión */
const ENFORCE_REQUIRED_FIELDS = false;

type ChecklistItemData = {
  cnc?: string;
  rev_cnc?: string;
  final_cnc?: string;
  platforms?: Record<string, string>;
  cavas?: Record<string, string>;
};

type FieldOptions = {
  layout?: string;
  tableType?: string;
  pediluviosLayout?: 'operativo' | 'simple';
  schedule?: Record<string, string[]>;
  items?: { key: string }[];
  columns?: string[] | { key: string; label?: string; type?: string; required?: boolean }[];
  columnDefs?: { key: string }[];
  cavaColumns?: string[];
  platformCount?: number;
  minRows?: number;
  matrix?: boolean;
  columns_def?: { key: string; required?: boolean; label?: string; type?: string }[];
};

function hasTemperatureValue(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

function isTemperatureKey(key: string, label?: string): boolean {
  const k = key.toLowerCase();
  const lbl = (label ?? '').toLowerCase();
  if (k.includes('temperatura') || k === 'temp' || k.startsWith('temp_')) return true;
  if (lbl.includes('temperatura') || lbl.includes('t°c') || lbl.includes('t°')) return true;
  if (/temp\s*°/.test(lbl)) return true;
  return false;
}

function checklistColumnKeys(options: FieldOptions): string[] {
  return (options.columns ?? ['cnc']).map((c) => (typeof c === 'string' ? c : c.key));
}

function isChecklistItemComplete(
  itemData: ChecklistItemData,
  options: FieldOptions
): boolean {
  const columns = checklistColumnKeys(options);

  if (columns.includes('cavaColumns')) {
    const defs =
      options.columnDefs?.length
        ? options.columnDefs
        : (options.cavaColumns ?? []).map((key) => ({ key }));
    return defs.every((col) => Boolean(itemData.cavas?.[col.key]));
  }

  if (columns.includes('platforms')) {
    const count = options.platformCount ?? 5;
    for (let i = 1; i <= count; i++) {
      if (!itemData.platforms?.[String(i)]) return false;
    }
    return true;
  }

  if (columns.includes('rev_cnc') && !itemData.rev_cnc) return false;
  if (columns.includes('cnc') && !itemData.cnc) return false;

  return true;
}

export function isFieldValueEmpty(
  field: Pick<FormatField, 'fieldKey' | 'fieldType' | 'required' | 'options'>,
  value: unknown,
  workDate: Date
): boolean {
  return !isFieldComplete(field, value, workDate);
}

export function isFieldComplete(
  field: Pick<FormatField, 'fieldKey' | 'fieldType' | 'required' | 'options'>,
  value: unknown,
  workDate: Date
): boolean {
  if (!ENFORCE_REQUIRED_FIELDS) return true;

  const options = (field.options ?? {}) as FieldOptions;

  if (field.fieldKey === 'empresa') return true;

  if (options.layout === 'formal_measure_table') {
    const items = options.items ?? [];
    const data = (value as Record<string, Record<string, string>>) ?? {};
    const tableType = options.tableType ?? 'cloro';

    for (const item of items) {
      const row = data[item.key] ?? {};
      if (tableType === 'cloro') {
        if (!row.hora || !row.punto_toma || !row.cloro_residual || !row.cnc) return false;
      } else if (tableType === 'temperaturas') {
        if (!row.cnc) return false;
        if (row.cnc === 'NA') continue;
        if (!row.hora || !hasTemperatureValue(row.temperatura)) return false;
      } else if (tableType === 'titulacion') {
        if (!row.hora || !row.volumen_naoh || !row.cnc) return false;
      } else if (tableType === 'equipos') {
        if (!row.estado) return false;
      } else if (tableType === 'pediluvios') {
        if (options.pediluviosLayout === 'operativo') {
          if (!row.hora || !row.principio_activo || !row.concentracion || !row.cnc) return false;
        } else if (!row.principio_activo || !row.concentracion || !row.cnc) {
          return false;
        }
      }
    }
    return true;
  }

  if (options.layout === 'day_schedule_table') {
    const schedule = options.schedule ?? {};
    const dayKey = getDayKey(workDate);
    const points = schedule[dayKey] ?? [];
    if (points.length === 0) return true;

    const data = (value as Record<string, Record<string, string>>) ?? {};
    const tableType = options.tableType ?? 'cloro';

    for (const punto of points) {
      const key = slugifyPoint(punto);
      const row = data[key] ?? {};
      if (tableType === 'cloro') {
        if (!row.cloro_residual || !row.cnc) return false;
      } else if (!hasTemperatureValue(row.temperatura) || !row.cnc) {
        return false;
      }
    }
    return true;
  }

  if (field.fieldType === 'CHECKLIST' && options.items?.length) {
    const data = (value as Record<string, ChecklistItemData>) ?? {};
    return options.items.every((item) =>
      isChecklistItemComplete(data[item.key] ?? {}, options)
    );
  }

  if (field.fieldType === 'REPEATER' && options.matrix) {
    if (!field.required) return true;
    const data = (value as Record<string, Record<string, string>[]>) ?? {};
    return Object.values(data).some(
      (readings) =>
        Array.isArray(readings) &&
        readings.some((row) => row.hora || hasTemperatureValue(row.temperatura) || row.observaciones)
    );
  }

  if (field.fieldType === 'REPEATER') {
    const rows = Array.isArray(value) ? value : [];
    const minRows = options.minRows ?? (field.required ? 1 : 0);
    if (rows.length < minRows) return false;
    const cols = options.columns ?? options.columns_def ?? [];
    return rows.every((row) =>
      cols
        .filter((c) => typeof c === 'object' && c !== null && 'required' in c && c.required)
        .every((c) => {
          const col = c as { key: string; label?: string; type?: string };
          const cell = (row as Record<string, unknown>)[col.key];
          if (isTemperatureKey(col.key, col.label)) {
            return hasTemperatureValue(cell);
          }
          return cell !== undefined && cell !== null && cell !== '';
        })
    );
  }

  if (field.fieldType === 'NUMBER' && isTemperatureKey(field.fieldKey)) {
    if (!field.required) return true;
    return hasTemperatureValue(value);
  }

  if (field.required) {
    return (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0)
    );
  }

  if (field.fieldType === 'CHECKLIST') {
    return value !== undefined && value !== null && value !== '';
  }

  return true;
}

export function getSubmissionMissingFields(
  formatSheets: {
    id: string;
    name: string;
    fields: Pick<FormatField, 'fieldKey' | 'label' | 'fieldType' | 'required' | 'options'>[];
  }[],
  submissionSheets: { sheetId: string; data: unknown }[],
  workDate: Date
): { sheet: string; field: string; label: string }[] {
  const missing: { sheet: string; field: string; label: string }[] = [];

  for (const formatSheet of formatSheets) {
    const submissionSheet = submissionSheets.find((s) => s.sheetId === formatSheet.id);
    const sheetData = (submissionSheet?.data as Record<string, unknown>) || {};

    for (const field of formatSheet.fields) {
      if (!isFieldComplete(field, sheetData[field.fieldKey], workDate)) {
        missing.push({
          sheet: formatSheet.name,
          field: field.fieldKey,
          label: field.label,
        });
      }
    }
  }

  return missing;
}
