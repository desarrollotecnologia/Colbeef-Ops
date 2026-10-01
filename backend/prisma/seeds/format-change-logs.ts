/**
 * Control de cambios inicial, tomado de la hoja "CONTROL DE CAMBIOS" de cada Excel.
 * Se carga en la migración 20261001120000_format_change_logs; el admin lo edita desde la app.
 */
export type ChangeLogSeed = {
  version: string;
  fecha: string | null;
  elaboro: string;
  reviso: string;
  aprobo: string;
  descripcion: string;
};

export const FORMAT_CHANGE_LOG_SEED: Record<string, ChangeLogSeed[]> = {
  INSPECCION_BIENESTAR_ANIMAL: [
    {
      version: '01',
      fecha: '2024-12-16',
      elaboro: 'Gestor de Calidad',
      reviso: 'Director(a) Aseguramiento de la Calidad',
      aprobo: 'Director(a) Aseguramiento de la Calidad',
      descripcion: 'Creación versión inicial del documento',
    },
  ],
  INSPECCION_VEHICULOS: [
    {
      version: '01',
      fecha: '2019-10-23',
      elaboro: 'Coordinador(a) de calidad',
      reviso: 'Gerente de calidad',
      aprobo: 'Gerente de calidad',
      descripcion: 'Creación versión inicial del documento.',
    },
    {
      version: '02',
      fecha: '2024-12-16',
      elaboro: 'Gestor de calidad',
      reviso: 'Coordinador(a) de calidad - Analista SIG',
      aprobo: 'Director(a) aseguramiento de la calidad',
      descripcion:
        'Se actualiza de acuerdo con el procedimiento de elaboración y control documental e inclusión de criterios de aceptación, rango de temperatura de visceras y canales para despacho.',
    },
    {
      version: '03',
      fecha: '2025-09-25',
      elaboro: 'Analista SIG',
      reviso: 'Coordinador(a) de calidad',
      aprobo: 'Director(a) aseguramiento de la calidad',
      descripcion: 'Se realiza actualización de logo corporativo',
    },
  ],
  DEVOLUCIONES: [
    {
      version: '1.0.0',
      fecha: '2021-07-24',
      elaboro: 'Gestor Calidad',
      reviso: 'Coordinación calidad',
      aprobo: 'Dirección Calidad',
      descripcion: 'Creación del documento',
    },
    {
      version: '02',
      fecha: '2025-05-02',
      elaboro: 'Analista SIG',
      reviso: 'Director de planta',
      aprobo: 'Comité de gestión integral',
      descripcion: 'Se realiza ajuste según procedimiento de control documental',
    },
  ],
  MONITOREO_TITULACION_ACIDO_LACTICO: [
    {
      version: '01',
      fecha: '2023-07-15',
      elaboro: 'Coordinación de Calidad',
      reviso: 'Gerencia de calidad',
      aprobo: 'Gerencia de calidad',
      descripcion: 'Creación versión inicial del documento.',
    },
    {
      version: '02',
      fecha: null,
      elaboro: 'Gestor de Calidad',
      reviso: 'Coordinación de Calidad',
      aprobo: 'Dirección Aseguramiento de la Calidad',
      descripcion:
        'Ajuste de acuerdo con la actualización del procedimiento de control documental y cambio del nombre del formato.',
    },
    {
      version: '03',
      fecha: null,
      elaboro: '',
      reviso: '',
      aprobo: '',
      descripcion: 'Separación de formato',
    },
  ],
  PREOP_DESPOSTE: [
    {
      version: '01',
      fecha: '2019-11-09',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Gerencia de calidad',
      descripcion: 'Creación del documento',
    },
    { version: '02', fecha: null, elaboro: '', reviso: '', aprobo: '', descripcion: '' },
    {
      version: '03',
      fecha: '2025-06-27',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Directora Aseguramiento de la Calidad e I+D',
      aprobo: 'Comité de gestión Integral',
      descripcion:
        'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos, se incluye casilla de especie',
    },
  ],
  DESPACHO_PRODUCTO: [
    {
      version: '01',
      fecha: '2019-11-09',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Gerencia de calidad',
      descripcion: 'Creación del documento',
    },
    { version: '02', fecha: null, elaboro: '', reviso: '', aprobo: '', descripcion: '' },
    {
      version: '03',
      fecha: '2025-06-27',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Directora Aseguramiento de la Calidad e I+D',
      descripcion:
        'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos, se incluye casilla de especie.',
    },
  ],
  PROCESO_DESPOSTE: [
    {
      version: '01',
      fecha: '2019-11-09',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Gerencia de calidad',
      descripcion: 'Creación del documento',
    },
    { version: '02', fecha: null, elaboro: '', reviso: '', aprobo: '', descripcion: '' },
    {
      version: '03',
      fecha: '2025-06-27',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Directora Aseguramiento de la Calidad e I+D',
      descripcion:
        'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos, se incluye casilla de especie.',
    },
    {
      version: '04',
      fecha: '2025-10-29',
      elaboro: 'Analista SIG',
      reviso: 'Directora Aseguramiento de la Calidad e I+D',
      aprobo: 'Comité de gestión integral',
      descripcion: 'Se incluye página para verificación de etiquetado e injet',
    },
  ],
  RECEPCION_CANALES_FORANEAS: [
    {
      version: '01',
      fecha: '2019-11-09',
      elaboro: 'Gestor Calidad desposte',
      reviso: '',
      aprobo: '',
      descripcion: '',
    },
  ],
  RECEPCION_CANALES_DESPOSTE: [
    {
      version: '01',
      fecha: '2019-11-09',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Gerencia de calidad',
      descripcion: 'Creación del documento',
    },
    {
      version: '03',
      fecha: '2025-09-25',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Directora Aseguramiento de la Calidad e I+D',
      descripcion:
        'Se ajusta de acuerdo al procedimiento de elaboración y control de documentos, se elimina columna correspondiente a sexo',
    },
  ],
  VERIFICACION_PRODUCTO: [
    {
      version: '01',
      fecha: '2022-10-01',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Coordinación calidad',
      aprobo: 'Gerencia de calidad',
      descripcion: 'Creación del documento',
    },
    {
      version: '02',
      fecha: '2025-09-25',
      elaboro: 'Gestor Calidad desposte',
      reviso: 'Directora Aseguramiento de la Calidad e I+D',
      aprobo: 'Comité de gestión integral',
      descripcion: 'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos',
    },
  ],
  VERIFICACION_PCC: [
    {
      version: '01',
      fecha: '2026-09-10',
      elaboro: 'Analista de calidad',
      reviso: 'Jefe de Calidad',
      aprobo: 'Comité de gestión integral',
      descripcion: 'Creación versión inicial del documento.',
    },
  ],
};
