import { FieldDef, textareaField, timeField } from '../field-helpers';

const POES_EQUIPOS_IZQ = [
  { key: 'cuchillo_manual', label: 'Cuchillo manual' },
  { key: 'clipador_esofago', label: 'Clipador de esófago' },
  { key: 'cuchilla_patas', label: 'Cuchilla de la cortadora de patas', defaultObservation: 'Ácido láctico' },
  { key: 'cuchillo_neumatico', label: 'Cuchillo neumático', defaultObservation: 'Ácido láctico' },
  { key: 'sierra_canal', label: 'Sierra canal' },
  { key: 'sierra_pecho', label: 'Sierra pecho' },
  { key: 'gancho_polea', label: 'Gancho polea canal' },
];

const POES_EQUIPOS_DER = [
  { key: 'baranda_eviscerado_rojas', label: 'Baranda plataforma eviscerado de rojas' },
  { key: 'baranda_limpieza_inf', label: 'Baranda plataforma limpieza y desgrase inferior' },
  { key: 'baranda_limpieza_sup', label: 'Baranda plataforma limpieza y desgrase superior' },
  { key: 'plataforma_eviscerado_blancas', label: 'Plataforma eviscerado de blancas' },
  { key: 'plataforma_tol_cero_inf', label: 'Plataforma tolerancia cero inferior' },
  { key: 'plataforma_tol_cero_sup', label: 'Plataforma tolerancia cero superior' },
  { key: 'baranda_sierra_pecho', label: 'Baranda plataforma sierra pecho' },
  { key: 'baranda_desolladora', label: 'Baranda plataforma desolladora' },
];

const POES_BPM_ITEMS = [
  'Corte de grandes vasos',
  'Corte de manos',
  'Desuello de brazos',
  'Desuello primera pierna',
  'Desuello segunda piernas',
  'Embolsado de recto',
  'Eviscerador de blancas',
  'Eviscerador de rojas',
  'Tolerancia cero',
].map((label, i) => ({ key: `bpm_${i}`, label }));

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
      options: {
        layout: 'poes_bpm_table',
        items: POES_BPM_ITEMS,
      },
    },
    textareaField('poes_observaciones', 'Observaciones generales', 30, { groupName: 'Cierre' }),
  ];
}
