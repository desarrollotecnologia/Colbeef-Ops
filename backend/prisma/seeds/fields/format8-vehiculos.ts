import {
  FieldDef,
  cncField,
  itemChecklistField,
  numberField,
  repeaterField,
  textField,
  timeField,
  textareaField,
} from '../field-helpers';

const VEHICLE_ITEMS: { key: string; label: string; section: string }[] = [
  { key: 'v_1_1', label: 'Seguro obligatorio', section: '1. Documentos obligatorios' },
  { key: 'v_1_2', label: 'Afiliación a empresa de transporte (Si aplica)', section: '1. Documentos obligatorios' },
  { key: 'v_1_3', label: 'Revisión tecnicomecánica', section: '1. Documentos obligatorios' },
  { key: 'v_1_4', label: 'Licencia de conducción', section: '1. Documentos obligatorios' },
  { key: 'v_1_5', label: 'ARP del conductor', section: '1. Documentos obligatorios' },
  { key: 'v_1_6', label: 'Certificado Sanitario (Anual)', section: '1. Documentos obligatorios' },
  { key: 'v_2_1', label: 'Leyenda indicando transporte de alimentos', section: '2. Exterior del vehículo' },
  { key: 'v_3_1', label: 'Porta gato, cruceta, banderas o conos, tacos, guantes y herramienta básica', section: '3. Herramientas y seguridad' },
  { key: 'v_3_2', label: 'Porta extintor en buen estado y con carga vigente', section: '3. Herramientas y seguridad' },
  { key: 'v_3_3', label: 'Porta botiquín dotado', section: '3. Herramientas y seguridad' },
  { key: 'v_4_1', label: 'Pisos', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_2', label: 'Paredes', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_3', label: 'Hermeticidad en techo', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_4', label: 'Hermeticidad en puertas', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_5', label: 'Tener tendido plástico y/o estibas', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_6', label: 'Libre de objetos extraños en carrocería', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_7', label: 'Ausencia de plagas vivas o muertas', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_8', label: 'Ausencia de grasa', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_9', label: 'Ausencia de olores fuertes y extraños', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_10', label: 'Ausencia de suciedad en piso y paredes internas', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_11', label: 'Temperatura', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_4_12', label: 'Ausencia de materiales de contaminación cruzada', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_5_12', label: 'Estado de las gancheras', section: '4. Requisitos físicos y sanitarios' },
  { key: 'v_5_13', label: 'Aplicación de desinfectante previa al cargue (Ácido láctico 2±0,1%)', section: '4. Requisitos físicos y sanitarios' },
];

const CARGA_COLS: FieldDef[] = [
  { fieldKey: 'cantidad', label: 'Cantidad', fieldType: 'TEXT' as const, sortOrder: 0, manualOnly: true },
  { fieldKey: 'producto', label: 'Producto', fieldType: 'TEXT' as const, sortOrder: 1, manualOnly: true },
];

export function getFormat8Fields(_slug: string): FieldDef[] {
  return [
    timeField('hora', 'Hora', 1, { required: true, groupName: 'Encabezado' }),
    textField('placa', 'Placa del vehículo', 2, { required: true, groupName: 'Encabezado' }),
    textField('conductor', 'Nombre del conductor', 3, { required: true, groupName: 'Encabezado' }),
    textField('documento', 'Documento identificación', 4, { required: true, groupName: 'Encabezado' }),
    textField('destino', 'Destino', 5, { required: true, groupName: 'Encabezado' }),
    numberField('temp_vehiculo', 'Temperatura del vehículo', 6, { groupName: 'Encabezado' }),
    numberField('temp_producto', 'Temperatura del producto', 7, { groupName: 'Encabezado' }),
    cncField('desinfeccion_vehiculo', 'Desinfección de vehículo', 8, { required: true, groupName: 'Encabezado' }),
    repeaterField('carga_productos', 'Carga del vehículo', CARGA_COLS, 10, {
      minRows: 1,
      maxRows: 10,
      groupName: 'Carga',
    }),
    itemChecklistField('inspeccion_items', 'Aspectos a verificar', VEHICLE_ITEMS, 20, {
      mode: 'cnc_na',
      columns: ['cnc', 'observation'],
      required: true,
    }),
    textField('resp_revision_nombre', 'Responsable revisión — Nombre', 30, { groupName: 'Firmas' }),
    textField('resp_revision_cargo', 'Responsable revisión — Cargo', 31, { groupName: 'Firmas' }),
    textareaField('resp_revision_firma', 'Responsable revisión — Firma', 32, { groupName: 'Firmas', placeholder: 'Firma' }),
    textField('conductor_firma_nombre', 'Conductor — Nombre', 33, { groupName: 'Firmas' }),
    textField('conductor_firma_doc', 'Conductor — Doc. identificación', 34, { groupName: 'Firmas' }),
    textareaField('conductor_firma', 'Conductor — Firma', 35, { groupName: 'Firmas', placeholder: 'Firma' }),
  ];
}
