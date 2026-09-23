/**
 * AC-FR-008 — Inspección de Bienestar Animal.
 * Multi-día, colaboradores (sin bloqueo por fila), cualquiera puede entregar, domingos OK.
 */
import {
  FieldDef,
  repeaterField,
  textField,
  textareaField,
  selectField,
} from '../field-helpers';

const MARK_HINT =
  'Marcas por animal (JSON). Calcula % = cantidad de X / tamaño de muestra.';

function marksField(key: string, label: string, sort: number, sampleSize: number): FieldDef {
  return textareaField(key, label, sort, {
    groupName: 'Criterios animales',
    helpText: `${MARK_HINT} Muestra: ${sampleSize}.`,
    defaultValue: '[]',
  });
}

const CONSOLIDADO_CRITERIOS = [
  { key: 'c1', label: '1. Eficacia aturdimiento 1er disparo' },
  { key: 'c2', label: '2. Intervalo aturdimiento–sangrado' },
  { key: 'c3', label: '3. Insensibles en riel de sangrado' },
  { key: 'c4', label: '4. Tiempo de sangría' },
  { key: 'c5', label: '5. Resbalones/caídas manejo' },
  { key: 'c6', label: '6. Uso de tábanos eléctricos' },
  { key: 'c7', label: '7. Vocalización' },
  { key: 'c8', label: '8. Resbalones/caídas desembarco' },
  { key: 'c9', label: '9. Actos de abuso' },
  { key: 'c10_1', label: '10.1 Aristas/salientes en corrales' },
  { key: 'c10_2', label: '10.2 Densidad animal adecuada' },
  { key: 'c10_3', label: '10.3 Bebederos en funcionamiento' },
  { key: 'c10_4', label: '10.4 Sombra en buen estado' },
  { key: 'c10_5', label: '10.5 Áreas adyacentes' },
  { key: 'c10_6', label: '10.6 Acceso a agua limpia' },
  { key: 'c11', label: '11. Estado instalaciones acceso' },
  { key: 'c12', label: '12. Desviaciones transporte' },
  { key: 'c13', label: '13. Tiempos reposo y alimentación' },
] as const;

export function getFormat22Fields(slug: string): FieldDef[] {
  if (slug === 'consolidado-mes') {
    const fields: FieldDef[] = [
      textField('mes_en_curso', 'Mes en curso', 1, { required: true, groupName: 'Consolidado' }),
    ];
    let order = 10;
    for (const c of CONSOLIDADO_CRITERIOS) {
      for (const week of ['s1', 's2', 's3', 's4', 'acum'] as const) {
        const weekLabel =
          week === 'acum' ? 'Acumulado mes' : `Semana ${week.slice(1)}`;
        fields.push(
          textField(`${c.key}_${week}`, `${c.label} — ${weekLabel}`, order++, {
            groupName: 'Consolidado mes',
          })
        );
      }
    }
    fields.push(
      textField('total_cumplimiento_mes', 'TOTAL CUMPLIMIENTO PROGRAMA BIENESTAR ANIMAL', order++, {
        groupName: 'Consolidado mes',
      }),
      {
        ...repeaterField('registros', 'Consolidado', [], order++, {
          groupName: 'Consolidado',
          required: false,
        }),
        options: {
          layout: 'bienestar_consolidado_formato',
          minRows: 0,
          maxRows: 0,
        },
      }
    );
    return fields;
  }

  // Hoja FORMATO
  return [
    textField('inspectores', 'Inspector(es)', 1, { required: true, groupName: 'Encabezado' }),
    textField('metodo_aturdimiento', 'Método de aturdimiento', 2, {
      groupName: 'Encabezado',
      defaultValue: 'PISTOLA DE PERNO CAUTIVO PENETRANTE',
    }),
    textField('auxiliar_insensibilizado', 'Auxiliar de línea responsable del insensibilizado', 3, {
      groupName: 'Encabezado',
    }),
    textField('auxiliar_enmangado', 'Auxiliar de corrales responsable de enmangado', 4, {
      groupName: 'Encabezado',
    }),

    marksField('c1_marks', '1. Eficacia aturdimiento — marcas (50)', 10, 50),
    textareaField('c1_obs', '1. Observaciones', 11, { groupName: 'Criterio 1' }),

    marksField('c2_marks', '2. Intervalo aturdimiento–sangrado — marcas (50)', 20, 50),
    textareaField('c2_obs', '2. Observaciones', 21, { groupName: 'Criterio 2' }),

    marksField('c3_marks', '3. Insensibles en riel — marcas (50)', 30, 50),
    textareaField('c3_obs', '3. Observaciones', 31, { groupName: 'Criterio 3' }),

    marksField('c4_marks', '4. Tiempo de sangría — marcas (50)', 40, 50),
    textareaField('c4_obs', '4. Observaciones', 41, { groupName: 'Criterio 4' }),

    marksField('c5_marks', '5. Resbalones/caídas manejo — marcas (50)', 50, 50),
    textareaField('c5_obs', '5. Observaciones', 51, { groupName: 'Criterio 5' }),

    marksField('c6_marks', '6. Uso de tábanos — marcas (50)', 60, 50),
    textareaField('c6_obs', '6. Observaciones', 61, { groupName: 'Criterio 6' }),

    marksField('c7_marks', '7. Vocalización — marcas (50)', 70, 50),
    textareaField('c7_obs', '7. Observaciones', 71, { groupName: 'Criterio 7' }),

    marksField('c8_marks', '8. Resbalones/caídas desembarco — marcas (100)', 80, 100),
    textareaField('c8_obs', '8. Observaciones', 81, { groupName: 'Criterio 8' }),

    selectField('c9_actos_abuso', '9. ¿Se presentaron actos de abuso?', ['SI', 'NO'], 90, {
      groupName: 'Criterio 9',
      required: true,
    }),
    textareaField('c9_obs', '9. Observaciones', 91, { groupName: 'Criterio 9' }),

    textField('c10_1_corral', '10.1 Corral #', 100, { groupName: 'Criterio 10' }),
    selectField('c10_1', '10.1 Aristas/salientes (¿presentan?)', ['SI', 'NO'], 101, {
      groupName: 'Criterio 10',
    }),
    textField('c10_2_corral', '10.2 Corral #', 102, { groupName: 'Criterio 10' }),
    selectField('c10_2', '10.2 Densidad animal adecuada', ['SI', 'NO'], 103, {
      groupName: 'Criterio 10',
    }),
    textField('c10_3_corral', '10.3 Corral #', 104, { groupName: 'Criterio 10' }),
    selectField('c10_3', '10.3 Bebederos en funcionamiento', ['SI', 'NO'], 105, {
      groupName: 'Criterio 10',
    }),
    textField('c10_4_corral', '10.4 Corral #', 106, { groupName: 'Criterio 10' }),
    selectField('c10_4', '10.4 Sombra en buen estado', ['SI', 'NO'], 107, {
      groupName: 'Criterio 10',
    }),
    textField('c10_5_corral', '10.5 Corral #', 108, { groupName: 'Criterio 10' }),
    selectField('c10_5', '10.5 Áreas adyacentes con materiales/aristas', ['SI', 'NO'], 109, {
      groupName: 'Criterio 10',
    }),
    textField('c10_6_corral', '10.6 Corral #', 110, { groupName: 'Criterio 10' }),
    selectField('c10_6', '10.6 Acceso a agua limpia', ['SI', 'NO'], 111, {
      groupName: 'Criterio 10',
    }),
    selectField('c10_desviaciones', '10. ¿Se presentaron desviaciones?', ['SI', 'NO'], 112, {
      groupName: 'Criterio 10',
      required: true,
    }),
    textareaField('c10_obs', '10. Observaciones', 113, { groupName: 'Criterio 10' }),

    selectField('c11_vias', '11. Vías de acceso en buen estado', ['SI', 'NO'], 120, {
      groupName: 'Criterio 11',
    }),
    selectField('c11_acoples', '11. Desembarcaderos con acoples correctos', ['SI', 'NO'], 121, {
      groupName: 'Criterio 11',
    }),
    selectField('c11_antideslizante', '11. Desembarcaderos con piso antideslizante', ['SI', 'NO'], 122, {
      groupName: 'Criterio 11',
    }),
    selectField('c11_aristas', '11. Pisos/barandas presentan aristas', ['SI', 'NO'], 123, {
      groupName: 'Criterio 11',
    }),
    textareaField('c11_obs', '11. Observaciones', 124, { groupName: 'Criterio 11' }),

    selectField('c12_desviaciones', '12. ¿Desviaciones por transporte?', ['SI', 'NO'], 130, {
      groupName: 'Criterio 12',
      required: true,
    }),
    textareaField('c12_obs', '12. Observaciones', 131, { groupName: 'Criterio 12' }),

    selectField('c13_desviaciones', '13. ¿Desviaciones por reposo/alimentación?', ['SI', 'NO'], 140, {
      groupName: 'Criterio 13',
      required: true,
    }),
    textareaField('c13_obs', '13. Observaciones', 141, { groupName: 'Criterio 13' }),

    textareaField('observaciones_adicionales', 'Observaciones adicionales', 150, {
      groupName: 'Cierre',
    }),

    {
      ...repeaterField('registros', 'Inspección bienestar animal', [], 160, {
        groupName: 'Formato',
        required: true,
        helpText: 'Formato AC-FR-008 con cálculo automático de % y CUMPLE/NO CUMPLE.',
      }),
      options: {
        layout: 'bienestar_animal_formato',
        minRows: 0,
        maxRows: 0,
        note: 'Fórmulas Excel: % = COUNTIF(X)/muestra · umbrales 96/100/100/100/98/75/96/98% · puntaje /18',
      },
    },
  ];
}
