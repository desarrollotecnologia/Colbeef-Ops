import {
  FieldDef,
  dateField,
  repeaterField,
  selectField,
  textField,
  textareaField,
} from '../field-helpers';

const DEVOLUCION_COLS: FieldDef[] = [
  { fieldKey: 'cliente', label: 'Cliente', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true, required: true },
  { fieldKey: 'unidades', label: 'Unidades', fieldType: 'NUMBER' as const, sortOrder: 1, manualOnly: true, required: true },
  { fieldKey: 'corte', label: 'Corte', fieldType: 'TEXT' as const, sortOrder: 2, manualOnly: true, required: true },
  { fieldKey: 'lote', label: 'Lote', fieldType: 'TEXT' as const, sortOrder: 3, manualOnly: true, required: true },
  { fieldKey: 'fecha_produccion', label: 'Fecha de producción', fieldType: 'DATE' as const, sortOrder: 4, manualOnly: true, required: true },
  { fieldKey: 'fecha_vencimiento', label: 'Fecha de vencimiento', fieldType: 'DATE' as const, sortOrder: 5, manualOnly: true, required: true },
];

export function getFormat11Fields(_slug: string): FieldDef[] {
  return [
    textField('motivo', 'Motivo de la devolución', 1, { required: true, groupName: 'Encabezado' }),
    dateField('fecha_despacho', 'Fecha de despacho', 2, { required: true, groupName: 'Encabezado' }),
    textField('destino', 'Destino del producto', 3, { required: true, groupName: 'Encabezado' }),
    textField('condicion_producto', 'Condición del producto', 4, { required: true, groupName: 'Encabezado' }),
    selectField(
      'tipo_empaque',
      'Tipo de empaque',
      ['Granel', 'Vacío', 'Termoformado'],
      5,
      { required: true, groupName: 'Encabezado' }
    ),
    repeaterField('registros', 'Productos devueltos', DEVOLUCION_COLS, 10, { minRows: 1, maxRows: 30, groupName: 'Registros' }),
    textareaField('observaciones', 'Observaciones', 20),
  ];
}
