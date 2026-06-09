import { PrismaClient } from '@prisma/client';

/** 0 = domingo, 1 = lunes, ... */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function parseWorkDate(value: string | Date): Date {
  const d = value instanceof Date ? value : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
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
