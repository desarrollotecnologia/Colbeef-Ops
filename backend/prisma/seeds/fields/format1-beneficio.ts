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
        itemChecklistField('decomisos', 'Cuarto de decomisos', [
          'Carros de uso general', 'Canalinas y cajas cifonadas', 'Pisos', 'Paredes',
          'Puertas de ingreso', 'Mangueras',
        ].map((l, i) => ({ key: `d_${i}`, label: l })), 1, {
          mode: 'cnc_na',
          groupName: 'Área de P.C. comestibles',
          areaLabel: 'Área de P.C. comestibles',
        }),
        itemChecklistField('cava3', 'Cava #3', [
          'Cortinas', 'Puerta de ingreso', 'Canalinas y cajas cifonadas', 'Pisos', 'Paredes',
        ].map((l, i) => ({ key: `c3_${i}`, label: l })), 2, {
          mode: 'cnc_na',
          groupName: 'Área de P.C. comestibles',
        }),
        itemChecklistField('canecas', 'Cuarto de canecas y canastillas', [
          'Canecas', 'Canastillas', 'Canalinas y cajas cifonadas', 'Puerta de ingreso', 'Pisos', 'Paredes',
        ].map((l, i) => ({ key: `cn_${i}`, label: l })), 3, {
          mode: 'cnc_na',
          groupName: 'Área de P.C. comestibles',
        }),
        itemChecklistField('area_refri', 'Área de refrigeración', [
          'Tubería de hierro', 'Paredes', 'Pisos', 'Canalinas y cajas cifonadas', 'Puerta de ingreso',
          'Puerta de ingreso a muelle', 'Carro porta poleas', 'Riel de transporte', 'Escalera de cargue',
          'Lavamanos de piso', 'Puerta de muelle', 'Manguera', 'Sierra circular de cuarteo',
          'Pasillos cavas', 'Muelle pre-refrigeración',
        ].map((l, i) => ({ key: `ar_${i}`, label: l })), 4, {
          mode: 'cnc_na',
          groupName: 'Área de refrigeración',
          areaLabel: 'Área de refrigeración',
          columns: ['cavaColumns', 'observation', 'corrective'],
          cavaColumns: ['C#10', 'C#9'],
        }),
        textareaField('observaciones', 'Observaciones generales', 10, { groupName: 'Observaciones' }),
      ];

    case 'cavas': {
      const STORAGE_COLUMN_DEFS: { key: string; mode: 'cnc' | 'cnc_na' }[] = [
        { key: 'C#10', mode: 'cnc_na' },
        { key: 'C#9', mode: 'cnc_na' },
        { key: 'C#8', mode: 'cnc_na' },
        { key: 'C#7', mode: 'cnc_na' },
        { key: 'M7', mode: 'cnc' },
        { key: 'C#6B', mode: 'cnc_na' },
        { key: 'M6', mode: 'cnc' },
        { key: 'C#6A', mode: 'cnc_na' },
        { key: 'C#5', mode: 'cnc_na' },
        { key: 'M5', mode: 'cnc' },
        { key: 'C#4', mode: 'cnc_na' },
        { key: 'M4', mode: 'cnc' },
        { key: 'C#3', mode: 'cnc_na' },
        { key: 'M#3', mode: 'cnc' },
        { key: 'C#2', mode: 'cnc_na' },
        { key: 'M#2', mode: 'cnc' },
        { key: 'C#1', mode: 'cnc_na' },
        { key: 'M#1', mode: 'cnc' },
        { key: 'PRE', mode: 'cnc' },
        { key: 'PVC', mode: 'cnc' },
      ];
      return [
        itemChecklistField('condensacion', 'Verificación previa al inicio del beneficio — Condensación', [
          { key: 'almacenamiento', label: 'Área de almacenamiento' },
        ], 1, {
          mode: 'cnc_na',
          groupName: 'Condensación',
          areaLabel: 'Condensación',
          columns: ['cavaColumns'],
          columnDefs: STORAGE_COLUMN_DEFS,
          helpText: 'C# = Cava · M# = Máquinas · PRE = Pre-refrigeración · PVC = Pasillo cavas',
        }),
        textareaField('observaciones', 'Observaciones', 2, { groupName: 'Observaciones y acciones' }),
        textareaField('acciones_correctivas', 'Acciones correctivas', 3, { groupName: 'Observaciones y acciones' }),
        textareaField('observaciones_generales', 'Observaciones generales', 4, { groupName: 'Observaciones generales' }),
      ];
    }

    default:
      return [];
  }
}
