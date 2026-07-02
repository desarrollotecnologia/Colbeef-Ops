import {
  FieldDef,
  DAY_SCHEDULE_PUNTOS_ESTERILIZADORES,
  DAY_SCHEDULE_PUNTOS_INSPECCIONADOS,
  dayScheduleTableField,
  formalMeasureTableField,
  repeaterField,
  textField,
} from '../field-helpers';

const MONITOREO_EXTRA_COLS: FieldDef[] = [
  { fieldKey: 'turno', label: 'Turno monitoreo', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true },
  { fieldKey: 'aspecto', label: 'Aspecto a verificar', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
  {
    fieldKey: 'cnc',
    label: 'C/NC',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 2,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['C', 'NC'] },
  },
  { fieldKey: 'observation', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 3, manualOnly: true },
  { fieldKey: 'corrective', label: 'Acción correctiva', fieldType: 'TEXT' as const, sortOrder: 4, manualOnly: true },
];

const MONITOREO_VALOR_COLS: FieldDef[] = [
  { fieldKey: 'turno', label: 'Turno monitoreo', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true },
  { fieldKey: 'valor', label: 'Valor encontrado', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true },
  {
    fieldKey: 'cnc',
    label: 'C/NC',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 2,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['C', 'NC'] },
  },
  { fieldKey: 'observation', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 3, manualOnly: true },
  { fieldKey: 'corrective', label: 'Acción correctiva', fieldType: 'TEXT' as const, sortOrder: 4, manualOnly: true },
];

export function getFormat13Fields(_slug: string) {
  return [
    dayScheduleTableField(
      'linea_cloro_registros',
      'Control cloro residual',
      DAY_SCHEDULE_PUNTOS_INSPECCIONADOS,
      1,
      'Control cloro',
      'cloro'
    ),
    dayScheduleTableField(
      'linea_esterilizadores_registros',
      'Esterilizadores',
      DAY_SCHEDULE_PUNTOS_ESTERILIZADORES,
      2,
      'Esterilizadores',
      'esterilizadores'
    ),
    formalMeasureTableField(
      'linea_tiempos_proceso',
      'Tiempos de proceso',
      'monitoreo',
      [
        { key: 'izado', label: 'Tiempo de izado (< 1:30 min)' },
        { key: 'sangria', label: 'Tiempo de sangría (> 2 min)' },
        { key: 'evisceracion', label: 'Tiempo de evisceración (< 30 min)' },
      ],
      10,
      'Condiciones del proceso',
      { valorLabel: 'Minutos', helpText: 'Parámetros establecidos según procedimiento' }
    ),
    repeaterField('linea_tiempos_adicionales', 'Tiempos adicionales', MONITOREO_VALOR_COLS, 11, {
      groupName: 'Condiciones del proceso',
      minRows: 0,
      maxRows: 20,
      helpText: 'Agregar filas si requiere más puntos de monitoreo',
    }),
    formalMeasureTableField(
      'linea_condiciones_sanitarias',
      'Condiciones sanitarias del proceso',
      'monitoreo',
      [
        { key: 'animales_limpios', label: 'Ingreso de animales limpios y escurridos' },
        { key: 'anudado_esofago', label: 'Anudado de esófago' },
        { key: 'anudado_recto', label: 'Anudado y embolsado de recto' },
        { key: 'evisceracion', label: 'Procedimiento de evisceración' },
      ],
      20,
      'Condiciones del proceso',
      { valorLabel: 'Turno / nota' }
    ),
    repeaterField('linea_sanitarias_adicionales', 'Aspectos sanitarios adicionales', MONITOREO_EXTRA_COLS, 21, {
      groupName: 'Condiciones del proceso',
      minRows: 0,
      maxRows: 20,
    }),
    formalMeasureTableField(
      'linea_lavado_canales',
      'Lavado y manipulación',
      'monitoreo',
      [
        { key: 'lavado', label: 'Condiciones de lavado de canales' },
        { key: 'desinfeccion', label: 'Condiciones de desinfección de las canales' },
        { key: 'manipulacion', label: 'Condiciones de manipulación del producto' },
      ],
      30,
      'Condiciones de lavado',
      { valorLabel: 'Turno / nota' }
    ),
    repeaterField('linea_lavado_adicionales', 'Aspectos de lavado adicionales', MONITOREO_EXTRA_COLS, 31, {
      groupName: 'Condiciones de lavado',
      minRows: 0,
      maxRows: 20,
    }),
    formalMeasureTableField(
      'linea_temperatura_canal',
      'Temperatura canal al ingreso a cuarto frío',
      'monitoreo',
      [{ key: 'temp_cava', label: 'Temperatura canal al ingreso a cuarto frío' }],
      40,
      'Temperaturas',
      { valorLabel: '°C' }
    ),
    repeaterField('linea_temperatura_adicionales', 'Temperaturas adicionales', MONITOREO_VALOR_COLS, 41, {
      groupName: 'Temperaturas',
      minRows: 0,
      maxRows: 20,
    }),
    textField('linea_observaciones', 'Observaciones generales', 50, { groupName: 'Cierre' }),
  ];
}
