import {
  FieldDef,
  cncField,
  cncNaField,
  cloroBlock,
  hourlyMatrixField,
  lacticoTitrationField,
  multiSelectField,
  pediluviosBlock,
  photoField,
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

const PRODUCTO_ETIQUETA = (prefix: string, label: string, sort: number): FieldDef[] => [
  selectField(`${prefix}_empaque`, `${label} — Empaque`, ['Vacío', 'Granel'], sort, { groupName: label }),
  cncField(`${prefix}_etiqueta`, `${label} — Etiqueta`, sort + 1, { groupName: label, required: true }),
  cncNaField(`${prefix}_videojet`, `${label} — Video Jet`, sort + 2, { groupName: label }),
  photoField(`${prefix}_foto`, `${label} — Foto etiqueta`, sort + 3, { groupName: label }),
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
        ...cloroBlock(20, 'Control cloro residual (cada 4 horas)', 'lavamanos'),
        ...lacticoTitrationField(30),
        ...pediluviosBlock(40, 3),
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
        timeField('poes_4h_hora', 'Hora — POES cada 4 horas', 30),
        cncField('poes_tablas', 'Tablas (cada 4 h)', 31, { required: true }),
        cncField('poes_sierra', 'Sierra sin fin (cada 4 h)', 32, { required: true }),
        cncField('poes_bandas', 'Bandas 1,2 y recortes (cada 4 h)', 33, { required: true }),
        cncField('poes_delantales', 'Delantales plásticos (cada 4 h)', 34, { required: true }),
        textareaField('poes_4h_correccion', 'Corrección POES 4h', 35, { config: { requiredIf: 'nc_or_observation' } }),
        timeField('poes_1h_hora', 'Hora — POES cada hora', 40),
        cncField('poes_molino', 'Molino (cada hora)', 41, { required: true }),
        cncField('poes_grameras', 'Grameras (cada hora)', 42, { required: true }),
        textareaField('poes_1h_obs', 'Observaciones POES 1h', 43),
        textareaField('poes_1h_correccion', 'Corrección POES 1h', 44, { config: { requiredIf: 'nc_or_observation' } }),
        textareaField('observaciones', 'Observaciones generales', 50),
      ];

    case 'diario-4':
      return [
        repeaterField('poes_manipulador', 'POES operativo manipulador (cada hora)', [
          { fieldKey: 'hora', label: 'Hora', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
          { fieldKey: 'operario', label: 'Operario', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
          { fieldKey: 'guantes', label: 'Guantes', fieldType: 'CHECKLIST' as const, sortOrder: 2, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
          { fieldKey: 'guante_malla', label: 'Guante de malla', fieldType: 'CHECKLIST' as const, sortOrder: 3, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
          { fieldKey: 'cuchillo', label: 'Cuchillo', fieldType: 'CHECKLIST' as const, sortOrder: 4, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
          { fieldKey: 'gancho', label: 'Gancho despostador', fieldType: 'CHECKLIST' as const, sortOrder: 5, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
          { fieldKey: 'soporte_gancho', label: 'Soporte gancho deshuesador', fieldType: 'CHECKLIST' as const, sortOrder: 6, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
          { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 7, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
        ], 1, { minRows: 1, maxRows: 24 }),
        textareaField('observaciones', 'Observaciones', 50),
      ];

    case 'diario-5':
      return [
        textField('lote', 'Lote', 1, { required: true }),
        ...PRODUCTO_ETIQUETA('refri_sin_hueso', 'Producto refrigerado sin hueso', 10),
        ...PRODUCTO_ETIQUETA('refri_con_hueso', 'Producto refrigerado con hueso', 20),
        ...PRODUCTO_ETIQUETA('cong_sin_hueso', 'Producto congelado sin hueso', 30),
        ...PRODUCTO_ETIQUETA('cong_con_hueso', 'Producto congelado con hueso', 40),
        textareaField('observaciones', 'Observaciones', 50),
      ];

    default:
      return [];
  }
}
