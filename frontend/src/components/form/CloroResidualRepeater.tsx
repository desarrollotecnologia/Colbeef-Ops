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

function CloroCell({
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
        <option value="">Seleccionar lavamanos…</option>
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

export default function CloroResidualRepeater({ options, value, onChange, disabled }: Props) {
  const columns = getColumns(options);
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 12;
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

  const col = (key: string) => columns.find((c) => c.key === key);

  return (
    <div className="p-4 space-y-4">
      {rows.map((row, idx) => (
        <div key={idx} className="border border-gray-300 rounded-lg bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold uppercase text-gray-700">Monitoreo #{idx + 1}</span>
            {!disabled && rows.length > minRows && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="text-red-500 p-1 hover:bg-red-50 rounded"
                title="Eliminar monitoreo"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {col('hora') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {col('hora')!.label}
                  {showRequiredIndicator(col('hora')!.required) && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <CloroCell
                  col={col('hora')!}
                  value={row.hora}
                  onChange={(v) => updateRow(idx, 'hora', v)}
                  disabled={disabled}
                />
              </div>
            )}
            {col('punto_toma') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {col('punto_toma')!.label}
                  {showRequiredIndicator(col('punto_toma')!.required) && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <CloroCell
                  col={col('punto_toma')!}
                  value={row.punto_toma}
                  onChange={(v) => updateRow(idx, 'punto_toma', v)}
                  disabled={disabled}
                />
              </div>
            )}
            {col('cloro_residual') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {col('cloro_residual')!.label}
                  {showRequiredIndicator(col('cloro_residual')!.required) && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <CloroCell
                  col={col('cloro_residual')!}
                  value={row.cloro_residual}
                  onChange={(v) => updateRow(idx, 'cloro_residual', v)}
                  disabled={disabled}
                />
              </div>
            )}
            {col('cnc') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {col('cnc')!.label}
                  {showRequiredIndicator(col('cnc')!.required) && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <CloroCell
                  col={col('cnc')!}
                  value={row.cnc}
                  onChange={(v) => updateRow(idx, 'cnc', v)}
                  disabled={disabled}
                />
              </div>
            )}
            {col('correccion') && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {col('correccion')!.label}
                </label>
                <CloroCell
                  col={col('correccion')!}
                  value={row.correccion}
                  onChange={(v) => updateRow(idx, 'correccion', v)}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      ))}
      {!disabled && rows.length < maxRows && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus size={14} /> Agregar monitoreo
        </Button>
      )}
    </div>
  );
}
