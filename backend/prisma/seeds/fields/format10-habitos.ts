import { FieldDef, repeaterField, selectField } from '../field-helpers';

const AREAS = [
  'Calidad',
  'Línea',
  'P.C. Comestibles',
  'Logística Beneficio',
  'Logística desposte',
  'Desposte',
  'Externos',
  'Subproductos',
  'Mantenimiento',
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
    selectField('area', 'Área', AREAS, 1, { required: true, groupName: 'Inspección' }),
    repeaterField('personas', 'Personal inspeccionado', PERSONA_COLS, 2, {
      required: true,
      minRows: 1,
      maxRows: 80,
      formalTable: true,
    }),
  ];
}
