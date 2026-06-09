import type { FormatField } from '@/types';

interface Props {
  field: FormatField;
  value: unknown;
}

export default function AutoValue({ field, value }: Props) {
  const display = Array.isArray(value)
    ? (value as string[]).join(' · ')
    : String(value ?? field.defaultValue ?? '—');

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-900 min-h-[42px] flex items-center">
      <span className="flex-1">{display || '—'}</span>
      <span className="ml-2 text-[10px] uppercase font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
        Auto
      </span>
    </div>
  );
}
