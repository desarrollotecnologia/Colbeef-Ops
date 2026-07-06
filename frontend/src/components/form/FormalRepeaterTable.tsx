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
        className={`${INPUT_CLASS} text-xs py-1`}
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
      <div className="flex flex-wrap gap-0.5">
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
              className={`px-1.5 py-0.5 text-[10px] rounded border ${
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
    const textInput = isTemperatureInput(col.key, col.label);
    return (
      <input
        type={textInput ? 'text' : 'number'}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={textInput ? undefined : col.config?.min}
        max={textInput ? undefined : col.config?.max}
        className={`${INPUT_CLASS} text-xs py-1`}
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
        className={`${INPUT_CLASS} text-xs py-1`}
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
        className={`${INPUT_CLASS} text-xs py-1`}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="—"
      className={`${INPUT_CLASS} text-xs py-1`}
    />
  );
}

export default function FormalRepeaterTable({ options, value, onChange, disabled }: Props) {
  const columns = (options.columns_def ?? options.columns ?? []).filter(
    (c): c is RepeaterColumn => typeof c === 'object' && c !== null && 'key' in c
  );
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 50;
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

  const thClass = 'px-2 py-2 text-left text-[10px] font-bold uppercase border-r border-gray-800 whitespace-nowrap';
  const tdClass = 'px-2 py-1.5 border-r border-b border-gray-400 align-top';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${thClass} w-8 text-center`}>#</th>
              {columns.map((col) => (
                <th key={col.key} className={thClass}>
                  {col.label}
                  {showRequiredIndicator(col.required) && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
              {!disabled && rows.length > minRows && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={`${tdClass} text-center text-xs font-semibold text-gray-500`}>{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className={`${tdClass} min-w-[80px]`}>
                    <RepeaterCell
                      col={col}
                      value={row[col.key]}
                      onChange={(v) => updateRow(idx, col.key, v)}
                      disabled={disabled}
                    />
                  </td>
                ))}
                {!disabled && rows.length > minRows && (
                  <td className="px-1 py-1 border-b border-gray-400">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && rows.length < maxRows && (
        <div className="px-3 py-2 border-t border-gray-200">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus size={14} /> Agregar fila
          </Button>
        </div>
      )}
    </div>
  );
}
