import {
  FieldDef,
  cncField,
  dateField,
  multiSelectField,
  numberField,
  readonlyField,
  repeaterField,
  selectField,
  textField,
  textareaField,
  HALLAZGOS_FORANEAS,
  ESPECIES,
} from '../field-helpers';

const CANAL_COLS: FieldDef[] = [
  { fieldKey: 'codigo', label: 'Código de canal', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'ph', label: 'pH', fieldType: 'NUMBER' as const, sortOrder: 1, manualOnly: true, config: { min: 5.4, max: 5.8 }, required: true },
  { fieldKey: 'ph_cnc', label: 'pH C/NC', fieldType: 'CHECKLIST' as const, sortOrder: 2, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'temp', label: 'T°C', fieldType: 'NUMBER' as const, sortOrder: 3, manualOnly: true, config: { min: 0, max: 4 }, required: true },
  { fieldKey: 'temp_cnc', label: 'T°C C/NC', fieldType: 'CHECKLIST' as const, sortOrder: 4, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'hallazgos', label: 'Hallazgos', fieldType: 'MULTI_SELECT' as const, sortOrder: 5, manualOnly: true, options: { choices: HALLAZGOS_FORANEAS, multi: true } },
  { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 6, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

const OBSERVACIONES_FIJAS =
  'Inspección según especie: Cuartos bovinos 10% - Canales porcinas 10%. CR: Contenido Ruminal · MF: Materia Fecal · LV: Leche Visible · HM: Hematomas · GS: Grasa/Suero';

export function getFormat5Fields(_slug: string): FieldDef[] {
  return [
    cncField('desinfeccion_canales', 'Desinfección de canales', 1, { required: true }),
    cncField('concentracion_acido', 'Concentración ácido láctico', 2, { required: true }),
    textField('placa_vehiculo', 'Placa del vehículo', 3, { required: true }),
    numberField('temp_vehiculo', 'T°C vehículo', 4, { required: true }),
    numberField('cantidad_canales', 'Cantidad de canales', 5, { required: true }),
    dateField('fecha_beneficio', 'Fecha de beneficio', 6, { required: true }),
    textField('cliente', 'Cliente', 7, { required: true }),
    selectField('especie', 'Especie', ESPECIES, 8, { required: true }),
    textField('lote', 'Lote N°', 9, { required: true }),
    repeaterField('inspeccion_canales', 'Inspección de canales', CANAL_COLS, 10, { minRows: 1, maxRows: 30 }),
    dateField('fecha_desposte', 'Fecha de desposte', 40, { groupName: 'Inspección durante desposte' }),
    textField('cava_almacenamiento', 'Cava de almacenamiento', 41, { groupName: 'Inspección durante desposte' }),
    numberField('temp_rango', 'T° (0° - 4° C)', 42, { groupName: 'Inspección durante desposte', min: 0, max: 4 }),
    numberField('temp_promedio', 'Temperatura promedio', 43, { groupName: 'Inspección durante desposte', min: 0, max: 4 }),
    numberField('ph_promedio', 'pH promedio', 44, { groupName: 'Inspección durante desposte', min: 5.4, max: 5.8 }),
    textField('lote_asignado', 'Lote asignado N°', 45, { groupName: 'Inspección durante desposte' }),
    readonlyField('observaciones_fijas', 'Observaciones (texto fijo)', OBSERVACIONES_FIJAS, 50),
    textareaField('observaciones', 'Observaciones adicionales', 51),
  ];
}
