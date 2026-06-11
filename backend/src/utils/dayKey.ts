const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/** Día de la semana según la fecha calendario (UTC), coherente con @db.Date en MySQL */
export function getDayKey(date: Date): (typeof DAY_KEYS)[number] {
  return DAY_KEYS[date.getUTCDay()];
}

export function slugifyPoint(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[.]/g, '');
}
