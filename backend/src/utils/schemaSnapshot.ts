import type { FormatField, FormatSheet, Prisma } from '@prisma/client';

export type SnapshotField = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  manualOnly: boolean;
  autoFillRule: string | null;
  options: Prisma.JsonValue | null;
  config: Prisma.JsonValue | null;
  placeholder: string | null;
  defaultValue: string | null;
  sortOrder: number;
  groupName: string | null;
  helpText: string | null;
};

export type SnapshotSheet = {
  id: string;
  name: string;
  slug: string;
  sheetOrder: number;
  fields: SnapshotField[];
};

export type FormatSchemaSnapshot = {
  frozenAt: string;
  sheets: SnapshotSheet[];
};

type SheetWithFields = FormatSheet & { fields: FormatField[] };

export function buildFormatSchemaSnapshot(sheets: SheetWithFields[]): FormatSchemaSnapshot {
  return {
    frozenAt: new Date().toISOString(),
    sheets: sheets.map((sheet) => ({
      id: sheet.id,
      name: sheet.name,
      slug: sheet.slug,
      sheetOrder: sheet.sheetOrder,
      fields: sheet.fields.map((f) => ({
        id: f.id,
        fieldKey: f.fieldKey,
        label: f.label,
        fieldType: f.fieldType,
        required: f.required,
        manualOnly: f.manualOnly,
        autoFillRule: f.autoFillRule,
        options: f.options ?? null,
        config: f.config ?? null,
        placeholder: f.placeholder,
        defaultValue: f.defaultValue,
        sortOrder: f.sortOrder,
        groupName: f.groupName,
        helpText: f.helpText,
      })),
    })),
  };
}

/**
 * Para envíos ya entregados/aprobados/rechazados con foto del esquema,
 * sustituye los campos vivos del formato por los congelados al entregar.
 * Borradores sin snapshot siguen usando la definición actual.
 */
export function applySchemaSnapshotToFormat<
  T extends {
    status: string;
    schemaSnapshot?: Prisma.JsonValue | null;
    format?: {
      sheets?: Array<{
        id: string;
        name: string;
        slug: string;
        sheetOrder: number;
        fields?: FormatField[] | SnapshotField[];
      }>;
    } | null;
  },
>(submission: T): T {
  const frozenStatuses = new Set(['PENDING_REVIEW', 'APPROVED', 'REJECTED']);
  if (!frozenStatuses.has(submission.status) || !submission.schemaSnapshot || !submission.format?.sheets) {
    return submission;
  }

  const snapshot = submission.schemaSnapshot as unknown as FormatSchemaSnapshot;
  if (!snapshot?.sheets?.length) return submission;

  const byId = new Map(snapshot.sheets.map((s) => [s.id, s]));
  const bySlug = new Map(snapshot.sheets.map((s) => [s.slug, s]));

  return {
    ...submission,
    format: {
      ...submission.format,
      sheets: submission.format.sheets.map((sheet) => {
        const frozen = byId.get(sheet.id) ?? bySlug.get(sheet.slug);
        if (!frozen) return sheet;
        return {
          ...sheet,
          name: frozen.name,
          slug: frozen.slug,
          sheetOrder: frozen.sheetOrder,
          fields: frozen.fields as FormatField[],
        };
      }),
    },
  };
}
