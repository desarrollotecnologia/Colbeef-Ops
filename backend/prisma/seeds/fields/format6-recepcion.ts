import {
  FieldDef,
  cncField,
  dateField,
  numberField,
  repeaterField,
  selectField,
  textField,
  textareaField,
  HALLAZGOS_DESPOSTE,
  ESPECIES,
} from '../field-helpers';

const CANAL_COLS: FieldDef[] = [
  { fieldKey: 'codigo', label: 'Código cuarto de canal', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'ph', label: 'pH', fieldType: 'NUMBER' as const, sortOrder: 1, manualOnly: true, config: { min: 5.4, max: 5.7 }, required: true },
  { fieldKey: 'ph_cnc', label: 'pH C/NC', fieldType: 'CHECKLIST' as const, sortOrder: 2, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'temp', label: 'T°C cuarto canal', fieldType: 'NUMBER' as const, sortOrder: 3, manualOnly: true, config: { min: 0, max: 4 }, required: true },
  { fieldKey: 'temp_cnc', label: 'T°C C/NC', fieldType: 'CHECKLIST' as const, sortOrder: 4, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'hallazgos', label: 'Hallazgos', fieldType: 'MULTI_SELECT' as const, sortOrder: 5, manualOnly: true, options: { choices: HALLAZGOS_DESPOSTE, multi: true } },
  { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 6, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

export function getFormat6Fields(_slug: string): FieldDef[] {
  return [
    textField('cava_almacenamiento', 'Cava de almacenamiento', 1, { required: true }),
    cncField('temp_cava_cnc', 'T°C cava — C/NC', 2, { required: true }),
    numberField('cantidad_canales', 'Cantidad de canales', 3, { required: true }),
    selectField('especie', 'Especie', ESPECIES, 4, { required: true }),
    dateField('fecha_beneficio', 'Fecha de beneficio', 5, { required: true }),
    textField('cliente', 'Cliente', 6, { required: true }),
    textField('lote', 'Lote N°', 7, { required: true }),
    repeaterField('inspeccion_canales', 'Inspección por código de canal', CANAL_COLS, 10, { minRows: 1, maxRows: 30 }),
    textareaField('observaciones', 'Observaciones', 50),
  ];
}
