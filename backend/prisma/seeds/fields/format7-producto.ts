import {
  FieldDef,
  cncField,
  dateField,
  multiSelectField,
  numberField,
  repeaterField,
  selectField,
  textField,
  timeField,
  textareaField,
} from '../field-helpers';

const AREAS_REFRIG = ['CER', 'Túnel de congelación', 'Contenedor #1', 'Contenedor #2', 'Contenedor #3', 'Cava 12', 'Contenedor externo'];
const AREAS_CONG = ['Túnel de congelación', 'Contenedor #1', 'Contenedor #2', 'Contenedor #3', 'Cava 12', 'Contenedor externo'];

function loteBlock(prefix: string, areas: string[], sortStart: number): FieldDef[] {
  return [
    textField(`${prefix}_lote`, 'Lote', sortStart, { required: true }),
    multiSelectField(`${prefix}_area`, 'Área', areas, sortStart + 1, { required: true }),
    textField(`${prefix}_producto`, 'Producto', sortStart + 2, { required: true }),
    dateField(`${prefix}_fecha_produccion`, 'Fecha de producción', sortStart + 3, { required: true }),
    dateField(`${prefix}_fecha_vencimiento`, 'Fecha de vencimiento', sortStart + 4, { required: true }),
    numberField(`${prefix}_temperatura`, 'Temperatura', sortStart + 5, { required: true }),
    timeField(`${prefix}_hora`, 'Hora', sortStart + 6, { required: true }),
    selectField(`${prefix}_tipo_empaque`, 'Tipo de empaque', ['Vacío', 'Granel'], sortStart + 7, { required: true }),
    cncField(`${prefix}_estado_empaque`, 'Estado de empaque', sortStart + 8, { required: true }),
    cncField(`${prefix}_etiqueta`, 'Etiqueta', sortStart + 9, { required: true }),
    textareaField(`${prefix}_observaciones`, 'Observaciones', sortStart + 10),
  ];
}

export function getFormat7Fields(slug: string): FieldDef[] {
  const areas = slug === 'congelado' ? AREAS_CONG : AREAS_REFRIG;
  const blocks = [1, 2, 3, 4].flatMap((n, i) => loteBlock(`bloque_${n}`, areas, i * 15 + 1));

  return [
    ...blocks,
    textareaField('observaciones_generales', 'Observaciones generales', 100),
  ];
}
