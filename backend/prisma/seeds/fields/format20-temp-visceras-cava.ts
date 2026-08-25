import {
  FieldDef,
  dateField,
  numberField,
  repeaterField,
  textField,
  timeField,
} from '../field-helpers';

/**
 * SAI-CAL-F005 — Control de temperatura de víscera roja/blanca en cava.
 * Dos hojas (roja / blanca) con los mismos campos.
 * Cada fila: código + hasta 3 controles (fecha, h. inicio, h. final, T°) + observaciones.
 * Colaborativo: filas con dueño (ownedRows).
 */
const REGISTRO_COLS: FieldDef[] = [
  textField('codigo', 'Código víscera', 0, { required: true }),
  dateField('c1_fecha', 'Fecha', 1, { required: true, groupName: 'T° Control 1' }),
  timeField('c1_hora_inicio', 'H. inicio', 2, { required: true, groupName: 'T° Control 1' }),
  timeField('c1_hora_final', 'H. final', 3, { required: true, groupName: 'T° Control 1' }),
  numberField('c1_temp', 'T°', 4, { required: true, groupName: 'T° Control 1' }),
  dateField('c2_fecha', 'Fecha', 5, { groupName: 'T° Control 2' }),
  timeField('c2_hora_inicio', 'H. inicio', 6, { groupName: 'T° Control 2' }),
  timeField('c2_hora_final', 'H. final', 7, { groupName: 'T° Control 2' }),
  numberField('c2_temp', 'T°', 8, { groupName: 'T° Control 2' }),
  dateField('c3_fecha', 'Fecha', 9, { groupName: 'T° Control 3' }),
  timeField('c3_hora_inicio', 'H. inicio', 10, { groupName: 'T° Control 3' }),
  timeField('c3_hora_final', 'H. final', 11, { groupName: 'T° Control 3' }),
  numberField('c3_temp', 'T°', 12, { groupName: 'T° Control 3' }),
  textField('observaciones', 'Observaciones', 13),
];

function buildFields(codigoLabel: string): FieldDef[] {
  return [
    textField('cava_almacenamiento', 'Cava de almacenamiento', 1, {
      required: true,
      groupName: 'Encabezado',
    }),
    textField('cliente_destino', 'Cliente / destino', 2, {
      required: true,
      groupName: 'Encabezado',
    }),
    {
      ...repeaterField('registros', 'Registros de temperatura', REGISTRO_COLS, 10, {
        minRows: 5,
        maxRows: 40,
        groupName: 'Registros',
        helpText:
          'Cada usuario solo edita sus filas o filas vacías. Inicia con 5 filas; puede añadir más.',
        required: true,
      }),
      options: {
        layout: 'visceras_cava_formato',
        columns: REGISTRO_COLS.map(({ fieldKey: k, label: l, fieldType: t, options, config, required, groupName }) => ({
          key: k,
          label: k === 'codigo' ? codigoLabel : l,
          type: t,
          options,
          config,
          required,
          ...(groupName ? { headerGroup: groupName } : {}),
        })),
        minRows: 5,
        maxRows: 40,
        minFilledRows: 1,
        addButtonLabel: 'Añadir fila',
        ownedRows: true,
        codigoLabel,
      },
    },
  ];
}

export function getFormat20Fields(slug: string): FieldDef[] {
  if (slug === 'viscera-blanca') {
    return buildFields('Código víscera blanca');
  }
  return buildFields('Código víscera roja');
}
