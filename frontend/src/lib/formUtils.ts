import type { FormatField } from '@/types';

export const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 text-gray-900';

/** Barra de título de sección/etapa en hojas de formato */
export const SECTION_HEADER_CLASS = 'bg-[#dcfce7] px-3 py-2 border-b border-gray-800';
export const SECTION_HEADER_ROW_CLASS = 'bg-[#dcfce7]';

export function groupFields(fields: FormatField[]): { name: string | null; fields: FormatField[] }[] {
  const groups: { name: string | null; fields: FormatField[] }[] = [];
  let current: string | null = null;
  let bucket: FormatField[] = [];

  for (const field of fields) {
    const g = field.groupName ?? null;
    if (g !== current) {
      if (bucket.length > 0) groups.push({ name: current, fields: bucket });
      current = g;
      bucket = [field];
    } else {
      bucket.push(field);
    }
  }
  if (bucket.length > 0) groups.push({ name: current, fields: bucket });

  return groups;
}

export function formatDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    if (typeof value[0] === 'object') return `${value.length} registro(s)`;
    return value.join(', ');
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return '—';
    return `${keys.length} ítem(s)`;
  }
  return String(value);
}
