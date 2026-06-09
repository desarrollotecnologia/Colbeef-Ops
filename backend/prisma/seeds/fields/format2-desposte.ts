import { AutoFillRule } from '@prisma/client';
import {
  FieldDef,
  autoField,
  cncField,
  itemChecklistField,
  lacticoTitrationField,
  multiSelectField,
  numberField,
  powerStateField,
  readonlyField,
  selectField,
  textareaField,
  textField,
  timeField,
  ESPECIES,
} from '../field-helpers';

const SANITARY_ITEM = (key: string, label: string, fr: string) => ({ key, label, fr });

function sanitarySheet(items: ReturnType<typeof SANITARY_ITEM>[], sortStart = 1): FieldDef[] {
  return [
    readonlyField('detergente', 'Detergente', 'Alcalino clorado 2%', sortStart),
    readonlyField('desinfectante', 'Desinfectante', 'Amonio cuaternario 200 ppm', sortStart + 1),
    itemChecklistField(
      'operacion_sanitaria',
      'Operación sanitaria',
      items,
      sortStart + 2,
      {
        columns: ['fr', 'rev_cnc', 'observation', 'corrective', 'final_cnc', 'responsible'],
      }
    ),
  ];
}

export function getFormat2Fields(slug: string): FieldDef[] {
  switch (slug) {
    case 'preoperativo-1':
      return [
        multiSelectField('especie', 'Especie', ESPECIES, 1, { required: true }),
        timeField('cloro_hora', 'Hora', 2, { groupName: 'Control cloro', required: true }),
        textField('cloro_punto_toma', 'Punto de toma', 3, { groupName: 'Control cloro', required: true }),
        autoField('cloro_ph', 'pH', AutoFillRule.FIXED_VALUE, 4, 'Control cloro', { value: '7.0' }),
        numberField('cloro_residual', 'Cloro residual (0.3 - 2.0 ppm)', 5, { groupName: 'Control cloro', required: true, min: 0.3, max: 2 }),
        cncField('cloro_cnc', 'C / NC', 6, { groupName: 'Control cloro', required: true }),
        textareaField('cloro_correccion', 'Corrección', 7, { groupName: 'Control cloro', config: { requiredIf: 'nc_or_observation' } }),
        ...Array.from({ length: 10 }, (_, i) => [
          timeField(`temp_hora_${i}`, `Hora — ${['Sala desposte', 'Etiquetado y empaque', 'Porcionado', 'Alistamiento picking', 'Cuarto refrig #1', 'Cuarto congel #1', 'Contenedor #1', 'Contenedor #2', 'Contenedor #3', 'Cava 12'][i]}`, 10 + i * 3, { groupName: 'Temperaturas' }),
          numberField(`temp_valor_${i}`, 'Temperatura °C', 11 + i * 3, { groupName: 'Temperaturas' }),
          cncField(`temp_cnc_${i}`, 'C / NC', 12 + i * 3, { groupName: 'Temperaturas', required: true }),
          textareaField(`temp_correccion_${i}`, 'Corrección', 13 + i * 3, { groupName: 'Temperaturas', config: { requiredIf: 'nc_or_observation' } }),
        ]).flat(),
        ...lacticoTitrationField(50),
        readonlyField('termo_variable', 'Termo-encogido — Variable', 'T°C / Presión — N.A', 60, 'Variables equipos'),
        powerStateField('termo_estado', 'Termo-encogido — Estado', 61, { groupName: 'Variables equipos' }),
        textareaField('termo_obs', 'Termo-encogido — Observaciones', 62, { groupName: 'Variables equipos' }),
        readonlyField('empacadora_variable', 'Empacadora al vacío — Variable', 'T°C / Presión — N.A', 63, 'Variables equipos'),
        powerStateField('empacadora_estado', 'Empacadora al vacío — Estado', 64, { groupName: 'Variables equipos' }),
        textareaField('empacadora_obs', 'Empacadora al vacío — Observaciones', 65, { groupName: 'Variables equipos' }),
        readonlyField('termoforma_variable', 'Termoformadora — Variable', 'T°C / Presión — N.A', 66, 'Variables equipos'),
        powerStateField('termoforma_estado', 'Termoformadora — Estado', 67, { groupName: 'Variables equipos' }),
        textareaField('termoforma_obs', 'Termoformadora — Observaciones', 68, { groupName: 'Variables equipos' }),
        textField('pediluvio_1_principio', 'Pediluvio 1 — Principio activo', 70, { groupName: 'Pediluvios' }),
        textField('pediluvio_1_concentracion', 'Pediluvio 1 — Concentración (250 ppm)', 71, { groupName: 'Pediluvios' }),
        cncField('pediluvio_1_cnc', 'Pediluvio 1 — C / NC', 72, { groupName: 'Pediluvios', required: true }),
        textareaField('pediluvio_1_correccion', 'Pediluvio 1 — Corrección', 73, { groupName: 'Pediluvios', config: { requiredIf: 'nc_or_observation' } }),
        textField('pediluvio_2_principio', 'Pediluvio 2 — Principio activo', 74, { groupName: 'Pediluvios' }),
        textField('pediluvio_2_concentracion', 'Pediluvio 2 — Concentración (250 ppm)', 75, { groupName: 'Pediluvios' }),
        cncField('pediluvio_2_cnc', 'Pediluvio 2 — C / NC', 76, { groupName: 'Pediluvios', required: true }),
        textareaField('pediluvio_2_correccion', 'Pediluvio 2 — Corrección', 77, { groupName: 'Pediluvios', config: { requiredIf: 'nc_or_observation' } }),
      ];

    case 'preoperativo-2':
      return sanitarySheet([
        SANITARY_ITEM('puertas', 'Puertas de ingreso', 'Dr'), SANITARY_ITEM('pisos', 'Pisos', 'Dr'), SANITARY_ITEM('paredes', 'Paredes', 'Dr'),
        SANITARY_ITEM('salon', 'Salón múltiple', 'Dr'), SANITARY_ITEM('oficinas', 'Oficinas administrativas', 'Dr'),
        SANITARY_ITEM('secador', 'Secador botas', 'Dr'), SANITARY_ITEM('bano', 'Baño hombres-mujeres', 'Dr'),
        SANITARY_ITEM('lavamanos', 'Lavamanos', 'Dr'), SANITARY_ITEM('enfermeria', 'Enfermería', 'Dr'),
        SANITARY_ITEM('sala_reuniones', 'Sala reuniones administrativa', 'Dr'), SANITARY_ITEM('cuarto_lyd', 'Cuarto LYD', 'Dr'),
        SANITARY_ITEM('filtro', 'Filtro sanitario', 'Dr'), SANITARY_ITEM('dispensadores', 'Dispensadores de jabón', 'Dr'),
        SANITARY_ITEM('cepillos', 'Cepillos lavabotas', 'Dr'), SANITARY_ITEM('toallas', 'Toallas para manos', 'Dr'),
        SANITARY_ITEM('paredes2', 'Paredes', 'Dr'), SANITARY_ITEM('pisos_puertas', 'Pisos y puertas', 'Dr'),
        SANITARY_ITEM('et_pisos', 'Pisos (etiquetado)', 'Dr'), SANITARY_ITEM('et_paredes', 'Paredes (etiquetado)', 'Dr'),
        SANITARY_ITEM('et_puertas', 'Puertas (etiquetado)', 'Dr'), SANITARY_ITEM('et_cortinas', 'Cortinas', 'Dr'),
        SANITARY_ITEM('et_computo', 'Equipos de cómputo', 'Dr'), SANITARY_ITEM('et_bandas', 'Bandas', 'Dr'),
        SANITARY_ITEM('et_grameras', 'Grameras', 'Dr'), SANITARY_ITEM('et_mesones', 'Mesones', 'Dr'),
        SANITARY_ITEM('et_cajas', 'Almacenamiento de cajas', 'Sn'), SANITARY_ITEM('et_canastillas_l', 'Cuarto canastillas limpias', 'Dr'),
        SANITARY_ITEM('et_bases', 'Bases y canastillas', 'Dr'), SANITARY_ITEM('et_canastillas_s', 'Cuarto canastillas sucias', 'Dr'),
        SANITARY_ITEM('por_pisos', 'Pisos y paredes (porcionado)', 'Dr'), SANITARY_ITEM('por_puertas', 'Puertas (porcionado)', 'Dr'),
        SANITARY_ITEM('por_molino', 'Molino (P.O.E.S)', 'Dr'), SANITARY_ITEM('por_termoforma', 'Equipo termoformadora', 'Dr'),
        SANITARY_ITEM('por_hamburguesas', 'Formadora hamburguesas', 'Dr'), SANITARY_ITEM('por_videojet', 'Equipo video jet', 'Dr'),
        SANITARY_ITEM('por_mesones', 'Mesones (porcionado)', 'Dr'),
      ]);

    case 'preoperativo-3':
      return sanitarySheet([
        SANITARY_ITEM('al_pisos', 'Pisos (alistamiento)', 'Dr'), SANITARY_ITEM('al_paredes', 'Paredes', 'Dr'),
        SANITARY_ITEM('al_cortinas', 'Cortinas', 'Dr'), SANITARY_ITEM('al_refri', 'Cuarto refrigeración #1', 'Sn'),
        SANITARY_ITEM('al_congel', 'Cuarto congelación', 'Sn'), SANITARY_ITEM('al_cont1', 'Contenedor #1', 'Sn'),
        SANITARY_ITEM('al_cont2', 'Contenedor #2', 'Sn'), SANITARY_ITEM('al_cont3', 'Contenedor #3', 'Sn'),
        SANITARY_ITEM('al_cava12', 'Cava 12', 'Sn'), SANITARY_ITEM('al_muelle', 'Muelle de despacho', 'Dr'),
        SANITARY_ITEM('al_estibas', 'Estibas y traspale', 'Dr'), SANITARY_ITEM('pc_paredes', 'Paredes (pasillo cuarteo)', 'Dr'),
        SANITARY_ITEM('pc_pisos', 'Pisos', 'Dr'), SANITARY_ITEM('pc_puertas', 'Puertas', 'Dr'),
        SANITARY_ITEM('pc_plataforma', 'Plataforma', 'Dr'), SANITARY_ITEM('pc_difusor', 'Difusor', 'Dr'),
        SANITARY_ITEM('sd_sierra', 'Sierra sin fin (P.O.E.S)', 'Dr'), SANITARY_ITEM('sd_tablas', 'Tablas teflón (P.O.E.S)', 'Dr'),
        SANITARY_ITEM('sd_bandas', 'Bandas desposte (P.O.E.S)', 'Dr'), SANITARY_ITEM('sd_gancho', 'Soporte gancho deshuesador (P.O.E.S)', 'Dr'),
        SANITARY_ITEM('sd_pisos', 'Pisos (sala desposte)', 'Dr'), SANITARY_ITEM('sd_paredes', 'Paredes', 'Dr'),
        SANITARY_ITEM('sd_puertas', 'Puertas', 'Dr'), SANITARY_ITEM('sd_lavamanos', 'Lavamanos', 'Dr'),
        SANITARY_ITEM('sd_empacadora', 'Empacadora al vacío', 'Dr'), SANITARY_ITEM('sd_termo', 'Termoencogido', 'Dr'),
        SANITARY_ITEM('sd_bandas_hueso', 'Bandas para hueso', 'Dr'), SANITARY_ITEM('sd_bandas_sebo', 'Bandas para sebo', 'Dr'),
        SANITARY_ITEM('sd_basculas', 'Básculas de piso', 'Dr'), SANITARY_ITEM('sd_mesas', 'Mesas', 'Dr'),
        SANITARY_ITEM('sd_bodega', 'Bodega insumos producción', 'Sn'), SANITARY_ITEM('sd_sebo', 'Cuarto de sebo', 'Dr'),
        SANITARY_ITEM('sd_maquinas', 'Cuarto de máquinas', 'Sn'), SANITARY_ITEM('sd_escaleras', 'Escaleras', 'Dr'),
        SANITARY_ITEM('sd_canalinas', 'Canalinas', 'Dr'), SANITARY_ITEM('sd_difusores', 'Difusores', 'Dr'),
        SANITARY_ITEM('sd_afilado', 'Cuarto de afilado', 'Sn'), SANITARY_ITEM('sd_esterilizadores', 'Esterilizadores', 'Dr'),
      ]);

    case 'preoperativo-4':
      return sanitarySheet([
        SANITARY_ITEM('of_prod', 'Oficina de producción', 'Dr'), SANITARY_ITEM('of_recep', 'Oficina recepción canales', 'Sn'),
        SANITARY_ITEM('base_cuchillos', 'Base lavado cuchillos', 'Dr'), SANITARY_ITEM('cuchillos', 'Cuchillos (P.O.E.S)', 'Dr'),
        SANITARY_ITEM('chairas', 'Chairas', 'Dr'), SANITARY_ITEM('portacuchillos', 'Portacuchillos', 'Dr'),
        SANITARY_ITEM('guante_malla', 'Guante de malla (P.O.E.S)', 'Dr'), SANITARY_ITEM('gancho', 'Gancho desposte (P.O.E.S)', 'Dr'),
        SANITARY_ITEM('delantales', 'Delantales plásticos (P.O.E.S)', 'Dr'), SANITARY_ITEM('laboratorio', 'Laboratorio', 'Dr'),
        SANITARY_ITEM('ha_riel', 'Riel (higienización alturas)', 'TM'), SANITARY_ITEM('ha_extractores', 'Extractores', 'TM'),
        SANITARY_ITEM('ha_lamparas', 'Lámparas', 'TM'), SANITARY_ITEM('ha_difusores', 'Difusores', 'TM'),
        SANITARY_ITEM('ha_techos', 'Techos y cielorraso', 'TM'),
      ]).concat([
        selectField('material_extrano', '¿Presencia material extraño?', ['Sí', 'No'], 100, { required: true }),
        textareaField('material_extrano_obs', 'Observaciones material extraño', 101),
      ]);

    default:
      return [];
  }
}
