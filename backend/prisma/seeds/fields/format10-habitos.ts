import { FieldDef, repeaterField } from '../field-helpers';

/** Áreas del Excel + áreas operativas usadas en planta. */
const AREAS = [
  'Producción',
  'Etiquetado',
  'Logística',
  'Logística Beneficio',
  'Logística desposte',
  'Desposte',
  'Línea',
  'P.C. Comestibles',
  'Calidad',
  'Mantenimiento',
  'Más x Menos',
  'Subproductos',
  'Externos',
  'Tecnología',
  'SST',
];

const CRITERIO = (key: string, label: string, sort: number): FieldDef => ({
  fieldKey: key,
  label,
  fieldType: 'CHECKLIST' as const,
  sortOrder: sort,
  manualOnly: true,
  options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] },
});

const PERSONA_COLS: FieldDef[] = [
  { fieldKey: 'nombre', label: 'Nombre', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  {
    fieldKey: 'area',
    label: 'Área',
    fieldType: 'SELECT' as const,
    sortOrder: 1,
    manualOnly: true,
    required: true,
    options: { choices: AREAS },
  },
  CRITERIO('unas', 'Uñas cortas, limpias y sin esmalte', 2),
  CRITERIO('lesiones', 'Lesiones cutáneas', 3),
  CRITERIO('cara_afeitada', 'Cara afeitada', 4),
  CRITERIO('cadenas', 'Cadenas, aretes, piercings', 5),
  CRITERIO('maquillaje', 'Maquillaje', 6),
  CRITERIO('cabello', 'Cabello recogido', 7),
  CRITERIO('uniforme', 'Pantalón y camisa limpia', 8),
  CRITERIO('casco', 'Casco limpio', 9),
  CRITERIO('botas', 'Botas limpias', 10),
  CRITERIO('peto', 'Peto limpio', 11),
  CRITERIO('lockers', 'Revisión de lockers', 12),
  { fieldKey: 'observaciones', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 13, manualOnly: true },
];

export function getFormat10Fields(_slug: string): FieldDef[] {
  return [
    repeaterField('personas', 'Personal inspeccionado', PERSONA_COLS, 1, {
      required: true,
      minRows: 1,
      maxRows: 80,
      formalTable: true,
      helpText: 'Asigne el área a cada persona en la fila correspondiente.',
    }),
  ];
}
