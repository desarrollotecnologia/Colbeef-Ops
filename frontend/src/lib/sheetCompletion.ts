import type { ChecklistItemData, FormatField } from '@/types';
import { getDayKey } from '@/lib/autoFill';
import { ENFORCE_REQUIRED_FIELDS, hasTemperatureValue, isTemperatureInput } from '@/lib/formUtils';

function slugifyPoint(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

type ChecklistOptions = NonNullable<FormatField['options']>;

function isChecklistItemComplete(
  itemData: ChecklistItemData,
  options: ChecklistOptions
): boolean {
  const columns = (options.columns ?? ['cnc']) as string[];

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

export function isFieldComplete(
  field: FormatField,
  value: unknown,
  workDate: string
): boolean {
  if (!ENFORCE_REQUIRED_FIELDS) return true;

  const options = field.options ?? {};

  if (options.layout === 'formal_measure_table') {
    const items = options.items ?? [];
    const data = (value as Record<string, Record<string, string>>) ?? {};
    const tableType = options.tableType ?? 'cloro';

    return items.every((item) => {
      const row = data[item.key] ?? {};
      if (tableType === 'cloro') {
        return Boolean(row.hora && row.punto_toma && row.cloro_residual && row.cnc);
      }
      if (tableType === 'temperaturas') {
        if (!row.cnc) return false;
        if (row.cnc === 'NA') return true;
        return Boolean(row.hora && hasTemperatureValue(row.temperatura));
      }
      if (tableType === 'titulacion') {
        return Boolean(row.hora && row.volumen_naoh && row.cnc);
      }
      if (tableType === 'equipos') {
        return Boolean(row.estado);
      }
      if (tableType === 'pediluvios') {
        if (options.pediluviosLayout === 'operativo') {
          return Boolean(row.hora && row.principio_activo && row.concentracion && row.cnc);
        }
        return Boolean(row.principio_activo && row.concentracion && row.cnc);
      }
      return true;
    });
  }

  if (options.layout === 'day_schedule_table') {
    const schedule = options.schedule ?? {};
    const points = schedule[getDayKey(workDate)] ?? [];
    if (points.length === 0) return true;

    const data = (value as Record<string, Record<string, string>>) ?? {};
    const tableType = options.tableType ?? 'cloro';

    return points.every((punto) => {
      const row = data[slugifyPoint(punto)] ?? {};
      if (tableType === 'cloro') {
        return Boolean(row.cloro_residual && row.cnc);
      }
      return Boolean(hasTemperatureValue(row.temperatura) && row.cnc);
    });
  }

  if (field.fieldType === 'CHECKLIST' && options.items?.length) {
    const data = (value as Record<string, ChecklistItemData>) ?? {};
    return options.items.every((item) => isChecklistItemComplete(data[item.key] ?? {}, options));
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
        .filter((c) => typeof c === 'object' && c.required)
        .every((c) => {
          const col = c as { key: string; label?: string; type?: string };
          const cell = (row as Record<string, unknown>)[col.key];
          if (isTemperatureInput(col.key, col.label) || col.type === 'NUMBER' && isTemperatureInput(col.key, col.label)) {
            return hasTemperatureValue(cell);
          }
          return cell !== undefined && cell !== null && cell !== '';
        })
    );
  }

  if (field.fieldType === 'NUMBER' && isTemperatureInput(field.fieldKey, field.label)) {
    if (!field.required) return true;
    return hasTemperatureValue(value);
  }

  if (field.required) {
    return value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);
  }

  if (field.fieldType === 'CHECKLIST' && !options.items?.length) {
    return value !== undefined && value !== null && value !== '';
  }

  return true;
}

export function isSheetComplete(
  fields: FormatField[],
  sheetData: Record<string, unknown>,
  workDate: string
): boolean {
  const contentFields = fields.filter((f) => f.fieldKey !== 'empresa');
  return contentFields.every((field) => isFieldComplete(field, sheetData[field.fieldKey], workDate));
}

export function getIncompleteFields(
  fields: FormatField[],
  sheetData: Record<string, unknown>,
  workDate: string,
  sheetName: string
): { sheet: string; field: string; label: string }[] {
  const missing: { sheet: string; field: string; label: string }[] = [];
  const contentFields = fields.filter((f) => f.fieldKey !== 'empresa');

  for (const field of contentFields) {
    if (!isFieldComplete(field, sheetData[field.fieldKey], workDate)) {
      missing.push({ sheet: sheetName, field: field.fieldKey, label: field.label });
    }
  }

  return missing;
}
