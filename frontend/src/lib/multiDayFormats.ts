/** Formatos que se diligencian a lo largo de varios días (fecha inicio / fecha cierre al entregar). */
export const MULTI_DAY_FORMAT_CODES = new Set([
  'REGISTRO_PEDILUVIOS',
  'CONTROL_TEMP_PH_CANALES',
  'INSPECCION_BIENESTAR_ANIMAL',
]);

export function isMultiDayFormat(code?: string | null): boolean {
  return Boolean(code && MULTI_DAY_FORMAT_CODES.has(code));
}

/** Formatos donde un colaborador también puede invitar a otros (quitar sigue siendo solo dueño). */
export const COLLABORATORS_CAN_INVITE_CODES = new Set(['CONTROL_TEMP_PH_CANALES']);

export function isCollaboratorsCanInviteFormat(code?: string | null): boolean {
  return Boolean(code && COLLABORATORS_CAN_INVITE_CODES.has(code));
}
