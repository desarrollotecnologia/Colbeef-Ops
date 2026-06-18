import {
  FieldDef,
  formalMeasureTableField,
  itemChecklistField,
  multiSelectField,
  readonlyField,
  selectField,
  textareaField,
  ESPECIES,
} from '../field-helpers';

const HOJA1 = 'Hoja 1';
const SANITARY_GROUP = 'Operación sanitaria';

const SANITARY_ITEM = (key: string, label: string, fr: string, section: string) => ({
  key,
  label,
  fr,
  section,
});

const TEMP_AREAS = [
  'Sala desposte',
  'Cuarto de etiquetado y empaque secundario',
  'Porcionado',
  'Alistamiento o picking',
  'Cuarto de refrigeración # 1',
  'Cuarto de congelación # 1',
  'Contenedor # 1',
  'Contenedor # 2',
  'Contenedor # 3',
  'Cava 12',
];

function sanitarySheet(
  sections: { name: string; items: { key: string; label: string; fr: string }[] }[],
  sheetOpts?: { revCncNa?: boolean }
): FieldDef[] {
  const allItems = sections.flatMap((sec) =>
    sec.items.map((item) => SANITARY_ITEM(item.key, item.label, item.fr, sec.name))
  );

  return [
    readonlyField('detergente', 'Detergente / Concentración', 'Alcalino clorado 2%', 1, SANITARY_GROUP),
    readonlyField('desinfectante', 'Desinfectante / Concentración', 'Amonio cuaternario 200 ppm', 2, SANITARY_GROUP),
    itemChecklistField('operacion_sanitaria', 'Operación sanitaria', allItems, 3, {
      groupName: SANITARY_GROUP,
      columns: ['fr', 'rev_cnc', 'observation', 'corrective', 'final_cnc', 'responsible'],
      revCncNa: sheetOpts?.revCncNa,
    }),
  ];
}

export function getFormat2Fields(slug: string): FieldDef[] {
  switch (slug) {
    case 'preoperativo-1':
      return [
        multiSelectField('especie', 'Especie', ESPECIES, 1, { required: true, groupName: HOJA1 }),
        formalMeasureTableField(
          'cloro_registros',
          'Control de cloro residual',
          'cloro',
          [
            { key: 'r1', label: '1' },
            { key: 'r2', label: '2' },
          ],
          2,
          HOJA1,
          { helpText: 'Cloro residual libre (0.3 – 2.0 ppm) · pH = 7.0' }
        ),
        formalMeasureTableField(
          'temperaturas',
          'Temperaturas de áreas',
          'temperaturas',
          TEMP_AREAS.map((label, i) => ({ key: `t_${i}`, label })),
          3,
          HOJA1,
          { measureCncMode: 'cnc_na' }
        ),
        formalMeasureTableField(
          'titulacion',
          'Titulación de ácido láctico',
          'titulacion',
          [
            { key: 'tit_1', label: '1' },
            { key: 'tit_2', label: '2' },
          ],
          4,
          HOJA1,
          { helpText: 'Volumen 2.2 ml → 1.98% · Volumen 2.3 ml → 2.07%' }
        ),
        formalMeasureTableField(
          'variables_equipos',
          'Variables de equipos',
          'equipos',
          [
            { key: 'termo', label: 'Termo-encogido', naPresion: true },
            { key: 'empacadora', label: 'Empacadora al vacío', naTemp: true },
            { key: 'termoforma', label: 'Termoformadora', naTemp: true },
          ],
          5,
          HOJA1
        ),
        formalMeasureTableField(
          'pediluvios',
          'Pediluvios',
          'pediluvios',
          [
            { key: 'p1', label: '1' },
            { key: 'p2', label: '2' },
          ],
          6,
          HOJA1
        ),
        textareaField('observaciones', 'Observaciones', 7, { groupName: HOJA1 }),
      ];

    case 'preoperativo-2':
      return sanitarySheet([
        {
          name: 'Áreas comunes',
          items: [
            { key: 'puertas', label: 'Puertas de ingreso', fr: 'Dr' },
            { key: 'pisos', label: 'Pisos', fr: 'Dr' },
            { key: 'paredes', label: 'Paredes', fr: 'Dr' },
            { key: 'salon', label: 'Salón múltiple', fr: 'Dr' },
            { key: 'oficinas', label: 'Oficinas administrativas', fr: 'Dr' },
            { key: 'secador', label: 'Secador botas', fr: 'Dr' },
            { key: 'bano', label: 'Baño hombres-mujeres', fr: 'Dr' },
            { key: 'lavamanos', label: 'Lavamanos', fr: 'Dr' },
            { key: 'enfermeria', label: 'Enfermería', fr: 'Dr' },
            { key: 'sala_reuniones', label: 'Sala reuniones administrativa', fr: 'Dr' },
            { key: 'cuarto_lyd', label: 'Cuarto LYD', fr: 'Dr' },
          ],
        },
        {
          name: 'Filtro sanitario',
          items: [
            { key: 'dispensadores', label: 'Dispensadores de jabón', fr: 'Dr' },
            { key: 'cepillos', label: 'Cepillos lavabotas', fr: 'Dr' },
            { key: 'toallas', label: 'Toallas para manos', fr: 'Dr' },
            { key: 'filtro_paredes', label: 'Paredes', fr: 'Dr' },
            { key: 'filtro_pisos', label: 'Pisos y puertas', fr: 'Dr' },
          ],
        },
        {
          name: 'Área de etiquetado',
          items: [
            { key: 'et_pisos', label: 'Pisos', fr: 'Dr' },
            { key: 'et_paredes', label: 'Paredes', fr: 'Dr' },
            { key: 'et_puertas', label: 'Puertas', fr: 'Dr' },
            { key: 'et_cortinas', label: 'Cortinas', fr: 'Dr' },
            { key: 'et_computo', label: 'Equipos de cómputo', fr: 'Dr' },
            { key: 'et_bandas', label: 'Bandas', fr: 'Dr' },
            { key: 'et_grameras', label: 'Grameras', fr: 'Dr' },
            { key: 'et_mesones', label: 'Mesones', fr: 'Dr' },
            { key: 'et_cajas', label: 'Almacenamiento de cajas', fr: 'Sn' },
            { key: 'et_canastillas_l', label: 'Cuarto canastillas limpias', fr: 'Dr' },
            { key: 'et_bases', label: 'Bases y canastillas', fr: 'Dr' },
            { key: 'et_canastillas_s', label: 'Cuarto canastillas sucias', fr: 'Dr' },
          ],
        },
        {
          name: 'Área de porcionado',
          items: [
            { key: 'por_pisos', label: 'Pisos y paredes', fr: 'Dr' },
            { key: 'por_puertas', label: 'Puertas', fr: 'Dr' },
            { key: 'por_molino', label: 'Molino (P.O.E.S)', fr: 'Dr' },
            { key: 'por_termoforma', label: 'Equipo termoformadora', fr: 'Dr' },
            { key: 'por_hamburguesas', label: 'Formadora hamburguesas', fr: 'Dr' },
            { key: 'por_videojet', label: 'Equipo video jet', fr: 'Dr' },
            { key: 'por_mesones', label: 'Mesones', fr: 'Dr' },
          ],
        },
      ]);

    case 'preoperativo-3':
      return sanitarySheet([
        {
          name: 'Área de alistamiento',
          items: [
            { key: 'al_pisos', label: 'Pisos', fr: 'Dr' },
            { key: 'al_paredes', label: 'Paredes', fr: 'Dr' },
            { key: 'al_cortinas', label: 'Cortinas', fr: 'Dr' },
            { key: 'al_refri', label: 'Cuarto refrigeración #1', fr: 'Sn' },
            { key: 'al_congel', label: 'Cuarto congelación', fr: 'Sn' },
            { key: 'al_cont1', label: 'Contenedor #1', fr: 'Sn' },
            { key: 'al_cont2', label: 'Contenedor #2', fr: 'Sn' },
            { key: 'al_cont3', label: 'Contenedor #3', fr: 'Sn' },
            { key: 'al_cava12', label: 'Cava 12', fr: 'Sn' },
            { key: 'al_muelle', label: 'Muelle de despacho', fr: 'Dr' },
            { key: 'al_estibas', label: 'Estibas y traspale', fr: 'Dr' },
          ],
        },
        {
          name: 'Pasillo y área de cuarteo',
          items: [
            { key: 'pc_paredes', label: 'Paredes', fr: 'Dr' },
            { key: 'pc_pisos', label: 'Pisos', fr: 'Dr' },
            { key: 'pc_puertas', label: 'Puertas', fr: 'Dr' },
            { key: 'pc_plataforma', label: 'Plataforma', fr: 'Dr' },
            { key: 'pc_difusor', label: 'Difusor', fr: 'Dr' },
          ],
        },
        {
          name: 'Sala de desposte',
          items: [
            { key: 'sd_sierra', label: 'Sierra sin fin (P.O.E.S)', fr: 'Dr' },
            { key: 'sd_tablas', label: 'Tablas teflón (P.O.E.S)', fr: 'Dr' },
            { key: 'sd_bandas', label: 'Bandas desposte (P.O.E.S)', fr: 'Dr' },
            { key: 'sd_gancho', label: 'Soporte gancho deshuesador (P.O.E.S)', fr: 'Dr' },
            { key: 'sd_pisos', label: 'Pisos', fr: 'Dr' },
            { key: 'sd_paredes', label: 'Paredes', fr: 'Dr' },
            { key: 'sd_puertas', label: 'Puertas', fr: 'Dr' },
            { key: 'sd_lavamanos', label: 'Lavamanos', fr: 'Dr' },
            { key: 'sd_empacadora', label: 'Empacadora al vacío', fr: 'Dr' },
            { key: 'sd_termo', label: 'Termoencogido', fr: 'Dr' },
            { key: 'sd_bandas_hueso', label: 'Bandas para hueso', fr: 'Dr' },
            { key: 'sd_bandas_sebo', label: 'Bandas para sebo', fr: 'Dr' },
            { key: 'sd_basculas', label: 'Básculas de piso', fr: 'Dr' },
            { key: 'sd_mesas', label: 'Mesas', fr: 'Dr' },
            { key: 'sd_bodega', label: 'Bodega insumos producción', fr: 'Sn' },
            { key: 'sd_sebo', label: 'Cuarto de sebo', fr: 'Dr' },
            { key: 'sd_maquinas', label: 'Cuarto de máquinas', fr: 'Sn' },
            { key: 'sd_escaleras', label: 'Escaleras', fr: 'Dr' },
            { key: 'sd_canalinas', label: 'Canalinas', fr: 'Dr' },
            { key: 'sd_difusores', label: 'Difusores', fr: 'Dr' },
            { key: 'sd_afilado', label: 'Cuarto de afilado', fr: 'Sn' },
            { key: 'sd_esterilizadores', label: 'Esterilizadores', fr: 'Dr' },
          ],
        },
      ], { revCncNa: true });

    case 'preoperativo-4':
      return [
        ...sanitarySheet([
          {
            name: 'Otras áreas',
            items: [
              { key: 'of_prod', label: 'Oficina de producción', fr: 'Dr' },
              { key: 'of_recep', label: 'Oficina recepción canales', fr: 'Sn' },
              { key: 'base_cuchillos', label: 'Base lavado cuchillos', fr: 'Dr' },
              { key: 'cuchillos', label: 'Cuchillos (P.O.E.S)', fr: 'Dr' },
              { key: 'chairas', label: 'Chairas', fr: 'Dr' },
              { key: 'portacuchillos', label: 'Portacuchillos', fr: 'Dr' },
              { key: 'guante_malla', label: 'Guante de malla (P.O.E.S)', fr: 'Dr' },
              { key: 'gancho', label: 'Gancho desposte (P.O.E.S)', fr: 'Dr' },
              { key: 'delantales', label: 'Delantales plásticos (P.O.E.S)', fr: 'Dr' },
              { key: 'laboratorio', label: 'Laboratorio', fr: 'Dr' },
            ],
          },
          {
            name: 'Higienización alturas',
            items: [
              { key: 'ha_riel', label: 'Riel', fr: 'TM' },
              { key: 'ha_extractores', label: 'Extractores', fr: 'TM' },
              { key: 'ha_lamparas', label: 'Lámparas', fr: 'TM' },
              { key: 'ha_difusores', label: 'Difusores', fr: 'TM' },
              { key: 'ha_techos', label: 'Techos y cielorraso', fr: 'TM' },
            ],
          },
        ], { revCncNa: true }),
        selectField('material_extrano', '¿Presencia de material extraño en superficies y equipos?', ['Sí', 'No'], 50, {
          groupName: 'Presencia de material extraño',
          required: true,
        }),
        textareaField('material_extrano_obs', 'Observaciones', 51, { groupName: 'Presencia de material extraño' }),
        textareaField('higienizacion_obs', 'Observaciones', 52, { groupName: 'Observaciones higienización alturas' }),
      ];

    default:
      return [];
  }
}
