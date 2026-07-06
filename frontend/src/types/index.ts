export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'OPERARIO' | 'PANEL';
  email?: string;
}

export interface FormatSheet {
  id: string;
  name: string;
  slug: string;
  sheetOrder: number;
  fields?: FormatField[];
}

export interface Format {
  id: string;
  code: string;
  name: string;
  description?: string;
  documentCode?: string;
  sheetCount: number;
  sheets: FormatSheet[];
}

export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'CHECKBOX'
  | 'CHECKLIST'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'SIGNATURE'
  | 'AUTO'
  | 'READONLY'
  | 'REPEATER'
  | 'PHOTO';

export type AutoFillRule =
  | 'CURRENT_DATE'
  | 'CURRENT_TIME'
  | 'CURRENT_DATETIME'
  | 'CURRENT_USER'
  | 'CURRENT_USER_NAME'
  | 'FIXED_VALUE'
  | 'DAY_SCHEDULE'
  | 'CALC_MAP';

export interface FormatField {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  manualOnly: boolean;
  autoFillRule?: AutoFillRule | null;
  options?: FieldOptions;
  config?: FieldConfig;
  placeholder?: string;
  defaultValue?: string;
  groupName?: string;
  helpText?: string;
  sortOrder?: number;
}

export interface FieldConfig {
  min?: number;
  max?: number;
  value?: string;
  schedule?: Record<string, string[]>;
  map?: Record<string, string>;
  sourceField?: string;
  suffix?: string;
  requiredIf?: 'nc_or_observation';
}

export interface FieldOptions {
  layout?: 'day_schedule_table' | 'formal_measure_table' | 'formal_repeater_table' | 'cloro_residual_repeater' | 'lactico_titration_repeater' | 'card_repeater' | 'poes_operativo_table' | 'poes_bpm_table' | 'pc_inocuidad_repeater' | 'pc_operativo_table';
  tableType?: 'cloro' | 'esterilizadores' | 'temperaturas' | 'titulacion' | 'equipos' | 'pediluvios' | 'monitoreo';
  pediluviosLayout?: 'operativo' | 'simple';
  schedule?: Record<string, string[]>;
  mode?: 'cnc' | 'cnc_na';
  choices?: string[];
  multi?: boolean;
  items?: { key: string; label: string; fr?: string; section?: string; slotCount?: number; naTemp?: boolean; naPresion?: boolean }[];
  columns?:
    | ('cnc' | 'observation' | 'corrective' | 'platforms' | 'cavaColumns' | 'fr' | 'rev_cnc' | 'final_cnc' | 'responsible')[]
    | RepeaterColumn[];
  columns_def?: RepeaterColumn[];
  platformCount?: number;
  cavaColumns?: string[];
  columnDefs?: { key: string; mode?: 'cnc' | 'cnc_na' }[];
  matrix?: boolean;
  rows?: string[];
  showProm?: boolean;
  minRows?: number;
  maxRows?: number;
  entryLabel?: string;
  addButtonLabel?: string;
  note?: string;
  areaLabel?: string;
  revCncNa?: boolean;
  matrixRowLabel?: string;
  multiple?: boolean;
  maxPhotos?: number;
  valorLabel?: string;
  aspectRows?: boolean;
  monitoreoVariant?: 'tiempos' | 'sanitario' | 'lavado' | 'temperatura';
  pcOperativoVariant?: 'codigo_responsable' | 'codigo_operario' | 'operario_cnc' | 'proceso_tiempos' | 'proceso_tiempos_cnc' | 'esterilizadores';
  operarioLabel?: string;
  allowAddEquipos?: boolean;
  equiposIzq?: { key: string; label: string }[];
  equiposDer?: { key: string; label: string }[];
}

export interface RepeaterColumn {
  key: string;
  label: string;
  type: FieldType | string;
  options?: FieldOptions;
  config?: FieldConfig;
  required?: boolean;
}

/** Fila de tablas de medición (formato 2 hoja 1) */
export interface MeasureRowData {
  hora?: string;
  turno?: string;
  valor?: string;
  codigo?: string;
  cantidad?: string;
  tiempo?: string;
  operario?: string;
  responsable?: string;
  minutos?: string;
  punto_toma?: string;
  cloro_residual?: string;
  temperatura?: string;
  presion?: string;
  volumen_naoh?: string;
  concentracion?: string;
  principio_activo?: string;
  estado?: string;
  cnc?: string;
  observation?: string;
  corrective?: string;
}

/** Datos de un ítem en checklist por equipos/áreas */
export interface ChecklistItemData {
  cnc?: string;
  rev_cnc?: string;
  final_cnc?: string;
  observation?: string;
  corrective?: string;
  /** Observaciones por bloque de cavas (matriz dividida en pantalla) */
  observations?: Record<string, string>;
  /** Acciones correctivas por bloque de cavas */
  correctives?: Record<string, string>;
  responsible?: string;
  platforms?: Record<string, string>;
  cavas?: Record<string, string>;
}

export type SubmissionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface FormSubmission {
  id: string;
  formatId: string;
  operatorId: string;
  workDate: string;
  status: SubmissionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  updatedAt?: string;
  createdAt?: string;
  format?: Format;
  operator?: { id: string; fullName: string };
  reviewedBy?: { id: string; fullName: string };
  sheets?: FormSubmissionSheet[];
  signature?: { signedAt: string; notes?: string; admin?: { fullName: string } };
}

export interface FormSubmissionSheet {
  id: string;
  sheetId: string;
  data: Record<string, unknown>;
  sheet?: FormatSheet & { fields?: FormatField[] };
}

export interface MissingField {
  sheet: string;
  field: string;
  label: string;
}
