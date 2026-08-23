import {
  FieldDef,
  dateField,
  repeaterField,
  selectField,
  textField,
  textareaField,
  timeField,
} from '../field-helpers';

const VOLUMEN_CHOICES = ['2.2', '2.3'];

const BASE_COLS: FieldDef[] = [
  dateField('fecha', 'Fecha', 0, { required: true }),
  timeField('hora', 'Hora', 1, { required: true }),
  selectField('volumen_naoh', 'Volumen de NaOH utilizado (2,2 - 2,3 ml)', VOLUMEN_CHOICES, 2, {
    required: true,
  }),
  textField('concentracion', 'Concentración de la solución desinfectante (2% ± 0,1)', 3, {
    required: true,
    helpText: 'Automático según volumen (fórmula V × N × #eq × 100)',
  }),
  {
    fieldKey: 'cumple',
    label: 'Cumple',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 4,
    manualOnly: true,
    required: true,
    options: { mode: 'mark', choices: ['C'] },
    helpText: 'Marcar solo Cumple o No cumple',
  },
  {
    fieldKey: 'no_cumple',
    label: 'No cumple',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 5,
    manualOnly: true,
    required: true,
    options: { mode: 'mark', choices: ['NC'] },
  },
  textareaField('correccion', 'Corrección', 6, {
    config: { requiredIf: 'nc_or_observation' },
  }),
];

const FORMULA_HELP =
  'Fórmula: % Ácido láctico = V × N × #eq × 100. Constantes: N = 0,1 y #eq = 0,09.';

function ownedRepeater(
  fieldKey: string,
  label: string,
  columns: FieldDef[],
  layout: string,
  helpText: string
): FieldDef {
  const field = repeaterField(fieldKey, label, columns, 1, {
    minRows: 5,
    maxRows: 40,
    groupName: 'Registros',
    helpText,
    required: true,
  });
  return {
    ...field,
    required: true,
    options: {
      ...field.options,
      layout,
      minRows: 5,
      maxRows: 40,
      minFilledRows: 1,
      ownedRows: true,
      addButtonLabel: 'Añadir fila',
      formulaFooter: FORMULA_HELP,
    },
  };
}

export function getFormat18Fields(slug: string): FieldDef[] {
  if (slug === 'monitoreo') {
    const cols: FieldDef[] = [
      ...BASE_COLS,
      {
        fieldKey: 'monitoreo_pcc',
        label: 'Monitoreo PCC',
        fieldType: 'CHECKLIST' as const,
        sortOrder: 7,
        manualOnly: true,
        required: true,
        options: { mode: 'mark', choices: ['X'] },
        helpText: 'Marcar con X',
        groupName: 'Actividad',
      },
      textField('responsable', 'Responsable', 8, {
        required: true,
        helpText: 'Según el usuario que llena la fila',
      }),
      {
        fieldKey: 'verifico_mark',
        label: 'Verificó',
        fieldType: 'CHECKLIST' as const,
        sortOrder: 9,
        manualOnly: true,
        required: true,
        options: { mode: 'mark', choices: ['OK', 'X'] },
        helpText: 'Solo quien inició el formato: ✓ pone su nombre; X indica no conforme',
      },
      textField('verifico_nombre', 'Nombre quien verificó', 10, {
        helpText: 'Automático si marca conforme',
      }),
    ];
    return [
      ownedRepeater(
        'registros',
        'Monitoreo de la titulación de ácido láctico',
        cols,
        'lactico_monitoreo_formato',
        `${FORMULA_HELP} Rango aceptable de concentración: 1,9% a 2,1%.`
      ),
    ];
  }

  // hoja titulacion
  const cols: FieldDef[] = [
    ...BASE_COLS,
    selectField('actividad', 'Actividad', ['Operativo', 'Preoperativo'], 7, {
      required: true,
      helpText: 'Checklist operativo o preoperativo',
      groupName: 'Actividad',
    }),
    textField('responsable', 'Responsable', 8, {
      required: true,
      helpText: 'Según el usuario que llena la fila',
    }),
  ];
  return [
    ownedRepeater(
      'registros',
      'Titulación de ácido láctico',
      cols,
      'lactico_titulacion_formato',
      FORMULA_HELP
    ),
  ];
}
