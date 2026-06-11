import { PrismaClient } from '@prisma/client';

const BOGOTA_TZ = 'America/Bogota';

/** Fecha de hoy en Colombia (YYYY-MM-DD) */
export function getTodayWorkDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BOGOTA_TZ });
}

/** Convierte Date @db.Date a YYYY-MM-DD sin desfase de zona horaria */
export function workDateToString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parsea YYYY-MM-DD como fecha calendario (medianoche UTC) */
export function parseWorkDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [y, m, d] = String(value).split('T')[0].split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function getTodayWorkDate(): Date {
  return parseWorkDate(getTodayWorkDateString());
}

export function isSameWorkDate(a: Date, b: Date): boolean {
  return workDateToString(a) === workDateToString(b);
}

/** 0 = domingo — usa UTC para coincidir con fechas @db.Date */
export function isSunday(date: Date): boolean {
  return date.getUTCDay() === 0;
}

export async function assertWorkDateAllowed(
  prisma: PrismaClient,
  formatId: string,
  workDate: Date
): Promise<{ ok: true } | { ok: false; error: string }> {
  const format = await prisma.format.findUnique({ where: { id: formatId } });
  if (!format) return { ok: false, error: 'Formato no encontrado' };

  if (format.noSunday && isSunday(workDate)) {
    return { ok: false, error: 'Los domingos no se llena este formato' };
  }

  return { ok: true };
}
