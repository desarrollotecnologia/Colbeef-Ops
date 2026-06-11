import type { ChecklistItemData, FormatField } from '@/types';
import { getDayKey } from '@/lib/autoFill';

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
  if (columns.includes('final_cnc') && !itemData.final_cnc) return false;
  if (columns.includes('cnc') && !itemData.cnc) return false;

  return true;
}

export function isFieldComplete(
  field: FormatField,
  value: unknown,
  workDate: string
): boolean {
  const options = field.options ?? {};

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
      return Boolean(row.temperatura && row.cnc);
    });
  }

  if (field.fieldType === 'CHECKLIST' && options.items?.length) {
    const data = (value as Record<string, ChecklistItemData>) ?? {};
    return options.items.every((item) => isChecklistItemComplete(data[item.key] ?? {}, options));
  }

  if (field.fieldType === 'REPEATER') {
    const rows = Array.isArray(value) ? value : [];
    const minRows = options.minRows ?? 1;
    if (rows.length < minRows) return false;
    const cols = options.columns ?? options.columns_def ?? [];
    return rows.every((row) =>
      cols
        .filter((c) => typeof c === 'object' && c.required)
        .every((c) => {
          const col = c as { key: string };
          const cell = (row as Record<string, unknown>)[col.key];
          return cell !== undefined && cell !== null && cell !== '';
        })
    );
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
