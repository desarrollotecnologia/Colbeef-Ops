import { FieldDef } from '../field-helpers';
import { getFormat1Fields } from './format1-beneficio';
import { getFormat2Fields } from './format2-desposte';
import { getFormat3Fields } from './format3-despacho';
import { getFormat4Fields } from './format4-proceso';
import { getFormat5Fields } from './format5-foraneas';
import { getFormat6Fields } from './format6-recepcion';
import { getFormat7Fields } from './format7-producto';

type FieldResolver = (slug: string) => FieldDef[];

const RESOLVERS: Record<string, FieldResolver> = {
  PREOP_BENEFICIO: getFormat1Fields,
  PREOP_DESPOSTE: getFormat2Fields,
  DESPACHO_PRODUCTO: getFormat3Fields,
  PROCESO_DESPOSTE: getFormat4Fields,
  RECEPCION_CANALES_FORANEAS: getFormat5Fields,
  RECEPCION_CANALES_DESPOSTE: getFormat6Fields,
  VERIFICACION_PRODUCTO: getFormat7Fields,
};

export function getFieldsForSheet(formatCode: string, sheetSlug: string): FieldDef[] {
  const resolver = RESOLVERS[formatCode];
  if (!resolver) return [];
  return resolver(sheetSlug);
}
