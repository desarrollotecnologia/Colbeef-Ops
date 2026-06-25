import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions, RepeaterColumn } from '@/types';
import ChoiceButtons from './ChoiceButtons';
import { INPUT_CLASS, isTemperatureInput, showRequiredIndicator } from '@/lib/formUtils';
import Button from '@/components/Button';

interface Props {
  options: FieldOptions;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  disabled?: boolean;
}

function getColumns(options: FieldOptions): RepeaterColumn[] {
  return (options.columns_def ?? options.columns ?? []).filter(
    (c): c is RepeaterColumn => typeof c === 'object' && c !== null && 'key' in c
  );
}

function CardCell({
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
        <option value="">Seleccione…</option>
        {choices.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    );
  }

  if (type === 'NUMBER') {
    const textInput = isTemperatureInput(col.key, col.label);
    return (
      <input
        type={textInput ? 'text' : 'number'}
        inputMode={textInput ? 'decimal' : undefined}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={textInput ? undefined : col.config?.min}
        max={textInput ? undefined : col.config?.max}
        step={textInput ? undefined : '0.01'}
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

  if (type === 'TEXTAREA') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className={`${INPUT_CLASS} resize-y`}
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

export default function CardRepeater({ options, value, onChange, disabled }: Props) {
  const columns = getColumns(options);
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 12;
  const entryLabel = options.entryLabel ?? 'Registro';
  const addButtonLabel = options.addButtonLabel ?? 'Agregar registro';
  const rows = value.length >= minRows ? value : Array.from({ length: minRows }, (): Record<string, unknown> => ({}));

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
    <div className="p-4 space-y-4">
      {rows.map((row, idx) => (
        <div key={idx} className="border border-gray-300 rounded-lg bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold uppercase text-gray-700">
              {entryLabel} #{idx + 1}
            </span>
            {!disabled && rows.length > minRows && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="text-red-500 p-1 hover:bg-red-50 rounded"
                title={`Eliminar ${entryLabel.toLowerCase()}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns.map((col) => {
              const isWide = col.type === 'TEXTAREA';
              return (
                <div key={col.key} className={isWide ? 'sm:col-span-2 lg:col-span-3' : ''}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {col.label}
                    {showRequiredIndicator(col.required) && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <CardCell
                    col={col}
                    value={row[col.key]}
                    onChange={(v) => updateRow(idx, col.key, v)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {!disabled && rows.length < maxRows && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus size={14} /> {addButtonLabel}
        </Button>
      )}
    </div>
  );
}
