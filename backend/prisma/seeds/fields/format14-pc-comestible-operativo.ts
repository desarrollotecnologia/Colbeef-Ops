import { pcOperativoTableField } from '../field-helpers';

function cabezasFields() {
  return [
    pcOperativoTableField(
      'pc_op_proceso',
      'Proceso — área cabezas',
      'codigo_responsable',
      [
        { key: 'lavado_cabezas', label: 'Lavado cabezas', slotCount: 3 },
        { key: 'limpieza_lenguas', label: 'Limpieza de lenguas', slotCount: 3 },
      ],
      1,
      'Área de cabezas'
    ),
    pcOperativoTableField(
      'pc_op_bpm_esterilizadores',
      'T° esterilizadores',
      'esterilizadores',
      [{ key: 'esterilizadores', label: 'T° esterilizadores', slotCount: 2 }],
      10,
      'Buenas prácticas de manufactura'
    ),
    pcOperativoTableField(
      'pc_op_bpm_personal',
      'Buenas prácticas — personal',
      'operario_cnc',
      [
        { key: 'tapabocas', label: 'Uso de tapabocas', slotCount: 2 },
        { key: 'utensilios', label: 'Manejo de utensilios', slotCount: 2 },
      ],
      11,
      'Buenas prácticas de manufactura'
    ),
    pcOperativoTableField(
      'pc_op_poes',
      'POES',
      'operario_cnc',
      [
        { key: 'guillotina', label: 'Limpieza de guillotina', slotCount: 2 },
        { key: 'guantes', label: 'Lavado guantes de acero', slotCount: 2 },
        { key: 'perchero', label: 'Lavado de carro perchero', slotCount: 2 },
      ],
      20,
      'POES'
    ),
  ];
}

function patasManosFields() {
  return [
    pcOperativoTableField(
      'pc_op_proceso',
      'Proceso — patas y manos',
      'proceso_tiempos',
      [
        {
          key: 'pelado',
          label: 'Tiempo y temperatura de pelado (11 a 14 Min a 60-70°C)',
          slotCount: 2,
        },
        {
          key: 'coccion',
          label: 'Tiempo y temperatura de cocción (5 a 8 Min 80-90°C)',
          slotCount: 2,
        },
      ],
      1,
      'Área de patas y manos'
    ),
    pcOperativoTableField(
      'pc_op_poes',
      'POES',
      'operario_cnc',
      [{ key: 'meson', label: 'Mesón de acero inoxidable', slotCount: 2 }],
      10,
      'POES'
    ),
    pcOperativoTableField(
      'pc_op_bpm_personal',
      'Buenas prácticas — personal',
      'operario_cnc',
      [
        { key: 'tapabocas', label: 'Uso de tapabocas', slotCount: 2 },
        { key: 'utensilios', label: 'Manejo de utensilios', slotCount: 2 },
      ],
      20,
      'Buenas prácticas de manufactura'
    ),
  ];
}

function viscerasBlancasFields() {
  return [
    pcOperativoTableField(
      'pc_op_proceso',
      'Proceso — vísceras blancas',
      'proceso_tiempos_cnc',
      [
        { key: 'panzas_limpieza', label: 'Tiempo de limpieza de panzas (5 - 8 Min a 60°C)', slotCount: 2 },
        { key: 'panzas_coccion', label: 'Tiempo y temperatura de cocción de panzas (3 - 5 Min a 120°C)', slotCount: 2 },
        { key: 'librillos_limpieza', label: 'Tiempo de limpieza de librillos (6 - 9 Min a 60°C)', slotCount: 2 },
        { key: 'librillos_coccion', label: 'Tiempo de cocción y temperatura de librillos (2 - 5 Min A 100°C)', slotCount: 2 },
        { key: 'cuajos_limpieza', label: 'Tiempo de limpieza de cuajos (1 - 3 Min)', slotCount: 2 },
        { key: 'cuajos_coccion', label: 'Tiempo y temperatura de cocción de cuajos (10 a 15 Min > 85°C)', slotCount: 2 },
        { key: 'chunchullas', label: 'Tiempo y temperatura de cocción de chunchullas (10 - 20 Min > 85°C)', slotCount: 2 },
        { key: 'canutas', label: 'Tiempo y temperatura de cocción de canutas (10 a 20 Min > de 80°C)', slotCount: 2 },
      ],
      1,
      'Área de vísceras blancas'
    ),
    pcOperativoTableField(
      'pc_op_bpm_personal',
      'Buenas prácticas de manufactura',
      'operario_cnc',
      [
        { key: 'tapabocas', label: 'Uso de tapabocas', slotCount: 5 },
        { key: 'utensilios', label: 'Manejo de utensilios', slotCount: 2 },
      ],
      10,
      'Buenas prácticas de manufactura',
      { operarioLabel: 'Responsable' }
    ),
  ];
}

function viscerasRojasFields() {
  return [
    pcOperativoTableField(
      'pc_op_proceso',
      'Proceso — vísceras rojas',
      'codigo_operario',
      [
        { key: 'limpieza_paquete', label: 'Limpieza del paquete de vísceras', slotCount: 2 },
        { key: 'inspeccion_paquete', label: 'Inspección del paquete de vísceras', slotCount: 2 },
      ],
      1,
      'Área de vísceras rojas'
    ),
    pcOperativoTableField(
      'pc_op_poes',
      'POES',
      'operario_cnc',
      [{ key: 'ganchos', label: 'Lavado de ganchos para víscera roja', slotCount: 2 }],
      10,
      'POES'
    ),
    pcOperativoTableField(
      'pc_op_bpm_esterilizadores',
      'T° esterilizadores',
      'esterilizadores',
      [{ key: 'esterilizadores', label: 'T° esterilizadores', slotCount: 2 }],
      20,
      'Buenas prácticas de manufactura'
    ),
    pcOperativoTableField(
      'pc_op_bpm_personal',
      'Buenas prácticas — personal',
      'operario_cnc',
      [
        { key: 'tapabocas', label: 'Uso de tapabocas', slotCount: 2 },
        { key: 'utensilios', label: 'Manejo de utensilios', slotCount: 2 },
      ],
      21,
      'Buenas prácticas de manufactura'
    ),
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
