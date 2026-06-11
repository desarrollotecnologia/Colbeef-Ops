const UTC = 'UTC';

function parseCalendarDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00Z');
}

/** Ej: "9 de junio de 2026" */
export function formatSpanishDate(dateStr: string): string {
  const d = parseCalendarDate(dateStr);
  const day = d.getUTCDate();
  const month = d.toLocaleDateString('es-CO', { month: 'long', timeZone: UTC });
  const year = d.getUTCFullYear();
  return `${day} de ${month} de ${year}`;
}

/** Ej: "jueves, 11 de junio de 2026" */
export function formatSpanishDateLong(dateStr: string): string {
  const d = parseCalendarDate(dateStr);
  const weekday = d.toLocaleDateString('es-CO', { weekday: 'long', timeZone: UTC });
  return `${weekday}, ${formatSpanishDate(dateStr)}`;
}
