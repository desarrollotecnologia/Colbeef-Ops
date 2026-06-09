/** Horarios por día — sincronizado con backend/prisma/seeds/field-helpers.ts */

export const PUNTOS_INSPECCIONADOS: Record<string, string[]> = {
  monday: ['Sangría', 'Segunda pierna', 'Desolladora'],
  tuesday: ['Tolerancia cero', 'Área de cabezas', 'Eviscerado de blancas'],
  wednesday: ['Patas y manos', 'Víscera roja', 'Marcación canales'],
  thursday: ['Sierra pecho', 'Víscera blanca', 'Ins. de canales'],
  friday: ['Sierra canal', 'Lavado de canales', 'Desuello de brazo'],
  saturday: ['Sangría', 'Patas y manos', 'Lavado de canales'],
  sunday: [],
};

export const PUNTOS_ESTERILIZADORES: Record<string, string[]> = {
  monday: ['Sierra canal', 'Sierra pecho', 'Clipado de esófago', 'Corte de grandes vasos'],
  tuesday: ['Víscera roja', 'Limpieza inferior', 'Desolladora', 'Vuelta'],
  wednesday: ['Sierra pecho', 'Clipado de esófago', 'Víscera blanca', 'Tobogán de víscera blanca'],
  thursday: ['Sierra canal', 'Sierra pecho', 'Limpieza inferior', 'Desolladora'],
  friday: ['Clipado de esófago', 'Corte de grandes vasos', 'Víscera roja', 'Vuelta'],
  saturday: ['Sierra canal', 'Sierra pecho', 'Corte de grandes vasos', 'Desolladora'],
  sunday: [],
};

export function getPointsForDay(schedule: Record<string, string[]>, dayKey: string): string[] {
  return schedule[dayKey] ?? [];
}
