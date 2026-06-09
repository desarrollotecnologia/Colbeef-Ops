/** Ej: "9 de junio de 2026" */
export function formatSpanishDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const month = d.toLocaleDateString('es-CO', { month: 'long' });
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/** Ej: "lunes, 9 de junio de 2026" */
export function formatSpanishDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = d.toLocaleDateString('es-CO', { weekday: 'long' });
  return `${weekday}, ${formatSpanishDate(dateStr)}`;
}
