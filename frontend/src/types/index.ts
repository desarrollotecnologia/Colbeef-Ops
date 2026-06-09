export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'OPERARIO';
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

export interface FormatField {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  manualOnly: boolean;
  options?: unknown;
  placeholder?: string;
  defaultValue?: string;
  groupName?: string;
  helpText?: string;
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
  format?: Format;
  operator?: { id: string; fullName: string };
  reviewedBy?: { id: string; fullName: string };
  sheets?: FormSubmissionSheet[];
  signature?: { signedAt: string; notes?: string };
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
