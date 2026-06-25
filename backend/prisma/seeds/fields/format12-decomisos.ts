import {
  FieldDef,
  numberField,
  readonlyField,
  repeaterField,
  selectField,
  textField,
  textareaField,
  ESPECIES,
} from '../field-helpers';

const DECOMISO_COLS: FieldDef[] = [
  { fieldKey: 'nombre_corte', label: 'Nombre del corte', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'unidades', label: 'Unidades decomisadas', fieldType: 'NUMBER' as const, sortOrder: 1, manualOnly: true, required: true },
  { fieldKey: 'hematoma_kg', label: 'Hematoma (kg)', fieldType: 'NUMBER' as const, sortOrder: 2, manualOnly: true, config: { min: 0 } },
  { fieldKey: 'absceso_kg', label: 'Absceso (kg)', fieldType: 'NUMBER' as const, sortOrder: 3, manualOnly: true, config: { min: 0 } },
  { fieldKey: 'fibrosis_kg', label: 'Fibrosis (kg)', fieldType: 'NUMBER' as const, sortOrder: 4, manualOnly: true, config: { min: 0 } },
  { fieldKey: 'vacuna_kg', label: 'Residuos de vacuna (kg)', fieldType: 'NUMBER' as const, sortOrder: 5, manualOnly: true, config: { min: 0 } },
  {
    fieldKey: 'decomiso_parcial',
    label: 'Decomiso parcial',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 6,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['Parcial'] },
  },
  {
    fieldKey: 'decomiso_total',
    label: 'Decomiso total',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 7,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['Total'] },
  },
];

const OBS_FIJAS = 'ANEXO FOTOS EN CORREO ELECTRONICO';

export function getFormat12Fields(_slug: string): FieldDef[] {
  return [
    textField('cliente', 'Cliente', 1, { required: true, groupName: 'Encabezado' }),
    textField('lote', 'Lote', 2, { required: true, groupName: 'Encabezado' }),
    selectField('especie', 'Especie', ESPECIES, 3, { required: true, groupName: 'Encabezado' }),
    numberField('temp_inicio_proceso', 'T°C al inicio de proceso', 4, { groupName: 'Encabezado' }),
    repeaterField('decomisos', 'Registro de decomisos', DECOMISO_COLS, 10, { minRows: 1, maxRows: 50, groupName: 'Decomisos' }),
    readonlyField('observaciones_fijas', 'Observaciones', OBS_FIJAS, 20),
    textareaField('observaciones_adicionales', 'Observaciones adicionales', 21),
  ];
}
