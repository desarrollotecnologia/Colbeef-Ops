/** Formatos que se diligencian a lo largo de varios días (p. ej. semanal). */
export const MULTI_DAY_FORMAT_CODES = new Set(['REGISTRO_PEDILUVIOS']);

export function isMultiDayFormat(formatCode: string | null | undefined): boolean {
  return Boolean(formatCode && MULTI_DAY_FORMAT_CODES.has(formatCode));
}

/** Campo repetidor con filas de dueño (solo el autor edita su fila). */
export const OWNED_ROW_REPEATER_LAYOUT = 'pediluvios_cambios_repeater';
