import {
  FieldDef,
  cncField,
  dateField,
  multiSelectField,
  numberField,
  repeaterField,
  selectField,
  textField,
  timeField,
  textareaField,
  ESPECIES,
} from '../field-helpers';

const PRODUCTO_COLS: FieldDef[] = [
  { fieldKey: 'producto', label: 'Producto', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'lote', label: 'Lote', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true, required: true },
  { fieldKey: 'fecha_produccion', label: 'Fecha producción', fieldType: 'DATE' as const, sortOrder: 2, manualOnly: true, required: true },
  { fieldKey: 'fecha_vencimiento', label: 'Fecha vencimiento', fieldType: 'DATE' as const, sortOrder: 3, manualOnly: true, required: true },
  { fieldKey: 'empaque', label: 'Tipo empaque', fieldType: 'SELECT' as const, sortOrder: 4, manualOnly: true, options: { choices: ['Vacío', 'Granel'] }, required: true },
  { fieldKey: 'estado_empaque', label: 'Estado empaque C/NC', fieldType: 'CHECKLIST' as const, sortOrder: 5, manualOnly: true, options: { mode: 'cnc', choices: ['C', 'NC'] }, required: true },
  { fieldKey: 'temperatura', label: 'Temperatura producto', fieldType: 'NUMBER' as const, sortOrder: 6, manualOnly: true, required: true },
  { fieldKey: 'observaciones', label: 'Observaciones', fieldType: 'TEXT' as const, sortOrder: 7, manualOnly: true },
  { fieldKey: 'correccion', label: 'Corrección', fieldType: 'TEXT' as const, sortOrder: 8, manualOnly: true, config: { requiredIf: 'nc_or_observation' } },
];

export function getFormat3Fields(_slug: string): FieldDef[] {
  return [
    multiSelectField('especie', 'Especie', ESPECIES, 1, { required: true }),
    dateField('fecha', 'Fecha', 2, { required: true }),
    timeField('hora', 'Hora', 3, { required: true }),
    textField('destino', 'Destino', 4, { required: true }),
    textField('conductor', 'Nombre del conductor', 5, { required: true }),
    textField('placa', 'Placa', 6, { required: true }),
    numberField('temp_vehiculo', 'T°C vehículo', 7, { required: true }),
    cncField('limpieza_vehiculo', 'Limpieza del vehículo', 8, { required: true }),
    cncField('desinfeccion_vehiculo', 'Desinfección del vehículo', 9, { required: true }),
    textareaField('observaciones_encabezado', 'Observaciones', 10),
    repeaterField('productos', 'Productos despachados', PRODUCTO_COLS, 20, { minRows: 1, maxRows: 30 }),
  ];
}
