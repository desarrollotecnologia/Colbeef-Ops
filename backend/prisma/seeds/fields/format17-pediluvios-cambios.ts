import {
  FieldDef,
  dateField,
  numberField,
  repeaterField,
  selectField,
  textField,
  timeField,
} from '../field-helpers';

/**
 * LD-FR-004 — Registro y control de desinfectantes en pediluvio.
 * Indicaciones del Excel/Word convertidas a campos fáciles:
 * - N° pediluvios: fijo 2
 * - Responsable: usuario que llena la fila
 * - Observaciones: checklist Operativo / Preoperativo
 */
const REGISTRO_COLS: FieldDef[] = [
  dateField('fecha', 'Fecha', 0, { required: true }),
  timeField('hora', 'Hora', 1, { required: true }),
  textField('desinfectante', 'Desinfectante', 2, { required: true }),
  numberField('concentracion_ppm', 'Concentración (ppm)', 3, {
    required: true,
    config: { min: 0 },
  }),
  {
    fieldKey: 'num_pediluvios',
    label: 'N° pediluvios',
    fieldType: 'NUMBER' as const,
    sortOrder: 4,
    manualOnly: false,
    required: true,
    defaultValue: '2',
    helpText: 'Automático: 2',
  },
  textField('responsable', 'Responsable', 5, {
    required: true,
    helpText: 'Según el usuario que llena la fila',
  }),
  selectField('observaciones', 'Observaciones', ['Operativo', 'Preoperativo'], 6, {
    required: true,
    helpText: 'Checklist operativo o preoperativo',
  }),
];

export function getFormat17Fields(_slug: string): FieldDef[] {
  return [
    repeaterField('registros', 'Registro de cambios de pediluvios', REGISTRO_COLS, 1, {
      minRows: 5,
      maxRows: 60,
      groupName: 'Registros',
      helpText:
        'Cada usuario solo edita sus filas. Inicia con 5 filas; puede agregar más según los días de la semana.',
    }),
  ].map((field) => {
    if (field.fieldKey !== 'registros') return field;
    return {
      ...field,
      required: true,
      options: {
        ...field.options,
        layout: 'pediluvios_cambios_repeater',
        minRows: 5,
        maxRows: 60,
        minFilledRows: 1,
        addButtonLabel: 'Añadir fila',
        ownedRows: true,
      },
    };
  });
}
