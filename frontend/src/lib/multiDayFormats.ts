/** Formatos que se diligencian a lo largo de varios días (fecha inicio / fecha cierre al entregar). */
export const MULTI_DAY_FORMAT_CODES = new Set([
  'REGISTRO_PEDILUVIOS',
  'CONTROL_TEMP_PH_CANALES',
]);

export function isMultiDayFormat(code?: string | null): boolean {
  return Boolean(code && MULTI_DAY_FORMAT_CODES.has(code));
}
