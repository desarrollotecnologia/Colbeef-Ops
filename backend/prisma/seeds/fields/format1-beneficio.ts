import { AutoFillRule } from '@prisma/client';
import {
  FieldDef,
  autoField,
  cncField,
  cncNaField,
  dayScheduleTableField,
  itemChecklistField,
  numberField,
  readonlyField,
  textareaField,
  textField,
  timeField,
  DAY_SCHEDULE_PUNTOS_ESTERILIZADORES,
  DAY_SCHEDULE_PUNTOS_INSPECCIONADOS,
} from '../field-helpers';

const AREAS_COMUNES = [
  'Piso', 'Paredes', 'Puerta de ingreso', 'Petos del personal', 'Botas del personal',
  'Dotación del personal', 'Lavamanos de piso', 'Dispensadores de jabón', 'Baterías sanitarias', 'Camilla',
];

/** Cavas principales + máquinas — hoja 7 área refri (según Excel fila 24) */
const AREA_REFRI_COLUMN_DEFS: { key: string; mode: 'cnc' | 'cnc_na' }[] = [
  { key: 'C#10', mode: 'cnc_na' },
  { key: 'C#9', mode: 'cnc_na' },
  { key: 'C#8', mode: 'cnc_na' },
  { key: 'C#7', mode: 'cnc_na' },
  { key: 'M7', mode: 'cnc' },
  { key: 'C#6B', mode: 'cnc_na' },
  { key: 'M6B', mode: 'cnc' },
  { key: 'C#6A', mode: 'cnc_na' },
  { key: 'C#5', mode: 'cnc_na' },
  { key: 'M5', mode: 'cnc' },
  { key: 'C#4', mode: 'cnc_na' },
  { key: 'M4', mode: 'cnc' },
  { key: 'C#3', mode: 'cnc_na' },
  { key: 'M#3', mode: 'cnc' },
  { key: 'C#2', mode: 'cnc_na' },
  { key: 'M2', mode: 'cnc' },
  { key: 'C#1', mode: 'cnc_na' },
  { key: 'M1', mode: 'cnc' },
  { key: 'PRE', mode: 'cnc' },
];

/** Columnas hoja 8 condensación — incluye PVC */
const STORAGE_COLUMN_DEFS: { key: string; mode: 'cnc' | 'cnc_na' }[] = [
  ...AREA_REFRI_COLUMN_DEFS,
  { key: 'PVC', mode: 'cnc' },
];

/** Segunda matriz hoja 7 — áreas de refrigeración × ubicaciones */
const AREAS_REFRIGERACION_COLUMN_DEFS: { key: string; mode: 'cnc' | 'cnc_na' }[] = [
  { key: 'PAN1', mode: 'cnc_na' },
  { key: 'CAV2', mode: 'cnc_na' },
  { key: 'CAV3', mode: 'cnc_na' },
  { key: 'CAV4', mode: 'cnc_na' },
  { key: 'FIL1', mode: 'cnc_na' },
  { key: 'PAS2', mode: 'cnc_na' },
  { key: 'DES1', mode: 'cnc_na' },
  { key: 'CON1', mode: 'cnc_na' },
  { key: 'FIL2', mode: 'cnc_na' },
  { key: 'TUN1', mode: 'cnc_na' },
  { key: 'LAV1', mode: 'cnc_na' },
  { key: 'CAV5', mode: 'cnc_na' },
  { key: 'BAÑ1', mode: 'cnc_na' },
  { key: 'ESP1', mode: 'cnc_na' },
  { key: 'ASE1', mode: 'cnc_na' },
  { key: 'MAN1', mode: 'cnc_na' },
  { key: 'PER1', mode: 'cnc_na' },
];

const AREAS_REFRIGERACION_ITEMS = [
  'Entrada de canales', 'Pasillos', 'Filtros', 'Lavabos y lava botas', 'Puerta de ingreso',
  'Despacho de carne y vísceras', 'Cuarto de decomisos', 'Túnel de oreo', 'Lavado de canastillas',
  'Lavado de ganchos', 'Muelle de carga', 'Baños', 'Sala de espera de conductores',
  'Cuarto de aseo', 'Cuarto de mantenimiento',
].map((l, i) => ({ key: `arz_${i}`, label: l }));

const PC_COMESTIBLES_ITEMS = [
  { key: 'd_0', label: 'Carros de uso general', section: 'Cuarto de decomisos' },
  { key: 'd_1', label: 'Canalinas y cajas cifonadas', section: 'Cuarto de decomisos' },
  { key: 'd_2', label: 'Pisos', section: 'Cuarto de decomisos' },
  { key: 'd_3', label: 'Paredes', section: 'Cuarto de decomisos' },
  { key: 'd_4', label: 'Puertas de ingreso', section: 'Cuarto de decomisos' },
  { key: 'd_5', label: 'Mangueras', section: 'Cuarto de decomisos' },
  { key: 'c3_0', label: 'Cortinas', section: 'Cava #3' },
  { key: 'c3_1', label: 'Puerta de ingreso', section: 'Cava #3' },
  { key: 'c3_2', label: 'Canalinas y cajas cifonadas', section: 'Cava #3' },
  { key: 'c3_3', label: 'Pisos', section: 'Cava #3' },
  { key: 'c3_4', label: 'Paredes', section: 'Cava #3' },
  { key: 'cn_0', label: 'Canecas', section: 'Cuarto de canecas y canastillas' },
  { key: 'cn_1', label: 'Canastillas', section: 'Cuarto de canecas y canastillas' },
  { key: 'cn_2', label: 'Canalinas y cajas cifonadas', section: 'Cuarto de canecas y canastillas' },
  { key: 'cn_3', label: 'Puerta de ingreso', section: 'Cuarto de canecas y canastillas' },
  { key: 'cn_4', label: 'Pisos', section: 'Cuarto de canecas y canastillas' },
  { key: 'cn_5', label: 'Paredes', section: 'Cuarto de canecas y canastillas' },
];

const AREA_REFRI_ITEMS = [
  'Tubería de hierro', 'Paredes', 'Pisos', 'Canalinas y cajas cifonadas', 'Puerta de ingreso',
  'Puerta de ingreso a muelle', 'Carro porta poleas', 'Riel de transporte', 'Escalera de cargue',
  'Lavamanos de piso', 'Puerta de muelle', 'Manguera', 'Sierra circular de cuarteo',
  'Pasillos cavas', 'Muelle pre-refrigeración',
].map((l, i) => ({ key: `ar_${i}`, label: l }));

const ZONA_SANGRIA_ITEMS = [
  'Cajón de noqueo', 'Plataformas fijas', 'Inspección de cabezas', 'Desendedor de cabezas',
  'Esterilizadores de plataforma', 'Lavamanos no manual plataforma', 'Riel para cabezas', 'Descornadora',
  'Estimulador eléctrico', 'Colector de sangre', 'Mangueras', 'Anudador de esófago',
  'Lavamanos no manual piso', 'Esterilizadores de piso',
];

export function getFormat1Fields(slug: string): FieldDef[] {
  switch (slug) {
    case 'zona-sangria':
      return [
        readonlyField('empresa', 'Empresa', 'COLBEEF S.A.S', 1),
        dayScheduleTableField('cloro_registros', 'Control cloro residual', DAY_SCHEDULE_PUNTOS_INSPECCIONADOS, 2, 'Control cloro', 'cloro'),
        dayScheduleTableField('esterilizadores_registros', 'Esterilizadores', DAY_SCHEDULE_PUNTOS_ESTERILIZADORES, 10, 'Esterilizadores', 'esterilizadores'),
        itemChecklistField('areas_comunes', 'Áreas comunes', AREAS_COMUNES.map((l, i) => ({ key: `ac_${i}`, label: l })), 20, { groupName: 'Áreas comunes' }),
        itemChecklistField('zona_sangria', 'Zona insensibilización y sangría', ZONA_SANGRIA_ITEMS.map((l, i) => ({ key: `zs_${i}`, label: l })), 21, { groupName: 'Zona sangría' }),
      ];

    case 'zona-intermedia': {
      const ZONA_INTERMEDIA_EQUIPOS = [
        'Gancho de izado', 'Activador para izado y transporte', 'Grilletes', 'Pistola de noqueo',
        'Paredes', 'Pisos', 'Canalinas y cajas cifonadas',
        'Puerta de ingreso a la zona', 'Esterilizador(s)', 'Lavamanos no manual',
        'Tijeras hidráulicas para corte de patas', 'Mesas de acero inoxidable',
        'Sistema para transporte de pieles', 'Máquina desolladora', 'Cuarto de zona intermedia',
        'Sierra de esternón o pecho', 'Sistema de transporte de vísceras blancas',
      ];
      const PLATAFORMAS_ITEMS = [
        'Base superior elevador', 'Base inferior elevador', 'Debajo de la plataforma', 'Cepillo',
        'Esterilizador(s)', 'Lavamanos no manual', 'Lavadelantales', 'Barra de contacto',
      ];
      return [
        itemChecklistField('zona_intermedia_equipos', 'Zona insensibilización y sangría', ZONA_INTERMEDIA_EQUIPOS.map((l, i) => ({ key: `eq_${i}`, label: l })), 1, {
          groupName: 'Zona insensibilización y sangría',
          areaLabel: 'Zona insensibilización y sangría',
        }),
        itemChecklistField('plataformas', 'Zona intermedia — Plataformas', PLATAFORMAS_ITEMS.map((l, i) => ({ key: `p_${i}`, label: l })), 2, {
          groupName: 'Zona intermedia — Plataformas',
          columns: ['platforms', 'observation', 'corrective'],
          platformCount: 9,
          areaLabel: 'Zona intermedia',
        }),
      ];
    }

    case 'zona-limpia':
      return [
        itemChecklistField('zona_intermedia_prev', 'Zona intermedia', [
          'Llave azul para agua', 'Mangueras', 'Pisos', 'Paredes', 'Canalinas y cajas cifonadas', 'Control', 'Freno de mano',
        ].map((l, i) => ({ key: `i_${i}`, label: l })), 1),
        itemChecklistField('zona_limpia', 'Zona limpia', [
          'Sierra canal', 'Puerta de ingreso a zona', 'Hidrolavadora', 'Aspiradora a vapor', 'Manguera auxiliar',
          'Cuarto lavado poleas y grilletes', 'Puerta de retenidos', 'Esterilizadores', 'Lava manos no manual', 'Puerta de oreo',
        ].map((l, i) => ({ key: `l_${i}`, label: l })), 2),
        itemChecklistField('plataformas_limpia', 'Plataformas (PLAT 1-5)', [
          'Base superior elevador', 'Base inferior elevador', 'Debajo de la plataforma', 'Esterilizador(s)',
          'Lavamanos no manual', 'Lavadelantales', 'Barra de contacto', 'Llave azul para agua', 'Mangueras',
          'Pisos', 'Paredes', 'Canalinas y cajas cifonadas',
        ].map((l, i) => ({ key: `p_${i}`, label: l })), 3, {
          groupName: 'Plataformas (PLAT 1-5)',
          columns: ['platforms', 'observation', 'corrective'],
          platformCount: 5,
        }),
      ];

    case 'sub-p-4':
      return [
        itemChecklistField('afilado_sangre', 'Cuarto de afilado y tanque de sangre', [
          'Mangueras', 'Canalinas y cajas cifonadas', 'Tanque de sangre', 'Mesón acero inoxidable',
          'Piso', 'Paredes', 'Puerta de ingreso',
        ].map((l, i) => ({ key: `a_${i}`, label: l })), 1),
        itemChecklistField('cuarto_cabezas', 'Cuarto de cabezas', [
          'Puerta de ingreso', 'Plataforma de desposte', 'Mesones acero inoxidable', 'Guillotina', 'Estibas de acero',
          'Canalinas y cajas cifonadas', 'Mangueras', 'Pisos', 'Paredes', 'Puertas', 'Lavamanos de piso', 'Rieles de cabezas',
        ].map((l, i) => ({ key: `c_${i}`, label: l })), 2),
      ];

    case 'sub-5':
      return [
        itemChecklistField('refri_cabezas', 'Cuarto refrigeración cabezas, patas y manos', [
          'Carros uso general acero', 'Carros percheros', 'Estibas acero', 'Canalinas cajas cifonadas',
          'Pisos', 'Paredes', 'Cortinas', 'Puertas de ingreso',
        ].map((l, i) => ({ key: `r_${i}`, label: l })), 1),
        itemChecklistField('patas_manos', 'Proceso patas y manos', [
          'Descascadora', 'Mesones acero', 'Escaldadoras', 'Canalinas cajas cifonadas', 'Lavamanos piso',
          'Máquina pelapatas', 'Mangueras', 'Pisos', 'Canasta metálica', 'Carro porta canasta', 'Paredes', 'Puertas ingreso',
        ].map((l, i) => ({ key: `p_${i}`, label: l })), 2),
        itemChecklistField('visceras_blancas', 'Proceso vísceras blancas', [
          'Máquina lavacallos', 'Máquina lavalibros', 'Escaldadoras', 'Tinas acero', 'Mesones acero',
          'Tubería agua', 'Mangueras', 'Canalinas cajas cifonadas', 'Lavamanos piso', 'Pisos', 'Paredes', 'Puertas ingreso zona',
        ].map((l, i) => ({ key: `v_${i}`, label: l })), 3),
      ];

    case 'sub-p-6':
      return [
        itemChecklistField('refri_visceras', 'Cuarto refrigeración vísceras rojas y blancas', [
          'Carros percheros', 'Canastillas', 'Estibas acero', 'Cajas cifonadas', 'Pisos', 'Carros uso general', 'Paredes', 'Puertas ingreso',
        ].map((l, i) => ({ key: `r_${i}`, label: l })), 1),
        itemChecklistField('visceras_rojas', 'Proceso e inspección vísceras rojas', [
          'Riel vísceras', 'Carros perchero', 'Ganchos', 'Cuarto decomisos', 'Carros uso general',
          'Mesa acero inoxidable', 'Mangueras', 'Pisos', 'Techo', 'Paredes',
        ].map((l, i) => ({ key: `v_${i}`, label: l })), 2),
        itemChecklistField('retenidos', 'Cuarto de retenidos', [
          'Base inferior elevador', 'Base superior elevador', 'Debajo plataforma', 'Cajas cifonadas',
          'Pisos', 'Paredes', 'Puerta ingreso', 'Puerta ingreso a línea',
        ].map((l, i) => ({ key: `t_${i}`, label: l })), 3),
      ];

    case 'refrigeracion':
      return [
        itemChecklistField('pc_comestibles', 'Área de P.C. comestibles', PC_COMESTIBLES_ITEMS, 1, {
          mode: 'cnc',
          groupName: 'Refrigeración',
          areaLabel: 'Área de P.C. comestibles',
        }),
        itemChecklistField('area_refri', 'Área de refrigeración — equipos y superficies', AREA_REFRI_ITEMS, 2, {
          groupName: 'Refrigeración',
          areaLabel: 'Área de refrigeración',
          columns: ['cavaColumns', 'observation', 'corrective'],
          columnDefs: AREA_REFRI_COLUMN_DEFS,
          helpText: 'Cavas y máquinas por bloque · Obs. y AC en cada fila · C# = Cava · M# = Máquina',
        }),
        itemChecklistField('areas_refrigeracion', 'Áreas de refrigeración', AREAS_REFRIGERACION_ITEMS, 3, {
          groupName: 'Refrigeración',
          areaLabel: 'Áreas de refrigeración',
          columns: ['cavaColumns', 'observation', 'corrective'],
          columnDefs: AREAS_REFRIGERACION_COLUMN_DEFS,
          matrixRowLabel: 'Área',
          helpText: 'Ubicaciones PAN1…PER1 por bloque · Obs. y AC en cada fila',
        }),
        textareaField('observaciones', 'Observaciones', 4, { groupName: 'Refrigeración' }),
        textareaField('acciones_correctivas', 'Acciones correctivas', 5, { groupName: 'Refrigeración' }),
      ];

    case 'cavas':
      return [
        itemChecklistField('condensacion', 'Verificación previa al inicio del beneficio — Condensación', [
          { key: 'almacenamiento', label: 'Área de almacenamiento' },
        ], 1, {
          groupName: 'Cavas',
          areaLabel: 'Condensación',
          columns: ['cavaColumns'],
          columnDefs: STORAGE_COLUMN_DEFS,
          helpText: 'C# = Cava · M# = Máquinas · PRE = Pre-refrigeración · PVC = Pasillo cavas',
        }),
        textareaField('observaciones', 'Observaciones', 2, { groupName: 'Cavas' }),
        textareaField('acciones_correctivas', 'Acciones correctivas', 3, { groupName: 'Cavas' }),
        textareaField('observaciones_generales', 'Observaciones generales', 4, { groupName: 'Cavas' }),
      ];

    default:
      return [];
  }
}
