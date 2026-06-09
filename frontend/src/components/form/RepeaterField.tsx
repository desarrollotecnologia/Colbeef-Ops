import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions, RepeaterColumn } from '@/types';
import ChoiceButtons from './ChoiceButtons';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

interface Props {
  options: FieldOptions;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  disabled?: boolean;
}

function RepeaterCell({
  col,
  value,
  onChange,
  disabled,
}: {
  col: RepeaterColumn;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  const type = col.type as string;

  if (type === 'CHECKLIST') {
    const choices = col.options?.choices ?? ['C', 'NC'];
    return (
      <ChoiceButtons
        choices={choices}
        value={String(value ?? '')}
        onChange={onChange}
        disabled={disabled}
        size="sm"
      />
    );
  }

  if (type === 'SELECT') {
    const choices = col.options?.choices ?? [];
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      >
        <option value="">—</option>
        {choices.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    );
  }

  if (type === 'MULTI_SELECT') {
    const choices = col.options?.choices ?? [];
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-wrap gap-1">
        {choices.map((c) => {
          const active = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = active ? selected.filter((s) => s !== c) : [...selected, c];
                onChange(next);
              }}
              className={`px-2 py-0.5 text-xs rounded border ${
                active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-300'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'NUMBER') {
    return (
      <input
        type="number"
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={col.config?.min}
        max={col.config?.max}
        className={INPUT_CLASS}
      />
    );
  }

  if (type === 'TIME') {
    return (
      <input
        type="time"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      />
    );
  }

  if (type === 'DATE') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={INPUT_CLASS}
    />
  );
}

export default function RepeaterField({ options, value, onChange, disabled }: Props) {
  const columns = options.columns_def ?? [];
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 50;
  const rows = value.length >= minRows ? value : Array.from({ length: minRows }, () => ({}));

  const updateRow = (idx: number, key: string, val: unknown) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  const addRow = () => {
    if (rows.length < maxRows) onChange([...rows, {}]);
  };

  const removeRow = (idx: number) => {
    if (rows.length > minRows) onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">#{idx + 1}</span>
            {!disabled && rows.length > minRows && (
              <button type="button" onClick={() => removeRow(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {columns.map((col) => (
              <div key={col.key}>
                <label className="text-xs text-gray-600 mb-1 block">
                  {col.label}
                  {col.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <RepeaterCell
                  col={col}
                  value={row[col.key]}
                  onChange={(v) => updateRow(idx, col.key, v)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {!disabled && rows.length < maxRows && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus size={14} /> Agregar fila
        </Button>
      )}
    </div>
  );
}
