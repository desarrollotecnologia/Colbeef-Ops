import {
  FieldDef,
  dateField,
  repeaterField,
  textField,
  textareaField,
  timeField,
} from '../field-helpers';

/**
 * AC-FR-034 — Control de temperatura y pH de canales.
 * Multi-día, colaborativo (filas con dueño), cualquier colaborador puede entregar.
 */
const REGISTRO_COLS: FieldDef[] = [
  textField('codigo', 'Código', 0, { required: true }),
  textField('temp_c1', 'Control 1', 1, { groupName: 'Temp. almacenamiento' }),
  textField('temp_c2', 'Control 2', 2, { groupName: 'Temp. almacenamiento' }),
  textField('temp_c3', 'Control 3', 3, { groupName: 'Temp. almacenamiento' }),
  textField('temp_c4', 'Control 4', 4, { groupName: 'Temp. almacenamiento' }),
  textField('temp_liberacion', 'T°C liberación', 5, { groupName: 'Liberación' }),
  textField('ph', 'pH', 6, { groupName: 'Liberación' }),
];

export function getFormat21Fields(_slug: string): FieldDef[] {
  return [
    textField('cliente', 'Cliente', 1, { required: true, groupName: 'Encabezado' }),

    textField('c1_cava', 'Cava', 10, { groupName: 'Control 1' }),
    textField('c1_temp_cava', 'T°C cava', 11, { groupName: 'Control 1' }),
    dateField('c1_fecha', 'Fecha', 12, { groupName: 'Control 1' }),
    timeField('c1_hora', 'Hora', 13, { groupName: 'Control 1' }),

    textField('c2_cava', 'Cava', 20, { groupName: 'Control 2' }),
    textField('c2_temp_cava', 'T°C cava', 21, { groupName: 'Control 2' }),
    dateField('c2_fecha', 'Fecha', 22, { groupName: 'Control 2' }),
    timeField('c2_hora', 'Hora', 23, { groupName: 'Control 2' }),

    textField('c3_cava', 'Cava', 30, { groupName: 'Control 3' }),
    textField('c3_temp_cava', 'T°C cava', 31, { groupName: 'Control 3' }),
    dateField('c3_fecha', 'Fecha', 32, { groupName: 'Control 3' }),
    timeField('c3_hora', 'Hora', 33, { groupName: 'Control 3' }),

    textField('c4_cava', 'Cava', 40, { groupName: 'Control 4' }),
    textField('c4_temp_cava', 'T°C cava', 41, { groupName: 'Control 4' }),
    dateField('c4_fecha', 'Fecha', 42, { groupName: 'Control 4' }),
    timeField('c4_hora', 'Hora', 43, { groupName: 'Control 4' }),

    textField('lib_cava', 'Cava', 50, { groupName: 'Liberación de canales' }),
    textField('lib_temp_cava', 'T°C cava', 51, { groupName: 'Liberación de canales' }),
    dateField('lib_fecha', 'Fecha', 52, { groupName: 'Liberación de canales' }),
    timeField('lib_hora', 'Hora', 53, { groupName: 'Liberación de canales' }),

    textField('tiempo_almacenamiento_horas', 'Tiempo de almacenamiento en refrigeración (horas)', 60, {
      groupName: 'Referencia',
      helpText: 'Horas que el producto permanece en refrigeración',
    }),

    {
      ...repeaterField('registros', 'Registro de canales', REGISTRO_COLS, 70, {
        minRows: 5,
        maxRows: 48,
        groupName: 'Canales',
        helpText:
          'Cada usuario solo edita sus filas o filas vacías. Numeración automática. Inicia con 5 filas.',
        required: true,
      }),
      options: {
        layout: 'canales_temp_ph_formato',
        columns: REGISTRO_COLS.map(({ fieldKey: k, label: l, fieldType: t, options, config, required, groupName }) => ({
          key: k,
          label: l,
          type: t,
          options,
          config,
          required,
          ...(groupName ? { headerGroup: groupName } : {}),
        })),
        minRows: 5,
        maxRows: 48,
        minFilledRows: 1,
        addButtonLabel: 'Añadir fila',
        ownedRows: true,
        note: 'Rango temperatura cavas: 0 °C – 4 °C · pH: 5,5 – 5,8 · Despacho T° < 7 °C · Desposte T° < 4 °C',
      },
    },

    textareaField('observaciones_generales', 'Observaciones', 80, {
      groupName: 'Observaciones',
      placeholder: 'Observaciones generales del registro',
    }),
  ];
}
