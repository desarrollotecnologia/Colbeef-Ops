import type { ChecklistItemData, FormatField } from '@/types';
import { formatDisplayValue } from '@/lib/formUtils';

interface Props {
  field: FormatField;
  value: unknown;
}

export default function FieldDisplay({ field, value }: Props) {
  const opts = field.options ?? {};

  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-400">—</span>;
  }

  if (field.fieldType === 'PHOTO' && typeof value === 'string') {
    return <img src={value} alt={field.label} className="max-h-32 rounded border border-gray-200" />;
  }

  if (field.fieldType === 'CHECKLIST' && opts.layout === 'day_schedule_table') {
    const data = value as Record<string, { cloro_residual?: string; temperatura?: string; cnc?: string; observaciones?: string }>;
    const rows = Object.entries(data ?? {});
    if (rows.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <div className="space-y-1 text-xs">
        {rows.map(([key, row]) => (
          <div key={key} className="border-l-2 border-primary-300 pl-2">
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
            {row.cloro_residual && <span className="ml-2">Cloro: {row.cloro_residual} ppm</span>}
            {row.temperatura && <span className="ml-2">Temp: {row.temperatura}°C</span>}
            {row.cnc && <span className={`ml-2 px-1 rounded font-bold ${row.cnc === 'C' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.cnc}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (field.fieldType === 'CHECKLIST' && opts.items) {
    const data = value as Record<string, ChecklistItemData>;
    const items = opts.items ?? [];
    return (
      <div className="space-y-2">
        {items.map((item) => {
          const d = data[item.key];
          if (!d) return null;
          return (
            <div key={item.key} className="text-sm border-l-2 border-primary-300 pl-2">
              <span className="font-medium">{item.label}</span>
              {d.cnc && <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${d.cnc === 'C' ? 'bg-green-100 text-green-800' : d.cnc === 'NC' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{d.cnc}</span>}
              {d.observation && <p className="text-gray-600 text-xs mt-0.5">Obs: {d.observation}</p>}
              {d.corrective && <p className="text-gray-600 text-xs">Corr: {d.corrective}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  if (field.fieldType === 'CHECKLIST' || field.fieldType === 'RADIO') {
    const v = String(value);
    const color = v === 'C' || v === 'Encendido' ? 'bg-green-100 text-green-800' : v === 'NC' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-0.5 rounded text-sm font-semibold ${color}`}>{v}</span>;
  }

  if (field.fieldType === 'MULTI_SELECT' && Array.isArray(value)) {
    return <span>{(value as string[]).join(', ')}</span>;
  }

  if (field.fieldType === 'REPEATER' && Array.isArray(value)) {
    return <span className="text-sm text-gray-600">{(value as unknown[]).length} registro(s)</span>;
  }

  if (field.fieldType === 'REPEATER' && typeof value === 'object') {
    const areas = Object.keys(value as object);
    return <span className="text-sm text-gray-600">{areas.length} área(s) registradas</span>;
  }

  if (Array.isArray(value)) {
    return <span>{(value as string[]).join(', ')}</span>;
  }

  return <span>{formatDisplayValue(value)}</span>;
}
