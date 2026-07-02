import { FieldDef, numberField, readonlyField, textareaField } from '../field-helpers';

const LEYENDA_HALLAZGOS =
  'CR: Contenido ruminal · MF: Materia fecal · VR: Vísceras rojas · VB: Vísceras blancas · CB: Cabezas · PM: Patas y manos · LG: Lenguas · COC: Cocción · PELO: Pelo';

export function getFormat16Fields(_slug: string): FieldDef[] {
  return [
    numberField('total_animales', 'Total animales', 1, { groupName: 'Encabezado', required: true, min: 1 }),
    readonlyField('leyenda_hallazgos', 'Leyenda', LEYENDA_HALLAZGOS, 2, 'Encabezado'),
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
