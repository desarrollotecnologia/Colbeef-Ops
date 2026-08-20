import { FieldDef, repeaterField, selectField } from '../field-helpers';

/** Áreas de evaluación (una sola vez por formato). */
export const HABITOS_AREAS = [
  'Línea beneficio',
  'PC comestibles',
  'Logística beneficio',
  'Subproductos',
  'SST',
  'TICS',
  'Calidad',
  'Mantenimiento',
  'Logística desposte',
  'Calidad desposte',
  'Etiquetado',
  'Desposte',
  'Visitantes',
  'Externos OPL',
] as const;

export const HABITOS_OPL_EXTERNOS = [
  'DRA',
  'AJR',
  'Mireya Sanchez',
  'Transcarnes',
  'Cruz Leonidas',
  'Edgar Benítez',
  'Camilo Vargas',
  'Yerson Vargas',
  'Multicarnes Guarin',
  'Más x menos',
] as const;

export const HABITOS_AREA_EXTERNOS_OPL = 'Externos OPL';

const CRITERIO = (key: string, label: string, sort: number): FieldDef => ({
  fieldKey: key,
  label,
  fieldType: 'CHECKLIST' as const,
  sortOrder: sort,
  manualOnly: true,
  options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] },
});

/** Columnas por persona (sin área: el área va a nivel de hoja). */
const PERSONA_COLS: FieldDef[] = [
  { fieldKey: 'nombre', label: 'Nombre', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  CRITERIO('unas', 'Uñas cortas, limpias y sin esmalte', 1),
  CRITERIO('lesiones', 'Lesiones cutáneas', 2),
  CRITERIO('cara_afeitada', 'Cara afeitada', 3),
  CRITERIO('cadenas', 'Cadenas, aretes, piercings', 4),
  CRITERIO('maquillaje', 'Maquillaje', 5),
  CRITERIO('cabello', 'Cabello recogido', 6),
  CRITERIO('uniforme', 'Pantalón y camisa limpia', 7),
  CRITERIO('casco', 'Casco limpio', 8),
  CRITERIO('botas', 'Botas limpias', 9),
  CRITERIO('peto', 'Peto limpio', 10),
  CRITERIO('lockers', 'Revisión de lockers', 11),
  { fieldKey: 'observaciones', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 12, manualOnly: true },
];

export function getFormat10Fields(_slug: string): FieldDef[] {
  return [
    selectField('area_evaluada', 'Seleccione área', [...HABITOS_AREAS], 1, {
      required: true,
      groupName: 'Área evaluada',
      helpText: 'El área aplica a todo el personal de este registro.',
    }),
    selectField('opl_externo', 'OPL externo', [...HABITOS_OPL_EXTERNOS], 2, {
      groupName: 'Área evaluada',
      helpText: 'Obligatorio solo si el área es Externos OPL.',
    }),
    repeaterField('personas', 'Personal inspeccionado', PERSONA_COLS, 10, {
      required: true,
      minRows: 1,
      maxRows: 80,
      formalTable: true,
      helpText: 'Registre el personal del área seleccionada (C / NC / NA).',
    }),
  ];
}
