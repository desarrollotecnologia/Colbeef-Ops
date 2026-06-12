/**
 * Helpers para definir campos de formatos en el seed de Prisma.
 */
import { AutoFillRule, FieldType, Prisma } from '@prisma/client';

export type FieldDef = {
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  required?: boolean;
  manualOnly?: boolean;
  autoFillRule?: AutoFillRule | null;
  options?: Prisma.InputJsonValue;
  config?: Prisma.InputJsonValue;
  placeholder?: string;
  defaultValue?: string;
  groupName?: string;
  helpText?: string;
  sortOrder: number;
};

export function readonlyField(
  fieldKey: string,
  label: string,
  defaultValue: string,
  sortOrder: number,
  groupName?: string
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.READONLY,
    manualOnly: false,
    defaultValue,
    sortOrder,
    groupName,
  };
}

export function autoField(
  fieldKey: string,
  label: string,
  rule: AutoFillRule,
  sortOrder: number,
  groupName?: string,
  config?: Record<string, unknown>
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.AUTO,
    manualOnly: false,
    autoFillRule: rule,
    sortOrder,
    groupName,
    config,
  };
}

export function textField(
  fieldKey: string,
  label: string,
  sortOrder: number,
  opts?: Partial<FieldDef>
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.TEXT,
    required: false,
    manualOnly: true,
    sortOrder,
    ...opts,
  };
}

export function numberField(
  fieldKey: string,
  label: string,
  sortOrder: number,
  opts?: Partial<FieldDef> & { min?: number; max?: number }
): FieldDef {
  const { min, max, ...rest } = opts ?? {};
  return {
    fieldKey,
    label,
    fieldType: FieldType.NUMBER,
    manualOnly: true,
    sortOrder,
    config: min !== undefined || max !== undefined ? { min, max } : undefined,
    ...rest,
  };
}

export function timeField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return { fieldKey, label, fieldType: FieldType.TIME, manualOnly: true, sortOrder, ...opts };
}

export function dateField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return { fieldKey, label, fieldType: FieldType.DATE, manualOnly: true, sortOrder, ...opts };
}

export function textareaField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return { fieldKey, label, fieldType: FieldType.TEXTAREA, manualOnly: true, sortOrder, ...opts };
}

/** C / NC simple */
export function cncField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.CHECKLIST,
    manualOnly: true,
    sortOrder,
    options: { mode: 'cnc', choices: ['C', 'NC'] },
    ...opts,
  };
}

/** C / NC / NA */
export function cncNaField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.CHECKLIST,
    manualOnly: true,
    sortOrder,
    options: { mode: 'cnc_na', choices: ['C', 'NC', 'NA'] },
    ...opts,
  };
}

/** Multi-selección (especie, hallazgos, etc.) */
export function multiSelectField(
  fieldKey: string,
  label: string,
  choices: string[],
  sortOrder: number,
  opts?: Partial<FieldDef>
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.MULTI_SELECT,
    manualOnly: true,
    sortOrder,
    options: { choices, multi: true },
    ...opts,
  };
}

/** Selección única */
export function selectField(
  fieldKey: string,
  label: string,
  choices: string[],
  sortOrder: number,
  opts?: Partial<FieldDef>
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.SELECT,
    manualOnly: true,
    sortOrder,
    options: { choices },
    ...opts,
  };
}

/** Encendido / Apagado */
export function powerStateField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.RADIO,
    manualOnly: true,
    sortOrder,
    options: { choices: ['Encendido', 'Apagado'] },
    ...opts,
  };
}

/** Checklist por ítems (equipos, áreas) con C/NC + observación + corrección opcional */
export function itemChecklistField(
  fieldKey: string,
  label: string,
  items: { key: string; label: string; fr?: string; section?: string }[],
  sortOrder: number,
  opts?: Partial<FieldDef> & {
    mode?: 'cnc' | 'cnc_na';
    columns?: ('cnc' | 'observation' | 'corrective' | 'platforms' | 'cavaColumns')[];
    platformCount?: number;
    cavaColumns?: string[];
    columnDefs?: { key: string; mode?: 'cnc' | 'cnc_na' }[];
    areaLabel?: string;
    matrixRowLabel?: string;
  }
): FieldDef {
  const mode = opts?.mode ?? 'cnc';
  return {
    fieldKey,
    label,
    fieldType: FieldType.CHECKLIST,
    manualOnly: true,
    sortOrder,
    groupName: opts?.groupName,
    helpText: opts?.helpText,
    required: opts?.required,
    options: {
      mode,
      choices: mode === 'cnc_na' ? ['C', 'NC', 'NA'] : ['C', 'NC'],
      items,
      columns: opts?.columns ?? ['cnc', 'observation', 'corrective'],
      platformCount: opts?.platformCount,
      cavaColumns: opts?.cavaColumns,
      columnDefs: opts?.columnDefs,
      areaLabel: opts?.areaLabel,
      matrixRowLabel: opts?.matrixRowLabel,
    },
  };
}

/** Filas repetibles (códigos canal, productos despacho, cortes por hora) */
export function repeaterField(
  fieldKey: string,
  label: string,
  columns: FieldDef[],
  sortOrder: number,
  opts?: Partial<FieldDef> & { minRows?: number; maxRows?: number; formalTable?: boolean }
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.REPEATER,
    manualOnly: true,
    sortOrder,
    groupName: opts?.groupName,
    helpText: opts?.helpText,
    required: opts?.required,
    options: {
      layout: opts?.formalTable !== false ? 'formal_repeater_table' : undefined,
      columns: columns.map(({ fieldKey: k, label: l, fieldType: t, options, config, required }) => ({
        key: k,
        label: l,
        type: t,
        options,
        config,
        required,
      })),
      minRows: opts?.minRows ?? 1,
      maxRows: opts?.maxRows ?? 50,
    },
  };
}

/** Foto (etiquetas hoja 5 proceso desposte) */
export function photoField(fieldKey: string, label: string, sortOrder: number, opts?: Partial<FieldDef>): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.PHOTO,
    manualOnly: true,
    sortOrder,
    ...opts,
  };
}

/** Matriz hora × área (temperaturas) */
export function hourlyMatrixField(
  fieldKey: string,
  label: string,
  rows: string[],
  sortOrder: number,
  opts?: Partial<FieldDef> & { showProm?: boolean; note?: string }
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.REPEATER,
    manualOnly: true,
    sortOrder,
    groupName: opts?.groupName,
    helpText: opts?.note ?? opts?.helpText,
    options: {
      matrix: true,
      rows,
      showProm: opts?.showProm ?? false,
      columns: [
        { key: 'hora', label: 'Hora', type: 'TIME' },
        { key: 'temperatura', label: 'Temperatura °C', type: 'NUMBER' },
        { key: 'observaciones', label: 'Observaciones', type: 'TEXT', required: false },
      ],
    },
  };
}

export type MeasureTableType = 'cloro' | 'temperaturas' | 'titulacion' | 'equipos' | 'pediluvios';

/** Tabla formal de medición (formato 2 hoja 1) */
export function formalMeasureTableField(
  fieldKey: string,
  label: string,
  tableType: MeasureTableType,
  rows: { key: string; label: string; naTemp?: boolean; naPresion?: boolean }[],
  sortOrder: number,
  groupName: string,
  opts?: Partial<FieldDef> & { pediluviosLayout?: 'operativo' | 'simple' }
): FieldDef {
  const { pediluviosLayout, ...fieldOpts } = opts ?? {};
  return {
    fieldKey,
    label,
    fieldType: FieldType.CHECKLIST,
    manualOnly: true,
    required: fieldOpts.required ?? true,
    sortOrder,
    groupName,
    helpText: fieldOpts.helpText,
    options: {
      layout: 'formal_measure_table',
      tableType,
      items: rows,
      ...(pediluviosLayout ? { pediluviosLayout } : {}),
    },
  };
}

/** Tabla con una fila por punto del día (cloro / esterilizadores) */
export function dayScheduleTableField(
  fieldKey: string,
  label: string,
  schedule: Record<string, string[]>,
  sortOrder: number,
  groupName: string,
  tableType: 'cloro' | 'esterilizadores'
): FieldDef {
  return {
    fieldKey,
    label,
    fieldType: FieldType.CHECKLIST,
    manualOnly: true,
    required: true,
    sortOrder,
    groupName,
    options: {
      layout: 'day_schedule_table',
      schedule,
      tableType,
    },
    config: { schedule },
  };
}

/** Puntos automáticos por día de la semana */
export function dayScheduleField(
  fieldKey: string,
  label: string,
  schedule: Record<string, string[]>,
  sortOrder: number,
  groupName?: string
): FieldDef {
  return autoField(fieldKey, label, AutoFillRule.DAY_SCHEDULE, sortOrder, groupName, { schedule });
}

/** Concentración auto según volumen */
export function lacticoTitrationField(sortOrder: number): FieldDef[] {
  return [
    timeField('titulacion_hora', 'Hora', sortOrder, { groupName: 'Titulación ácido láctico' }),
    selectField(
      'titulacion_volumen',
      'Volumen NaOH (ml)',
      ['2.2', '2.3'],
      sortOrder + 1,
      { groupName: 'Titulación ácido láctico', required: true }
    ),
    autoField(
      'titulacion_concentracion',
      'Concentración AC láctico 2%',
      AutoFillRule.CALC_MAP,
      sortOrder + 2,
      'Titulación ácido láctico',
      { map: { '2.2': '1.98', '2.3': '2.07' }, sourceField: 'titulacion_volumen', suffix: '%' }
    ),
    cncField('titulacion_cnc', 'Cumple / No cumple', sortOrder + 3, {
      groupName: 'Titulación ácido láctico',
      required: true,
    }),
    textareaField('titulacion_correccion', 'Corrección', sortOrder + 4, {
      groupName: 'Titulación ácido láctico',
      config: { requiredIf: 'nc_or_observation' },
    }),
  ];
}

/** Bloque cloro estándar */
export function cloroBlock(sortOrder: number, groupName: string, puntoToma?: 'text' | 'lavamanos'): FieldDef[] {
  const fields: FieldDef[] = [
    timeField(`${groupName.replace(/\s/g, '_').toLowerCase()}_hora`, 'Hora', sortOrder, { groupName }),
  ];
  if (puntoToma === 'lavamanos') {
    fields.push(
      multiSelectField(
        `${groupName.replace(/\s/g, '_').toLowerCase()}_punto_toma`,
        'Punto de toma (Lavamanos)',
        Array.from({ length: 15 }, (_, i) => `Lavamanos #${i + 1}`),
        sortOrder + 1,
        { groupName, required: true }
      )
    );
  } else {
    fields.push(
      textField(`${groupName.replace(/\s/g, '_').toLowerCase()}_punto_toma`, 'Punto de toma', sortOrder + 1, {
        groupName,
        required: true,
      })
    );
  }
  fields.push(
    numberField(`${groupName.replace(/\s/g, '_').toLowerCase()}_cloro`, 'Cloro residual (0.3 - 2.0 ppm)', sortOrder + 2, {
      groupName,
      required: true,
      min: 0.3,
      max: 2.0,
    }),
    cncField(`${groupName.replace(/\s/g, '_').toLowerCase()}_cnc`, 'C / NC', sortOrder + 3, { groupName, required: true }),
    textareaField(`${groupName.replace(/\s/g, '_').toLowerCase()}_correccion`, 'Corrección', sortOrder + 4, {
      groupName,
      config: { requiredIf: 'nc_or_observation' },
    })
  );
  return fields;
}

/** Pediluvios (3 casillas) */
export function pediluviosBlock(sortOrder: number, count = 3): FieldDef[] {
  const fields: FieldDef[] = [];
  for (let i = 1; i <= count; i++) {
    const g = `Pediluvios ${i}`;
    fields.push(
      timeField(`pediluvio_${i}_hora`, 'Hora', sortOrder + (i - 1) * 5, { groupName: g }),
      textField(`pediluvio_${i}_principio`, 'Principio activo', sortOrder + (i - 1) * 5 + 1, { groupName: g }),
      textField(`pediluvio_${i}_concentracion`, 'Concentración (ppm)', sortOrder + (i - 1) * 5 + 2, { groupName: g }),
      cncField(`pediluvio_${i}_cnc`, 'C / NC', sortOrder + (i - 1) * 5 + 3, { groupName: g, required: true }),
      textareaField(`pediluvio_${i}_correccion`, 'Corrección', sortOrder + (i - 1) * 5 + 4, {
        groupName: g,
        config: { requiredIf: 'nc_or_observation' },
      })
    );
  }
  return fields;
}

export const DAY_SCHEDULE_PUNTOS_INSPECCIONADOS: Record<string, string[]> = {
  monday: ['Sangría', 'Segunda pierna', 'Desolladora'],
  tuesday: ['Tolerancia cero', 'Área de cabezas', 'Eviscerado de blancas'],
  wednesday: ['Patas y manos', 'Víscera roja', 'Marcación canales'],
  thursday: ['Sierra pecho', 'Víscera blanca', 'Ins. de canales'],
  friday: ['Sierra canal', 'Lavado de canales', 'Desuello de brazo'],
  saturday: ['Sangría', 'Patas y manos', 'Lavado de canales'],
};

export const DAY_SCHEDULE_PUNTOS_ESTERILIZADORES: Record<string, string[]> = {
  monday: ['Sierra canal', 'Sierra pecho', 'Clipado de esófago', 'Corte de grandes vasos'],
  tuesday: ['Víscera roja', 'Limpieza inferior', 'Desolladora', 'Vuelta'],
  wednesday: ['Sierra pecho', 'Clipado de esófago', 'Víscera blanca', 'Tobogán de víscera blanca'],
  thursday: ['Sierra canal', 'Sierra pecho', 'Limpieza inferior', 'Desolladora'],
  friday: ['Clipado de esófago', 'Corte de grandes vasos', 'Víscera roja', 'Vuelta'],
  saturday: ['Sierra canal', 'Sierra pecho', 'Corte de grandes vasos', 'Desolladora'],
};

export const HALLAZGOS_DESPOSTE = ['CR', 'MF', 'LV', 'PELO'];
export const HALLAZGOS_FORANEAS = ['CR', 'MF', 'LV', 'PELO', 'HM', 'GS'];
export const ESPECIES = ['Bovino', 'Bufalino', 'Porcino'];
