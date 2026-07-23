import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS, isTemperatureInput } from '@/lib/formUtils';
import Button from '@/components/Button';

interface Props {
  options: FieldOptions;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  disabled?: boolean;
}

const KG_KEYS = ['hematoma_kg', 'absceso_kg', 'fibrosis_kg', 'vacuna_kg'] as const;

function parseNum(v: unknown): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function sumColumn(rows: Record<string, unknown>[], key: string): number {
  return rows.reduce((acc, row) => acc + parseNum(row[key]), 0);
}

/** Parcial y Total son excluyentes (como en el Excel). */
function normalizeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const parcial = String(row.decomiso_parcial ?? '');
    const total = String(row.decomiso_total ?? '');
    if (parcial === 'Parcial') return { ...row, decomiso_total: '' };
    if (total === 'Total') return { ...row, decomiso_parcial: '' };
    return row;
  });
}

function NumInput({
  value,
  onChange,
  disabled,
  min = 0,
  fieldKey,
  label,
}: {
  value: unknown;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: number;
  fieldKey: string;
  label?: string;
}) {
  const asText = isTemperatureInput(fieldKey, label);
  return (
    <input
      type={asText ? 'text' : 'number'}
      inputMode="decimal"
      min={asText ? undefined : min}
      step="any"
      value={value !== undefined && value !== null ? String(value) : ''}
      onChange={(e) => {
        const raw = e.target.value;
        if (!asText && raw !== '' && Number(raw) < min) {
          onChange(String(min));
          return;
        }
        onChange(raw);
      }}
      disabled={disabled}
      placeholder="—"
      className={`${INPUT_CLASS} text-xs py-1 text-center`}
    />
  );
}

function MarkToggle({
  active,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={active ? `Quitar ${label}` : `Marcar ${label}`}
      className={`w-full min-h-[28px] py-1 text-xs font-bold rounded border-2 ${
        active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-300 text-gray-400'
      }`}
    >
      {active ? 'X' : ''}
    </button>
  );
}

export default function DecomisosRepeater({ options, value, onChange, disabled }: Props) {
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 50;
  const rows =
    value.length >= minRows ? value : Array.from({ length: minRows }, (): Record<string, unknown> => ({}));

  const commit = (next: Record<string, unknown>[]) => onChange(normalizeRows(next));

  const updateRow = (idx: number, key: string, val: unknown) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [key]: val };
    commit(next);
  };

  const setTipo = (idx: number, tipo: 'Parcial' | 'Total') => {
    const row = rows[idx] ?? {};
    const key = tipo === 'Parcial' ? 'decomiso_parcial' : 'decomiso_total';
    const current = String(row[key] ?? '');
    const next = [...rows];
    if (current === tipo) {
      next[idx] = { ...row, decomiso_parcial: '', decomiso_total: '' };
    } else if (tipo === 'Parcial') {
      next[idx] = { ...row, decomiso_parcial: 'Parcial', decomiso_total: '' };
    } else {
      next[idx] = { ...row, decomiso_parcial: '', decomiso_total: 'Total' };
    }
    commit(next);
  };

  const addRow = () => {
    if (rows.length < maxRows) commit([...rows, {}]);
  };

  const removeRow = (idx: number) => {
    if (rows.length > minRows) commit(rows.filter((_, i) => i !== idx));
  };

  const totals = {
    unidades: sumColumn(rows, 'unidades'),
    hematoma_kg: sumColumn(rows, 'hematoma_kg'),
    absceso_kg: sumColumn(rows, 'absceso_kg'),
    fibrosis_kg: sumColumn(rows, 'fibrosis_kg'),
    vacuna_kg: sumColumn(rows, 'vacuna_kg'),
    peso_total: KG_KEYS.reduce((acc, key) => acc + sumColumn(rows, key), 0),
  };

  const th = 'px-1 py-1.5 text-center text-[9px] font-bold uppercase border border-gray-800 leading-tight';
  const td = 'px-1 py-1 border border-gray-400 align-middle';
  const showActions = !disabled && rows.length > minRows;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[780px] border-collapse">
          <thead>
            <tr className="bg-[#d9ead3]">
              <th className={`${th} w-8`} rowSpan={2}>
                #
              </th>
              <th className={`${th} min-w-[120px]`} rowSpan={2}>
                Nombre del corte
              </th>
              <th className={`${th} w-20`} rowSpan={2}>
                Unidades decomisadas
              </th>
              <th className={th} colSpan={4}>
                Causal de decomiso / kg
              </th>
              <th className={th} colSpan={2}>
                Tipo de decomiso
              </th>
              {showActions && <th className={`${th} w-8`} rowSpan={2} />}
            </tr>
            <tr className="bg-[#e8f5e3]">
              <th className={th}>Hematoma</th>
              <th className={th}>Absceso</th>
              <th className={th}>Fibrosis</th>
              <th className={th}>Residuos de vacuna</th>
              <th className={`${th} w-14`}>Parcial</th>
              <th className={`${th} w-14`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isParcial = String(row.decomiso_parcial ?? '') === 'Parcial';
              const isTotal = String(row.decomiso_total ?? '') === 'Total';
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${td} text-center text-xs font-semibold text-gray-500`}>{idx + 1}</td>
                  <td className={td}>
                    <input
                      type="text"
                      value={String(row.nombre_corte ?? '')}
                      onChange={(e) => updateRow(idx, 'nombre_corte', e.target.value)}
                      disabled={disabled}
                      placeholder="—"
                      className={`${INPUT_CLASS} text-xs py-1`}
                    />
                  </td>
                  <td className={td}>
                    <NumInput
                      fieldKey="unidades"
                      label="Unidades"
                      value={row.unidades}
                      onChange={(v) => updateRow(idx, 'unidades', v)}
                      disabled={disabled}
                      min={0}
                    />
                  </td>
                  {KG_KEYS.map((key) => (
                    <td key={key} className={td}>
                      <NumInput
                        fieldKey={key}
                        value={row[key]}
                        onChange={(v) => updateRow(idx, key, v)}
                        disabled={disabled}
                        min={0}
                      />
                    </td>
                  ))}
                  <td className={`${td} text-center px-0.5`}>
                    <MarkToggle
                      active={isParcial}
                      label="Parcial"
                      disabled={disabled}
                      onClick={() => setTipo(idx, 'Parcial')}
                    />
                  </td>
                  <td className={`${td} text-center px-0.5`}>
                    <MarkToggle
                      active={isTotal}
                      label="Total"
                      disabled={disabled}
                      onClick={() => setTipo(idx, 'Total')}
                    />
                  </td>
                  {showActions && (
                    <td className={`${td} text-center`}>
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-500 p-1 hover:bg-red-50 rounded"
                        title="Eliminar fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold text-[10px] uppercase">
              <td className={`${td} text-center`} colSpan={2}>
                Totales
              </td>
              <td className={`${td} text-center`}>{totals.unidades || '0'}</td>
              <td className={`${td} text-center`}>{totals.hematoma_kg || '0'}</td>
              <td className={`${td} text-center`}>{totals.absceso_kg || '0'}</td>
              <td className={`${td} text-center`}>{totals.fibrosis_kg || '0'}</td>
              <td className={`${td} text-center`}>{totals.vacuna_kg || '0'}</td>
              <td className={`${td} text-center text-[9px] leading-tight`} colSpan={2}>
                Peso total de decomisos
                <div className="text-sm normal-case mt-0.5 text-primary-800">{totals.peso_total.toFixed(2)} kg</div>
              </td>
              {showActions && <td className={td} />}
            </tr>
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
