import { Plus, Trash2 } from 'lucide-react';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

interface Props {
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
}

export default function VehiculosCargaTable({
  value,
  onChange,
  disabled,
  minRows = 1,
  maxRows = 10,
}: Props) {
  const rows =
    value.length >= minRows ? value : Array.from({ length: minRows }, (): Record<string, unknown> => ({}));

  const updateRow = (idx: number, key: string, val: string) => {
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

  const thClass =
    'px-2 py-2 text-center text-[10px] font-bold uppercase border border-gray-800 bg-white';
  const tdClass = 'px-2 py-1.5 border border-gray-400 align-middle';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[480px]">
          <thead>
            <tr>
              <th className={`${thClass} w-10`}>#</th>
              <th className={`${thClass} w-[9.5rem] max-w-[9.5rem]`}>Alimentos que transporta</th>
              <th className={thClass}>Cantidad</th>
              <th className={thClass}>Producto</th>
              {!disabled && rows.length > minRows && <th className={`${thClass} w-8`} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={`${tdClass} text-center text-xs font-semibold text-gray-500`}>{idx + 1}</td>
                {idx === 0 ? (
                  <td
                    className={`${tdClass} text-center text-[11px] font-bold uppercase text-gray-800 bg-[#f3f4f6] leading-tight px-2`}
                    rowSpan={rows.length}
                  >
                    Alimentos que transporta
                  </td>
                ) : null}
                <td className={tdClass}>
                  <input
                    type="text"
                    value={String(row.cantidad ?? '')}
                    onChange={(e) => updateRow(idx, 'cantidad', e.target.value)}
                    disabled={disabled}
                    placeholder="—"
                    className={`${INPUT_CLASS} text-xs py-1`}
                  />
                </td>
                <td className={tdClass}>
                  <input
                    type="text"
                    value={String(row.producto ?? '')}
                    onChange={(e) => updateRow(idx, 'producto', e.target.value)}
                    disabled={disabled}
                    placeholder="—"
                    className={`${INPUT_CLASS} text-xs py-1`}
                  />
                </td>
                {!disabled && rows.length > minRows && (
                  <td className={`${tdClass} text-center`}>
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
