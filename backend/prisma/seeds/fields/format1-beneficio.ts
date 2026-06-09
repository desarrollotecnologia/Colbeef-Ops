import { AutoFillRule } from '@prisma/client';
import {
  FieldDef,
  autoField,
  cncField,
  cncNaField,
  dayScheduleField,
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
        dayScheduleField('puntos_inspeccionados', 'Puntos inspeccionados', DAY_SCHEDULE_PUNTOS_INSPECCIONADOS, 2, 'Control cloro'),
        timeField('cloro_hora', 'Hora', 3, { groupName: 'Control cloro', required: true }),
        textField('cloro_punto_toma', 'Punto de toma', 4, { groupName: 'Control cloro', required: true }),
        autoField('cloro_ph', 'pH', AutoFillRule.FIXED_VALUE, 5, 'Control cloro', { value: '7.0' }),
        numberField('cloro_residual', 'Cloro residual (0.3 - 2 ppm)', 6, { groupName: 'Control cloro', required: true, min: 0.3, max: 2 }),
        cncField('cloro_cnc', 'C / NC', 7, { groupName: 'Control cloro', required: true }),
        textareaField('cloro_observaciones', 'Observaciones', 8, { groupName: 'Control cloro' }),
        dayScheduleField('puntos_esterilizadores', 'Puntos de inspección', DAY_SCHEDULE_PUNTOS_ESTERILIZADORES, 10, 'Esterilizadores'),
        numberField('valores_encontrados', 'Valores encontrados (°C)', 11, { groupName: 'Esterilizadores', required: true }),
        cncField('esterilizadores_cnc', 'C / NC', 12, { groupName: 'Esterilizadores', required: true }),
        textareaField('esterilizadores_observaciones', 'Observaciones', 13, { groupName: 'Esterilizadores' }),
        itemChecklistField('areas_comunes', 'Áreas comunes', AREAS_COMUNES.map((l, i) => ({ key: `ac_${i}`, label: l })), 20, { groupName: 'Áreas comunes' }),
        itemChecklistField('zona_sangria', 'Zona insensibilización y sangría', ZONA_SANGRIA_ITEMS.map((l, i) => ({ key: `zs_${i}`, label: l })), 21, { groupName: 'Zona sangría' }),
      ];

    case 'zona-intermedia':
      return [
        itemChecklistField('zona_intermedia_sangria', 'Zona insensibilización y sangría', [
          'Gancho de izado', 'Activador para izado y transporte', 'Grilletes', 'Pistola de noqueo',
          'Paredes', 'Pisos', 'Canalinas y cajas cifonadas',
        ].map((l, i) => ({ key: `i_${i}`, label: l })), 1, { groupName: 'Zona intermedia' }),
        itemChecklistField('zona_intermedia_area', 'Zona intermedia', [
          'Puerta de ingreso a la zona', 'Esterilizador(s)', 'Lavamanos no manual',
          'Tijeras hidráulicas para corte de patas', 'Mesas de acero inoxidable',
          'Sistema para transporte de pieles', 'Máquina desolladora', 'Cuarto de zona intermedia',
          'Sierra de esternón o pecho', 'Sistema de transporte de vísceras blancas',
        ].map((l, i) => ({ key: `a_${i}`, label: l })), 2, { groupName: 'Zona intermedia' }),
        itemChecklistField('plataformas', 'Plataformas (PLAT 1-5)', [
          'Base superior elevador', 'Base inferior elevador', 'Debajo de la plataforma', 'Cepillo',
          'Esterilizador(s)', 'Lavamanos no manual', 'Lavadelantales', 'Barra de contacto',
        ].map((l, i) => ({ key: `p_${i}`, label: l })), 3, { columns: ['cnc', 'observation', 'corrective', 'platforms'], platformCount: 5 }),
      ];

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
        ].map((l, i) => ({ key: `p_${i}`, label: l })), 3, { columns: ['cnc', 'observation', 'corrective', 'platforms'], platformCount: 5 }),
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
          'Carros uso general', 'Canalinas cajas cifonadas', 'Pisos', 'Paredes', 'Puertas ingreso', 'Mangueras',
        ].map((l, i) => ({ key: `d_${i}`, label: l })), 1, { mode: 'cnc_na' }),
        itemChecklistField('cava3', 'Cava #3', ['Cortinas', 'Puerta ingreso', 'Canalinas cajas cifonadas', 'Pisos', 'Paredes'].map((l, i) => ({ key: `c3_${i}`, label: l })), 2, { mode: 'cnc_na' }),
        itemChecklistField('canecas', 'Cuarto canecas y canastillas', [
          'Canecas', 'Canastillas', 'Canalinas cajas cifonadas', 'Puerta ingreso', 'Pisos', 'Paredes',
        ].map((l, i) => ({ key: `cn_${i}`, label: l })), 3, { mode: 'cnc_na' }),
        itemChecklistField('area_refri', 'Área refrigeración', [
          'Tubería hierro', 'Paredes', 'Pisos', 'Canalinas cajas cifonadas', 'Puerta ingreso', 'Puerta ingreso muelle',
          'Carro porta poleas', 'Riel transporte', 'Escalera cargue', 'Lavamanos piso', 'Puerta muelle', 'Manguera',
          'Sierra circular cuarteo', 'Pasillos cavas', 'Muelle pre-refrigeración',
        ].map((l, i) => ({ key: `ar_${i}`, label: l })), 4, {
          mode: 'cnc_na',
          columns: ['cnc', 'observation', 'corrective', 'cavaColumns'],
          cavaColumns: ['C#10', 'C#9', 'C#8', 'C#7'],
        }),
        textareaField('observaciones', 'Observaciones', 10),
      ];

    case 'cavas':
      return [
        itemChecklistField('condensacion', 'Condensación / Área almacenamiento', [
          { key: 'almacenamiento', label: 'Área de almacenamiento' },
        ], 1, {
          mode: 'cnc_na',
          columns: ['cnc', 'observation', 'corrective', 'cavaColumns'],
          cavaColumns: ['C#10', 'C#9', 'C#8', 'C#7'],
        }),
        textareaField('observaciones', 'Observaciones', 5),
        textareaField('observaciones_generales', 'Observaciones generales', 6),
      ];

    default:
      return [];
  }
}
