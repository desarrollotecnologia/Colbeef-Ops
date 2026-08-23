import type { FormatField } from '@/types';
import LacticoFormatoRepeater, { type LacticoRow } from './LacticoFormatoRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  variant: 'titulacion' | 'monitoreo';
  currentUserId?: string;
  currentUserName?: string;
  isSubmissionOwner?: boolean;
  ownerName?: string;
}

export default function Format18AcidoLacticoSheet({
  fields,
  sheetData,
  onUpdate,
  disabled,
  variant,
  currentUserId,
  currentUserName,
  isSubmissionOwner,
  ownerName,
}: Props) {
  const field = fields.find((f) => f.fieldKey === 'registros');
  if (!field) return null;

  const value = Array.isArray(sheetData.registros)
    ? (sheetData.registros as LacticoRow[])
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{field.label}</h3>
        {field.helpText && <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>}
      </div>
      <LacticoFormatoRepeater
        options={field.options ?? {}}
        value={value}
        onChange={(rows) => onUpdate('registros', rows)}
        disabled={disabled}
        variant={variant}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        isSubmissionOwner={isSubmissionOwner}
        ownerName={ownerName}
      />
    </div>
  );
}
