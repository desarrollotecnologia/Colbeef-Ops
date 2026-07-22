import {
  FieldDef,
  cncField,
  dateField,
  multiSelectField,
  numberField,
  repeaterField,
  textField,
  timeField,
  textareaField,
  ESPECIES,
} from '../field-helpers';

/** Columnas alineadas al Excel: Empaque (Vacío/Granel C-NC-NA) + Temperatura (Refr/Cong). */
const PRODUCTO_COLS: FieldDef[] = [
  { fieldKey: 'producto', label: 'Producto', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'lote', label: 'Lote', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
  { fieldKey: 'fecha_produccion', label: 'Fecha producción', fieldType: 'DATE' as const, sortOrder: 2, manualOnly: true, required: true },
  { fieldKey: 'fecha_vencimiento', label: 'Fecha de vencimiento', fieldType: 'DATE' as const, sortOrder: 3, manualOnly: true, required: true },
  {
    fieldKey: 'empaque_vacio',
    label: 'Vacío',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 4,
    manualOnly: true,
    groupName: 'Empaque',
    options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] },
    required: true,
  },
  {
    fieldKey: 'empaque_granel',
    label: 'Granel',
    fieldType: 'CHECKLIST' as const,
    sortOrder: 5,
    manualOnly: true,
    groupName: 'Empaque',
    options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] },
    required: true,
  },
  {
    fieldKey: 'temp_refr',
    label: 'Refr. (0 – 4 °C)',
    fieldType: 'NUMBER' as const,
    sortOrder: 6,
    manualOnly: true,
    groupName: 'Temperatura',
    required: true,
  },
  {
    fieldKey: 'temp_cong',
    label: 'Cong. (-18 °C)',
    fieldType: 'NUMBER' as const,
    sortOrder: 7,
    manualOnly: true,
    groupName: 'Temperatura',
    required: true,
  },
  { fieldKey: 'observaciones', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 8, manualOnly: true },
  { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 9, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

const GROUP = 'Despacho';

export function getFormat3Fields(_slug: string): FieldDef[] {
  return [
    multiSelectField('especie', 'Especie', ESPECIES, 1, { required: true, groupName: GROUP }),
    dateField('fecha', 'Fecha', 2, { required: true, groupName: GROUP }),
    timeField('hora', 'Hora', 3, { required: true, groupName: GROUP }),
    textField('destino', 'Destino', 4, { required: true, groupName: GROUP }),
    textField('conductor', 'Nombre del conductor', 5, { required: true, groupName: GROUP }),
    textField('placa', 'Placa', 6, { required: true, groupName: GROUP }),
    numberField('temp_vehiculo', 'T°C vehículo', 7, { required: true, groupName: GROUP }),
    cncField('limpieza_vehiculo', 'Limpieza del vehículo', 8, { required: true, groupName: GROUP }),
    cncField('desinfeccion_vehiculo', 'Desinfección del vehículo', 9, { required: true, groupName: GROUP }),
    textareaField('observaciones_encabezado', 'Observaciones', 10, { groupName: GROUP }),
    repeaterField('productos', 'Productos despachados', PRODUCTO_COLS, 20, { minRows: 1, maxRows: 30, groupName: GROUP }),
  ];
}
