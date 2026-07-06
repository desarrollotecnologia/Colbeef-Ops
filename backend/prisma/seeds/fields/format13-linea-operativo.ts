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
        {
          key: 'izado',
          label: 'TIEMPO DE IZADO\nParámetro establecido (< 1:30 minutos)',
          slotCount: 5,
        },
        {
          key: 'sangria',
          label: 'TIEMPO DE SANGRIA\nParámetro establecido (> a 2 minutos)',
          slotCount: 5,
        },
        {
          key: 'evisceracion',
          label: 'TIEMPO DE EVISCERACION\nParámetro establecido (< a 30 minutos)',
          slotCount: 5,
        },
      ],
      10,
      'Condiciones del proceso',
      {
        valorLabel: 'Valores minutos',
        aspectRows: true,
        monitoreoVariant: 'tiempos',
        helpText: 'Turno monitoreo y minutos — puede agregar más casillas por aspecto',
      }
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
        { key: 'animales_limpios', label: 'INGRESO DE ANIMALES LIMPIOS Y ESCURRIDOS', slotCount: 4 },
        { key: 'anudado_esofago', label: 'ANUDADO DE ESOFAGO', slotCount: 4 },
        { key: 'anudado_recto', label: 'ANUDADO Y EMBOLSADO DE RECTO', slotCount: 4 },
        { key: 'evisceracion', label: 'PROCEDIMIENTO DE EVISCERACION', slotCount: 4 },
      ],
      20,
      'Condiciones del proceso',
      {
        aspectRows: true,
        monitoreoVariant: 'sanitario',
        helpText: 'Check list: C cumple · NC no cumple',
      }
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
        { key: 'lavado', label: 'CONDICIONES DE LAVADO DE CANALES', slotCount: 3 },
        { key: 'desinfeccion', label: 'CONDICIONES DE DESINFECCION DE LAS CANALES', slotCount: 2 },
        { key: 'manipulacion', label: 'CONDICIONES DE MANIPULACION DEL PRODUCTO', slotCount: 2 },
      ],
      30,
      'Condiciones de lavado',
      {
        aspectRows: true,
        monitoreoVariant: 'lavado',
      }
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
      [
        {
          key: 'temp_cava',
          label: 'TEMPERATURA CANAL AL INGRESO A CUARTO FRIO',
          slotCount: 3,
        },
      ],
      40,
      'Temperaturas',
      {
        valorLabel: 'Valores encontrados',
        aspectRows: true,
        monitoreoVariant: 'temperatura',
      }
    ),
    repeaterField('linea_temperatura_adicionales', 'Temperaturas adicionales', MONITOREO_VALOR_COLS, 41, {
      groupName: 'Temperaturas',
      minRows: 0,
      maxRows: 20,
    }),
    textField('linea_observaciones', 'Observaciones generales', 50, { groupName: 'Cierre' }),
  ];
}
