import { FieldDef, cardRepeaterField } from '../field-helpers';

const CALIBRACION_COLS: FieldDef[] = [
  { fieldKey: 'hora', label: 'Hora', fieldType: 'TIME' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'ph_7', label: 'pH (7,0)', fieldType: 'NUMBER' as const, sortOrder: 1, manualOnly: true, required: true },
  {
    fieldKey: 'ph_7_cnc',
    label: 'pH 7,0 — C / NC',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 2,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['C', 'NC'] },
    required: true,
  },
  { fieldKey: 'ph_7_correccion', label: 'Corrección pH 7,0', fieldType: 'TEXTAREA' as const, sortOrder: 3, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
  { fieldKey: 'ph_4', label: 'pH (4,0)', fieldType: 'NUMBER' as const, sortOrder: 4, manualOnly: true, required: true },
  {
    fieldKey: 'ph_4_cnc',
    label: 'pH 4,0 — C / NC',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 5,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['C', 'NC'] },
    required: true,
  },
  { fieldKey: 'ph_4_correccion', label: 'Corrección pH 4,0', fieldType: 'TEXTAREA' as const, sortOrder: 6, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
  { fieldKey: 'observaciones', label: 'Observaciones', fieldType: 'TEXTAREA' as const, sortOrder: 7, manualOnly: true },
];

export function getFormat9Fields(_slug: string): FieldDef[] {
  return [
    cardRepeaterField('calibraciones', 'Registro de calibración', CALIBRACION_COLS, 1, {
      required: true,
      minRows: 1,
      maxRows: 12,
      entryLabel: 'Calibración',
      addButtonLabel: 'Agregar calibración',
    }),
  ];
}
