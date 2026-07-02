import { FieldDef, formalMeasureTableField, repeaterField } from '../field-helpers';

const CODIGO_CNC_COLS: FieldDef[] = [
  { fieldKey: 'aspecto', label: 'Aspecto a verificar', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'codigo', label: 'Código', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true },
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
  { fieldKey: 'responsable', label: 'Operario responsable', fieldType: 'TEXT' as const, sortOrder: 5, manualOnly: true },
];

const BPM_PERSONAL_COLS: FieldDef[] = [
  { fieldKey: 'aspecto', label: 'Aspecto', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'operario', label: 'Nombre del operario', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true },
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

const PROCESO_PARAM_COLS: FieldDef[] = [
  { fieldKey: 'aspecto', label: 'Aspecto a verificar', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'cantidad', label: 'Cantidad de producto', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true },
  { fieldKey: 'tiempo', label: 'Tiempo (min)', fieldType: 'TEXT' as const, sortOrder: 2, manualOnly: true },
  { fieldKey: 'temperatura', label: 'Temperatura (°C)', fieldType: 'TEXT' as const, sortOrder: 3, manualOnly: true },
  {
    fieldKey: 'cnc',
    label: 'C/NC',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 4,
    manualOnly: true,
    options: { mode: 'cnc', choices: ['C', 'NC'] },
  },
  { fieldKey: 'operario', label: 'Operario', fieldType: 'TEXT' as const, sortOrder: 5, manualOnly: true },
  { fieldKey: 'observation', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 6, manualOnly: true },
  { fieldKey: 'corrective', label: 'Acción correctiva', fieldType: 'TEXT' as const, sortOrder: 7, manualOnly: true },
];

function cabezasFields() {
  return [
    repeaterField('pc_op_proceso', 'Proceso — área cabezas', CODIGO_CNC_COLS, 1, {
      groupName: 'Área de cabezas',
      minRows: 2,
      maxRows: 30,
      helpText: 'Lavado cabezas, limpieza de lenguas, etc.',
    }),
    formalMeasureTableField(
      'pc_op_bpm_esterilizadores',
      'Buenas prácticas — T° esterilizadores',
      'monitoreo',
      [{ key: 'esterilizadores', label: 'T° esterilizadores' }],
      10,
      'Buenas prácticas de manufactura',
      { valorLabel: '°C' }
    ),
    repeaterField('pc_op_bpm_personal', 'Buenas prácticas — personal', BPM_PERSONAL_COLS, 11, {
      groupName: 'Buenas prácticas de manufactura',
      minRows: 2,
      maxRows: 20,
      helpText: 'Uso de tapabocas, manejo de utensilios',
    }),
    repeaterField('pc_op_poes', 'POES', BPM_PERSONAL_COLS, 20, {
      groupName: 'POES',
      minRows: 3,
      maxRows: 20,
      helpText: 'Limpieza guillotina, lavado guantes, carro perchero',
    }),
  ];
}

function patasManosFields() {
  return [
    repeaterField('pc_op_proceso', 'Proceso — patas y manos', PROCESO_PARAM_COLS, 1, {
      groupName: 'Área de patas y manos',
      minRows: 2,
      maxRows: 20,
      helpText: 'Pelado (11–14 min a 60–70°C), cocción (5–8 min a 80–90°C)',
    }),
    repeaterField('pc_op_poes', 'POES', BPM_PERSONAL_COLS, 10, {
      groupName: 'POES',
      minRows: 1,
      maxRows: 20,
    }),
    repeaterField('pc_op_bpm_personal', 'Buenas prácticas — personal', BPM_PERSONAL_COLS, 20, {
      groupName: 'Buenas prácticas de manufactura',
      minRows: 2,
      maxRows: 20,
    }),
  ];
}

function viscerasBlancasFields() {
  return [
    repeaterField('pc_op_proceso', 'Proceso — vísceras blancas', PROCESO_PARAM_COLS, 1, {
      groupName: 'Área de vísceras blancas',
      minRows: 7,
      maxRows: 30,
      helpText: 'Tiempos y temperaturas de limpieza y cocción de panzas, librillos, cuajos, chunchullas, canutas',
    }),
    repeaterField('pc_op_bpm_personal', 'Buenas prácticas', BPM_PERSONAL_COLS, 10, {
      groupName: 'Buenas prácticas de manufactura',
      minRows: 2,
      maxRows: 20,
    }),
  ];
}

function viscerasRojasFields() {
  return [
    repeaterField('pc_op_proceso', 'Proceso — vísceras rojas', CODIGO_CNC_COLS, 1, {
      groupName: 'Área de vísceras rojas',
      minRows: 2,
      maxRows: 20,
      helpText: 'Limpieza e inspección del paquete de vísceras',
    }),
    repeaterField('pc_op_poes', 'POES', BPM_PERSONAL_COLS, 10, {
      groupName: 'POES',
      minRows: 1,
      maxRows: 20,
    }),
    formalMeasureTableField(
      'pc_op_bpm_esterilizadores',
      'Buenas prácticas — T° esterilizadores',
      'monitoreo',
      [{ key: 'esterilizadores', label: 'T° esterilizadores' }],
      20,
      'Buenas prácticas de manufactura',
      { valorLabel: '°C' }
    ),
    repeaterField('pc_op_bpm_personal', 'Buenas prácticas — personal', BPM_PERSONAL_COLS, 21, {
      groupName: 'Buenas prácticas de manufactura',
      minRows: 2,
      maxRows: 20,
    }),
  ];
}

export function getFormat14Fields(slug: string) {
  switch (slug) {
    case 'cabezas':
      return cabezasFields();
    case 'patas-manos':
      return patasManosFields();
    case 'visceras-blancas':
      return viscerasBlancasFields();
    case 'visceras-rojas':
      return viscerasRojasFields();
    default:
      return [];
  }
}
