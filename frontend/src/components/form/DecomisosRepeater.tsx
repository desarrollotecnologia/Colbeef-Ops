import type { FieldOptions, RepeaterColumn } from '@/types';
import FormalRepeaterTable from './FormalRepeaterTable';

interface Props {
  options: FieldOptions;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  disabled?: boolean;
}

const NUM_KEYS = ['unidades', 'hematoma_kg', 'absceso_kg', 'fibrosis_kg', 'vacuna_kg', 'parcial_kg', 'total_kg'] as const;

function parseNum(v: unknown): number {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function sumColumn(rows: Record<string, unknown>[], key: string): number {
  return rows.reduce((acc, row) => acc + parseNum(row[key]), 0);
}

function pesoTotal(rows: Record<string, unknown>[]): number {
  return NUM_KEYS.filter((k) => k !== 'unidades').reduce((acc, key) => acc + sumColumn(rows, key), 0);
}

export default function DecomisosRepeater({ options, value, onChange, disabled }: Props) {
  const columns = (options.columns_def ?? options.columns ?? []).filter(
    (c): c is RepeaterColumn => typeof c === 'object' && c !== null && 'key' in c
  );
  const minRows = options.minRows ?? 1;
  const rows = value.length >= minRows ? value : Array.from({ length: minRows }, (): Record<string, unknown> => ({}));

  const totals = {
    unidades: sumColumn(rows, 'unidades'),
    hematoma_kg: sumColumn(rows, 'hematoma_kg'),
    absceso_kg: sumColumn(rows, 'absceso_kg'),
    fibrosis_kg: sumColumn(rows, 'fibrosis_kg'),
    vacuna_kg: sumColumn(rows, 'vacuna_kg'),
    parcial_kg: sumColumn(rows, 'parcial_kg'),
    total_kg: sumColumn(rows, 'total_kg'),
    peso_total: pesoTotal(rows),
  };

  return (
    <div>
      <FormalRepeaterTable options={options} value={value} onChange={onChange} disabled={disabled} />
      <div className="overflow-x-auto border-t-2 border-gray-800 bg-gray-100">
        <table className="w-full text-sm min-w-[640px]">
          <tbody>
            <tr className="font-bold text-xs uppercase">
              <td className="px-2 py-2 border-r border-gray-400 w-8 text-center">Σ</td>
              <td className="px-2 py-2 border-r border-gray-400">Totales</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.unidades || '—'}</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.hematoma_kg || '—'}</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.absceso_kg || '—'}</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.fibrosis_kg || '—'}</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.vacuna_kg || '—'}</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.parcial_kg || '—'}</td>
              <td className="px-2 py-2 border-r border-gray-400 text-center">{totals.total_kg || '—'}</td>
            </tr>
            <tr className="bg-[#dcfce7] font-bold text-xs">
              <td colSpan={columns.length + 1} className="px-3 py-2 text-right">
                Peso total de decomisos: <span className="text-base ml-2">{totals.peso_total.toFixed(2)} kg</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
