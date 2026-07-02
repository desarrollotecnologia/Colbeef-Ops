import { FieldDef, readonlyField, textareaField, timeField } from '../field-helpers';

const POES_EQUIPOS_IZQ = [
  { key: 'cuchillo_manual', label: 'Cuchillo manual' },
  { key: 'clipador_esofago', label: 'Clipador de esófago' },
  { key: 'cuchilla_patas', label: 'Cuchilla de la cortadora de patas' },
  { key: 'cuchillo_neumatico', label: 'Cuchillo neumático' },
  { key: 'sierra_canal', label: 'Sierra canal' },
  { key: 'sierra_pecho', label: 'Sierra pecho' },
  { key: 'gancho_polea', label: 'Gancho polea canal' },
  { key: 'baranda_plataforma', label: 'Baranda plataforma' },
];

const POES_EQUIPOS_DER = [
  { key: 'baranda_eviscerado_rojas', label: 'Baranda plataforma eviscerado de rojas' },
  { key: 'baranda_limpieza_inf', label: 'Baranda plataforma limpieza y desgrase inferior' },
  { key: 'acido_lactico_1', label: 'Ácido láctico', section: 'Ácido láctico' },
  { key: 'baranda_limpieza_sup', label: 'Baranda plataforma limpieza y desgrase superior' },
  { key: 'acido_lactico_2', label: 'Ácido láctico', section: 'Ácido láctico' },
  { key: 'plataforma_eviscerado_blancas', label: 'Plataforma eviscerado de blancas' },
  { key: 'plataforma_tol_cero_inf', label: 'Plataforma tolerancia cero inferior' },
  { key: 'plataforma_tol_cero_sup', label: 'Plataforma tolerancia cero superior' },
  { key: 'baranda_sierra_pecho', label: 'Baranda plataforma sierra pecho' },
  { key: 'baranda_desolladora', label: 'Baranda plataforma desolladora' },
];

const POES_BPM_ITEMS = [
  'Desuello primera pierna',
  'Desuello de brazos',
  'Eviscerador de rojas',
  'Corte de manos',
  'Eviscerador de blancas',
  'Corte de grandes vasos',
  'Tolerancia cero',
  'Desuello segunda piernas',
  'Embolsado de recto',
].map((label, i) => ({ key: `bpm_${i}`, label }));

const FRECUENCIA_POES =
  'Ver listado de frecuencias operativas: carro perchero, clipador, cuchilla patas, cuchillo manual, mesón patas, gancho vísceras rojas, sierras, barandas (cada hora), lavado de manos, etc.';

export function getFormat15Fields(_slug: string): FieldDef[] {
  return [
    timeField('poes_hora_1', 'Hora toma 1', 1, { groupName: 'Encabezado', required: true }),
    timeField('poes_hora_2', 'Hora toma 2', 2, { groupName: 'Encabezado', required: true }),
    {
      fieldKey: 'poes_equipos',
      label: 'Equipos / utensilios / superficies',
      fieldType: 'CHECKLIST' as const,
      manualOnly: true,
      required: true,
      sortOrder: 10,
      groupName: 'Esterilización y lavado',
      helpText: FRECUENCIA_POES,
      options: {
        layout: 'poes_operativo_table',
        items: [...POES_EQUIPOS_IZQ, ...POES_EQUIPOS_DER],
        equiposIzq: POES_EQUIPOS_IZQ,
        equiposDer: POES_EQUIPOS_DER,
        allowAddEquipos: true,
      },
    },
    {
      fieldKey: 'poes_bpm_procedimientos',
      label: 'Buenas prácticas higiénicas en procedimientos',
      fieldType: 'CHECKLIST' as const,
      manualOnly: true,
      required: true,
      sortOrder: 20,
      groupName: 'Buenas prácticas higiénicas',
      helpText: 'Lavado de manos y uso de tapabocas por procedimiento',
      options: {
        layout: 'poes_bpm_table',
        items: POES_BPM_ITEMS,
      },
    },
    textareaField('poes_observaciones', 'Observaciones generales', 30, { groupName: 'Cierre' }),
  ];
}
