import type { FormatField } from '@/types';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export interface AutoFillContext {
  workDate: string;
  userName: string;
  sheetData: Record<string, unknown>;
}

export function getDayKey(dateStr: string): (typeof DAY_KEYS)[number] {
  const d = new Date(dateStr + 'T12:00:00Z');
  return DAY_KEYS[d.getUTCDay()];
}

export function resolveAutoValue(field: FormatField, ctx: AutoFillContext): unknown {
  const rule = field.autoFillRule;
  const config = field.config ?? {};

  switch (rule) {
    case 'CURRENT_DATE':
      return ctx.workDate;
    case 'CURRENT_TIME':
      return new Date().toTimeString().slice(0, 5);
    case 'CURRENT_DATETIME':
      return new Date().toISOString();
    case 'CURRENT_USER':
    case 'CURRENT_USER_NAME':
      return ctx.userName;
    case 'FIXED_VALUE':
      return config.value ?? field.defaultValue ?? '';
    case 'DAY_SCHEDULE': {
      const schedule = config.schedule ?? {};
      const day = getDayKey(ctx.workDate);
      return schedule[day] ?? [];
    }
    case 'CALC_MAP': {
      const source = config.sourceField;
      if (!source) return '';
      const sourceVal = String(ctx.sheetData[source] ?? '');
      const mapped = config.map?.[sourceVal];
      if (mapped === undefined) return '';
      return config.suffix ? `${mapped}${config.suffix}` : mapped;
    }
    default:
      return field.defaultValue ?? '';
  }
}

export function isAutoField(field: FormatField): boolean {
  return field.fieldType === 'AUTO' || field.fieldType === 'READONLY';
}

export function applyAutoFields(
  fields: FormatField[],
  data: Record<string, unknown>,
  ctx: AutoFillContext
): Record<string, unknown> {
  const result = { ...data };

  for (const field of fields) {
    if (field.fieldType === 'READONLY') {
      result[field.fieldKey] = field.defaultValue ?? '';
    } else if (field.fieldType === 'AUTO') {
      result[field.fieldKey] = resolveAutoValue(field, { ...ctx, sheetData: result });
    } else if (field.autoFillRule === 'CALC_MAP') {
      result[field.fieldKey] = resolveAutoValue(field, { ...ctx, sheetData: result });
    }
  }

  return result;
}

export function recalcDependentFields(
  fields: FormatField[],
  data: Record<string, unknown>,
  ctx: AutoFillContext,
  changedKey: string
): Record<string, unknown> {
  const result = { ...data };
  const dependents = fields.filter(
    (f) => f.autoFillRule === 'CALC_MAP' && f.config?.sourceField === changedKey
  );

  for (const field of dependents) {
    result[field.fieldKey] = resolveAutoValue(field, { ...ctx, sheetData: result });
  }

  return result;
}
