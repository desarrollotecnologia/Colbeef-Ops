/** Formatos que se diligencian a lo largo de varios días (p. ej. semanal). */
export const MULTI_DAY_FORMAT_CODES = new Set(['REGISTRO_PEDILUVIOS']);

export function isMultiDayFormat(formatCode: string | null | undefined): boolean {
  return Boolean(formatCode && MULTI_DAY_FORMAT_CODES.has(formatCode));
}

/** Solo el dueño (quien inició) puede entregar a revisión. */
export const OWNER_ONLY_SUBMIT_CODES = new Set(['MONITOREO_TITULACION_ACIDO_LACTICO']);

export function isOwnerOnlySubmitFormat(formatCode: string | null | undefined): boolean {
  return Boolean(formatCode && OWNER_ONLY_SUBMIT_CODES.has(formatCode));
}

/** Layouts de repetidor con filas de dueño. */
export const OWNED_ROW_REPEATER_LAYOUTS = new Set([
  'pediluvios_cambios_repeater',
  'lactico_titulacion_formato',
  'lactico_monitoreo_formato',
]);

/** Campo repetidor con filas de dueño (solo el autor edita su fila). */
export const OWNED_ROW_REPEATER_LAYOUT = 'pediluvios_cambios_repeater';

/** Claves de verificación por fila que solo el dueño del envío puede cambiar. */
export const OWNER_VERIFICO_ROW_KEYS = ['verifico_mark', 'verifico_nombre'] as const;
