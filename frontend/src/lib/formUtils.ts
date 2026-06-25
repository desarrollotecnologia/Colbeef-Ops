import type { FormatField } from '@/types';

export const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100 text-gray-900';

/** Si es false, ningún campo bloquea entregar a revisión (fotos, textos, checklists, etc.) */
export const ENFORCE_REQUIRED_FIELDS = false;

export function showRequiredIndicator(required?: boolean): boolean {
  return ENFORCE_REQUIRED_FIELDS && Boolean(required);
}

/** Barra de título de sección/etapa en hojas de formato */
export const SECTION_HEADER_CLASS = 'bg-[#dcfce7] px-3 py-2 border-b border-gray-800';
export const SECTION_HEADER_ROW_CLASS = 'bg-[#dcfce7]';

/** Campos de temperatura aceptan texto libre además de números */
export function isTemperatureInput(fieldKey?: string, label?: string): boolean {
  const key = (fieldKey ?? '').toLowerCase();
  const lbl = (label ?? '').toLowerCase();
  if (key.includes('temperatura') || key === 'temp' || key.startsWith('temp_')) return true;
  if (lbl.includes('temperatura') || lbl.includes('t°c') || lbl.includes('t°')) return true;
  if (/temp\s*°/.test(lbl)) return true;
  return false;
}

/** Convierte "2,5" o "2.5" a número; devuelve NaN si no hay valor numérico */
export function parseLocaleNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return NaN;
  const normalized = String(value).trim().replace(',', '.');
  return parseFloat(normalized);
}

export function hasTemperatureValue(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

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
