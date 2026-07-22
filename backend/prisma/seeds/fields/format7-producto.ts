import { FieldType } from '@prisma/client';
import {
  FieldDef,
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

/** Campos de cada registro dentro de un lote (el número de lote va en el bloque padre). */
function registroColumns(areas: string[]): FieldDef[] {
  return [
    multiSelectField('area', 'Área', areas, 0, { required: true }),
    textField('producto', 'Producto', 1, { required: true }),
    dateField('fecha_produccion', 'Fecha de producción', 2, { required: true }),
    dateField('fecha_vencimiento', 'Fecha de vencimiento', 3, { required: true }),
    numberField('temperatura', 'Temperatura', 4, { required: true }),
    timeField('hora', 'Hora', 5, { required: true }),
    selectField('tipo_empaque', 'Tipo de empaque', ['Vacío', 'Granel'], 6, { required: true }),
    cncField('estado_empaque', 'Estado de empaque', 7, { required: true }),
    cncField('etiqueta', 'Etiqueta', 8, { required: true }),
    textareaField('observaciones', 'Observaciones', 9),
  ];
}

export function getFormat7Fields(slug: string): FieldDef[] {
  const areas = slug === 'congelado' ? AREAS_CONG : AREAS_REFRIG;
  const columns = registroColumns(areas);

  return [
    {
      fieldKey: 'lotes',
      label: 'Lotes',
      fieldType: FieldType.REPEATER,
      manualOnly: true,
      sortOrder: 1,
      required: true,
      helpText: 'Hay 4 lotes. Dentro de cada lote puede agregar más registros con la misma estructura.',
      options: {
        layout: 'producto_terminado_lotes',
        minLotes: 4,
        maxLotes: 4,
        minRegistros: 1,
        maxRegistros: 20,
        columns: columns.map(({ fieldKey: k, label: l, fieldType: t, options, config, required }) => ({
          key: k,
          label: l,
          type: t,
          options,
          config,
          required,
        })),
      },
    },
    textareaField('observaciones_generales', 'Observaciones generales', 100),
  ];
}
