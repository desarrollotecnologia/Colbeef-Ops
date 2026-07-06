import { FieldDef, numberField, readonlyField, textareaField } from '../field-helpers';

const LEYENDA_HALLAZGOS =
  'C.R: Contenido Ruminal, M.F: Materia Fecal, V.R: Vísceras rojas, V.B: Vísceras blancas, CB: Cabezas, PM: Patas y Manos, LG: Lenguas, COC: Cocción, PELO: Pelo';

export function getFormat16Fields(_slug: string): FieldDef[] {
  return [
    readonlyField('leyenda_hallazgos', 'Leyenda', LEYENDA_HALLAZGOS, 1, 'Encabezado'),
    numberField('total_animales', 'Total animales', 2, { groupName: 'Encabezado', required: true, min: 1 }),
    {
      fieldKey: 'pc_inocuidad_registros',
      label: 'Registro de verificación por ítem',
      fieldType: 'REPEATER' as const,
      manualOnly: true,
      required: true,
      sortOrder: 10,
      groupName: 'Verificación',
      helpText: 'Marque C / NC / NA por hallazgo. Puede agregar más filas.',
      options: {
        layout: 'pc_inocuidad_repeater',
        minRows: 1,
        maxRows: 60,
        addButtonLabel: 'Agregar ítem',
        entryLabel: 'Ítem',
      },
    },
    textareaField('observaciones_generales', 'Observaciones generales', 20, { groupName: 'Cierre' }),
  ];
}
