import { config } from '../config';

const BOGOTA = 'America/Bogota';

function bogotaParts(date = new Date()): { y: number; m: number; d: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    hour: Number(get('hour')),
  };
}

function ymdFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

/** Fecha operativa del turno PCC (Y-m-d). Antes de horaFin → día anterior. */
export function fechaOperativaPccYmd(now = new Date()): string {
  const { y, m, d, hour } = bogotaParts(now);
  const today = ymdFromParts(y, m, d);
  const horaFin = config.pccTurnoHoraFin;
  if (hour < horaFin) return addDaysYmd(today, -1);
  return today;
}

/** workDate @db.Date desde Y-m-d. */
export function parseOperativeDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/**
 * Ventana created_at del turno para una fecha operativa D:
 * D 07:00 Bogotá → D+1 06:59:59.999 Bogotá (como Instant UTC).
 */
export function ventanaCreacionParaFechaOperativa(fechaOperativaYmd: string): { desde: Date; hasta: Date } {
  const horaFin = config.pccTurnoHoraFin;
  // Interpretar como Bogotá: construir offset fijo -05:00 (Colombia sin DST)
  const desde = new Date(`${fechaOperativaYmd}T${String(horaFin).padStart(2, '0')}:00:00.000-05:00`);
  const next = addDaysYmd(fechaOperativaYmd, 1);
  const hasta = new Date(`${next}T${String(horaFin).padStart(2, '0')}:00:00.000-05:00`);
  // hasta exclusivo en consultas whereBetween; restamos 1ms al extremo superior tipo inclusive
  return { desde, hasta: new Date(hasta.getTime() - 1) };
}

export function horaLimiteTurno(): number {
  return config.pccTurnoHoraFin;
}
