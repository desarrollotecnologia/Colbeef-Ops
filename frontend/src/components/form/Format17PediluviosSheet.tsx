import type { FormatField } from '@/types';
import PediluviosCambiosRepeater, { type PediluvioCambioRow } from './PediluviosCambiosRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

export default function Format17PediluviosSheet({
  fields,
  sheetData,
  onUpdate,
  disabled,
  currentUserId,
  currentUserName,
}: Props) {
  const field = fields.find((f) => f.fieldKey === 'registros');
  if (!field) return null;

  const value = Array.isArray(sheetData.registros)
    ? (sheetData.registros as PediluvioCambioRow[])
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{field.label}</h3>
        {field.helpText && <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>}
      </div>
      <PediluviosCambiosRepeater
        options={field.options ?? {}}
        value={value}
        onChange={(rows) => onUpdate('registros', rows)}
        disabled={disabled}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
