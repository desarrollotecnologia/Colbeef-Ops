const BOGOTA_TZ = 'America/Bogota';

/** Fecha de hoy en Colombia (YYYY-MM-DD) */
export function getWorkDateString(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: BOGOTA_TZ });
}

/** Extrae YYYY-MM-DD de una fecha ISO devuelta por la API */
export function toWorkDateString(value: string): string {
  return value.split('T')[0];
}

/** Hora en Colombia (ej. 3:45 p. m.) */
export function formatTimeBogota(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    timeZone: BOGOTA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
/** Fecha corta para listas: 11/6/2026 */
export function formatWorkDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
