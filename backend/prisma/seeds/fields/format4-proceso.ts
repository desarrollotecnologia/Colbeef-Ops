import {
  FieldDef,
  cncField,
  cncNaField,
  cloroResidualRepeaterField,
  hourlyMatrixField,
  lacticoTitrationRepeaterField,
  multiSelectField,
  formalMeasureTableField,
  photoField,
  cardRepeaterField,
  repeaterField,
  selectField,
  textField,
  timeField,
  textareaField,
  ESPECIES,
} from '../field-helpers';

const TEMP_AREAS = [
  'Sala de desposte', 'Etiquetado y empaque secundario', 'Porcionado', 'Alistamiento o picking',
  'Cuarto de refrigeración # 1', 'Cuarto de congelación # 1', 'Contenedor # 1', 'Contenedor # 2',
  'Contenedor # 3', 'Cava 12',
];

const CORTE_COLS: FieldDef[] = [
  { fieldKey: 'hora', label: 'Hora', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'nombre_corte', label: 'Nombre del corte', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
  { fieldKey: 'lote', label: 'Lote', fieldType: 'TEXT' as const, sortOrder: 2, manualOnly: true, required: true },
  { fieldKey: 'temperatura', label: 'T°C', fieldType: 'NUMBER' as const, sortOrder: 3, manualOnly: true, config: { min: 0, max: 7 }, required: true },
  { fieldKey: 'hallazgos', label: 'Hallazgos', fieldType: 'MULTI_SELECT' as const, sortOrder: 4, manualOnly: true, options: { choices: ['Hematomas', 'Abscesos', 'Vacunas'], multi: true } },
  { fieldKey: 'peso', label: 'Peso', fieldType: 'NUMBER' as const, sortOrder: 5, manualOnly: true },
  { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 6, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

const EMPAQUE_COLS: FieldDef[] = [
  { fieldKey: 'hora', label: 'Hora', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'nombre_corte', label: 'Nombre del corte', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
  { fieldKey: 'lote', label: 'Lote', fieldType: 'TEXT' as const, sortOrder: 2, manualOnly: true, required: true },
  { fieldKey: 'temperatura', label: 'T°C', fieldType: 'NUMBER' as const, sortOrder: 3, manualOnly: true, required: true },
  { fieldKey: 'sellado', label: 'Sellado y presentación', fieldType: 'CHECKLIST' as const, sortOrder: 4, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'info_etiqueta', label: 'Información etiqueta', fieldType: 'CHECKLIST' as const, sortOrder: 5, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'etiqueta_legible', label: 'Etiqueta legible', fieldType: 'CHECKLIST' as const, sortOrder: 6, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'observacion', label: 'Observación', fieldType: 'TEXT' as const, sortOrder: 7, manualOnly: true },
  { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 8, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

const PRODUCTO_ETIQUETA = (
  prefix: string,
  label: string,
  sort: number,
  opts?: { etiquetaNa?: boolean }
): FieldDef[] => [
  selectField(`${prefix}_empaque`, `${label} — Empaque`, ['Vacío', 'Granel'], sort, { groupName: label }),
  opts?.etiquetaNa
    ? cncNaField(`${prefix}_etiqueta`, `${label} — Etiqueta`, sort + 1, { groupName: label, required: true })
    : cncField(`${prefix}_etiqueta`, `${label} — Etiqueta`, sort + 1, { groupName: label, required: true }),
  cncNaField(`${prefix}_videojet`, `${label} — Video Jet`, sort + 2, { groupName: label }),
  photoField(`${prefix}_foto`, `${label} — Fotos etiqueta`, sort + 3, {
    groupName: label,
    options: { multiple: true, maxPhotos: 20 },
  }),
];

const POES_4H_COLS: FieldDef[] = [
  { fieldKey: 'hora', label: 'Hora — POES cada 4 horas', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'tablas', label: 'Tablas (cada 4 h)', fieldType: 'CHECKLIST' as const, sortOrder: 1, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'sierra', label: 'Sierra sin fin (cada 4 h)', fieldType: 'CHECKLIST' as const, sortOrder: 2, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'bandas', label: 'Bandas 1,2 y recortes (cada 4 h)', fieldType: 'CHECKLIST' as const, sortOrder: 3, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'delantales', label: 'Delantales plásticos (cada 4 h)', fieldType: 'CHECKLIST' as const, sortOrder: 4, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'correccion', label: 'Corrección POES 4h', fieldType: 'TEXTAREA' as const, sortOrder: 5, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

const POES_1H_COLS: FieldDef[] = [
  { fieldKey: 'hora', label: 'Hora — POES cada hora', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'molino', label: 'Molino (cada hora)', fieldType: 'CHECKLIST' as const, sortOrder: 1, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'grameras', label: 'Grameras (cada hora)', fieldType: 'CHECKLIST' as const, sortOrder: 2, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'observaciones', label: 'Observaciones POES 1h', fieldType: 'TEXTAREA' as const, sortOrder: 3, manualOnly: true },
  { fieldKey: 'correccion', label: 'Corrección POES 1h', fieldType: 'TEXTAREA' as const, sortOrder: 4, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

export function getFormat4Fields(slug: string): FieldDef[] {
  switch (slug) {
    case 'diario-1':
      return [
        multiSelectField('especie', 'Especie', ESPECIES, 1, { required: true, groupName: 'Diario 1' }),
        hourlyMatrixField('temperaturas_areas', 'Temperaturas de áreas (cada hora)', TEMP_AREAS, 2, {
          showProm: true,
          note: 'La toma se realiza cada hora. PROM = promedio por área.',
          groupName: 'Temperaturas de áreas',
        }),
        cloroResidualRepeaterField(20, 'Control cloro residual (cada 4 horas)'),
        lacticoTitrationRepeaterField(30),
        formalMeasureTableField(
          'pediluvios',
          'Pediluvios',
          'pediluvios',
          [
            { key: 'ped_1', label: 'Pediluvios 1 y 2' },
            { key: 'ped_2', label: 'Pediluvios 1 y 2' },
            { key: 'ped_3', label: 'Pediluvios 1 y 2' },
          ],
          40,
          'Pediluvios',
          { pediluviosLayout: 'operativo' }
        ),
        textareaField('observaciones', 'Observaciones', 60, { groupName: 'Diario 1' }),
      ];

    case 'diario-2':
      return [
        selectField('proceso_despostado', 'Despostado', ['Sí', 'No'], 1),
        selectField('proceso_porcionado', 'Porcionado', ['Sí', 'No'], 2),
        repeaterField('inspeccion_cortes', 'Inspección producto en proceso (2 cortes/hora)', CORTE_COLS, 10, {
          minRows: 2,
          maxRows: 48,
          helpText: 'Registrar 2 cortes por hora. Espacio para procesos superiores a 12 horas.',
        }),
        textareaField('observaciones', 'Observaciones', 100),
      ];

    case 'diario-3':
      return [
        repeaterField('condiciones_empaque', 'Condiciones de empaque', EMPAQUE_COLS, 1, { minRows: 1, maxRows: 24 }),
        cardRepeaterField('poes_equipos_4h', 'POES equipos — cada 4 horas', POES_4H_COLS, 30, {
          required: true,
          minRows: 1,
          maxRows: 12,
        }),
        cardRepeaterField('poes_operativos_1h', 'POES operativos — cada hora', POES_1H_COLS, 40, {
          required: true,
          minRows: 1,
          maxRows: 24,
        }),
        textareaField('observaciones', 'Observaciones generales', 50),
      ];

    case 'diario-4':
      return [
        textField('lote', 'Lote', 1, { required: true }),
        ...PRODUCTO_ETIQUETA('refri_sin_hueso', 'Producto refrigerado sin hueso', 10),
        ...PRODUCTO_ETIQUETA('refri_con_hueso', 'Producto refrigerado con hueso', 20),
        ...PRODUCTO_ETIQUETA('cong_sin_hueso', 'Producto congelado sin hueso', 30, { etiquetaNa: true }),
        ...PRODUCTO_ETIQUETA('cong_con_hueso', 'Producto congelado con hueso', 40, { etiquetaNa: true }),
        textareaField('observaciones', 'Observaciones', 50),
      ];

    case 'diario-5':
      return [
        repeaterField('poes_manipulador', 'POES operativo manipulador (cada hora)', [
          { fieldKey: 'hora', label: 'Hora', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
          { fieldKey: 'operario', label: 'Operario', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
          { fieldKey: 'guantes', label: 'Guantes', fieldType: 'CHECKLIST' as const, sortOrder: 2, manualOnly: true, options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] }, required: true },
          { fieldKey: 'guante_malla', label: 'Guante de malla', fieldType: 'CHECKLIST' as const, sortOrder: 3, manualOnly: true, options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] }, required: true },
          { fieldKey: 'cuchillo', label: 'Cuchillo', fieldType: 'CHECKLIST' as const, sortOrder: 4, manualOnly: true, options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] }, required: true },
          { fieldKey: 'gancho', label: 'Gancho despostador', fieldType: 'CHECKLIST' as const, sortOrder: 5, manualOnly: true, options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] }, required: true },
          { fieldKey: 'soporte_gancho', label: 'Soporte gancho deshuesador', fieldType: 'CHECKLIST' as const, sortOrder: 6, manualOnly: true, options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] }, required: true },
          { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 7, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
        ], 1, { minRows: 1, maxRows: 24 }),
        textareaField('observaciones', 'Observaciones', 50),
      ];

    default:
      return [];
  }
}
