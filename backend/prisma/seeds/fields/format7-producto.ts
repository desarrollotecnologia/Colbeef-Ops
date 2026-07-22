import {
  FieldDef,
  cardRepeaterField,
  cncField,
  dateField,
  multiSelectField,
  numberField,
  selectField,
  textField,
  timeField,
  textareaField,
} from '../field-helpers';

const AREAS_REFRIG = [
  'CER',
  'Túnel de congelación',
  'Contenedor #1',
  'Contenedor #2',
  'Contenedor #3',
  'Cava 12',
  'Contenedor externo',
];
const AREAS_CONG = [
  'Túnel de congelación',
  'Contenedor #1',
  'Contenedor #2',
  'Contenedor #3',
  'Cava 12',
  'Contenedor externo',
];

function loteColumns(areas: string[]): FieldDef[] {
  return [
    textField('lote', 'Lote', 0, { required: true }),
    multiSelectField('area', 'Área', areas, 1, { required: true }),
    textField('producto', 'Producto', 2, { required: true }),
    dateField('fecha_produccion', 'Fecha de producción', 3, { required: true }),
    dateField('fecha_vencimiento', 'Fecha de vencimiento', 4, { required: true }),
    numberField('temperatura', 'Temperatura', 5, { required: true }),
    timeField('hora', 'Hora', 6, { required: true }),
    selectField('tipo_empaque', 'Tipo de empaque', ['Vacío', 'Granel'], 7, { required: true }),
    cncField('estado_empaque', 'Estado de empaque', 8, { required: true }),
    cncField('etiqueta', 'Etiqueta', 9, { required: true }),
    textareaField('observaciones', 'Observaciones', 10),
  ];
}

export function getFormat7Fields(slug: string): FieldDef[] {
  const areas = slug === 'congelado' ? AREAS_CONG : AREAS_REFRIG;

  return [
    cardRepeaterField('lotes', 'Registros de lote', loteColumns(areas), 1, {
      minRows: 1,
      maxRows: 30,
      entryLabel: 'Registro de lote',
      addButtonLabel: 'Agregar lote',
      formalEntryHeaders: true,
    }),
    textareaField('observaciones_generales', 'Observaciones generales', 100),
  ];
}
