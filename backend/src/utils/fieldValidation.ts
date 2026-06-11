import { FormatField } from '@prisma/client';
import { getDayKey, slugifyPoint } from './dayKey';

type FieldOptions = {
  layout?: string;
  tableType?: string;
  schedule?: Record<string, string[]>;
};

export function isFieldValueEmpty(
  field: Pick<FormatField, 'fieldKey' | 'fieldType' | 'options'>,
  value: unknown,
  workDate: Date
): boolean {
  const options = (field.options ?? {}) as FieldOptions;

  if (options.layout === 'day_schedule_table') {
    const schedule = options.schedule ?? {};
    const dayKey = getDayKey(workDate);
    const points = schedule[dayKey] ?? [];
    if (points.length === 0) return false;

    const data = (value as Record<string, Record<string, string>>) ?? {};
    const tableType = options.tableType ?? 'cloro';

    for (const punto of points) {
      const key = slugifyPoint(punto);
      const row = data[key] ?? {};
      if (tableType === 'cloro') {
        if (!row.cloro_residual || !row.cnc) return true;
      } else {
        if (!row.temperatura || !row.cnc) return true;
      }
    }
    return false;
  }

  if (field.fieldType === 'CHECKLIST' && value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Object.keys(obj).length === 0) return true;
    return false;
  }

  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}
