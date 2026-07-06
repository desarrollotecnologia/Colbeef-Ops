import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';
import CncToggle from './CncToggle';
import { cncCellClass, cncHeaderClass } from './repeaterColumns';

type Cnc = 'C' | 'NC' | 'NA' | '';

const CNC_CHOICES: ('C' | 'NC' | 'NA')[] = ['C', 'NC', 'NA'];

const HALLAZGO_COLS: { key: string; label: string; group: string }[] = [
  { key: 'vr_cr', label: 'CR', group: 'V.R.' },
  { key: 'vb_cr', label: 'CR', group: 'V.B.' },
  { key: 'vb_mf', label: 'MF', group: 'V.B.' },
  { key: 'cb_cr', label: 'CR', group: 'CB' },
  { key: 'pm_coc', label: 'COC', group: 'P.M.' },
  { key: 'pm_pelo', label: 'PELO', group: 'P.M.' },
  { key: 'lg_cr', label: 'CR', group: 'L.G.' },
];

const GROUP_HEADERS: { label: string; span: number }[] = [
  { label: 'V.R.', span: 1 },
  { label: 'V.B.', span: 2 },
  { label: 'CB', span: 1 },
  { label: 'P.M.', span: 2 },
  { label: 'L.G.', span: 1 },
];

const CNC_COLS = 3;

export type PcInocuidadRow = {
  codigo?: string;
  hallazgos?: Record<string, Cnc>;
  observation?: string;
  corrective?: string;
};

interface Props {
  options: FieldOptions;
  value: PcInocuidadRow[];
  onChange: (v: PcInocuidadRow[]) => void;
  disabled?: boolean;
}

function HallazgoCell({
  value,
  disabled,
  onChange,
}: {
  value: Cnc;
  disabled?: boolean;
  onChange: (v: Cnc) => void;
}) {
  return (
    <>
      {CNC_CHOICES.map((choice) => (
        <td
          key={choice}
          className={`px-0.5 py-1 border-r border-b border-gray-400 text-center w-9 ${cncCellClass(choice)}`}
        >
          <CncToggle choice={choice} value={value} disabled={disabled} onChange={(v) => onChange(v as Cnc)} compact />
        </td>
      ))}
    </>
  );
}

export default function PcInocuidadRepeater({ options, value, onChange, disabled }: Props) {
  const rows = value.length > 0 ? value : [{}];
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 60;

  const updateRow = (idx: number, patch: Partial<PcInocuidadRow>) => {
    const next = [...rows];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const updateHallazgo = (idx: number, colKey: string, cnc: Cnc) => {
    const row = rows[idx] ?? {};
    const hallazgos = { ...(row.hallazgos ?? {}), [colKey]: cnc };
    updateRow(idx, { hallazgos });
  };

  const addRow = () => {
    if (rows.length >= maxRows) return;
    onChange([...rows, {}]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= minRows) return;
    onChange(rows.filter((_, i) => i !== idx));
  };

  const th = 'px-1 py-1.5 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#d9d9d9]';
  const thSub = 'px-1 py-1 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#e8e8e8]';
  const thCnc = 'px-0.5 py-0.5 text-[9px] font-bold border-r border-gray-800 text-center bg-[#f3f3f3]';

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px] border-collapse">
          <thead>
            <tr className="border-b border-gray-800">
              <th className={`${th} w-12`} rowSpan={3}>
                Ítems
              </th>
              <th className={`${th} text-left min-w-[90px]`} rowSpan={3}>
                Código
              </th>
              {GROUP_HEADERS.map((g) => (
                <th key={g.label} className={th} colSpan={g.span * CNC_COLS}>
                  {g.label}
                </th>
              ))}
              <th className={`${th} text-left min-w-[140px]`} rowSpan={3}>
                Observaciones
              </th>
              <th className={`${th} text-left min-w-[140px]`} rowSpan={3}>
                Acciones correctivas
              </th>
              <th className={`${th} w-10`} rowSpan={3} />
            </tr>
            <tr className="border-b border-gray-800">
              {HALLAZGO_COLS.map((c) => (
                <th key={c.key} className={thSub} colSpan={CNC_COLS} title={c.group}>
                  {c.label}
                </th>
              ))}
            </tr>
            <tr className="border-b-2 border-gray-800">
              {HALLAZGO_COLS.map((c) =>
                CNC_CHOICES.map((choice) => (
                  <th key={`${c.key}-${choice}`} className={`${thCnc} w-9 ${cncHeaderClass(choice)}`}>
                    {choice}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 border-r border-b border-gray-400 text-center text-xs font-medium">
                  {idx + 1}
                </td>
                <td className="px-1 py-1 border-r border-b border-gray-400">
                  <input
                    type="text"
                    value={row.codigo ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateRow(idx, { codigo: e.target.value })}
                    className={`${INPUT_CLASS} text-xs py-1`}
                  />
                </td>
                {HALLAZGO_COLS.map((col) => {
                  const val = row.hallazgos?.[col.key] ?? '';
                  return (
                    <HallazgoCell
                      key={col.key}
                      value={val}
                      disabled={disabled}
                      onChange={(v) => updateHallazgo(idx, col.key, v)}
                    />
                  );
                })}
                <td className="px-1 py-1 border-r border-b border-gray-400">
                  <input
                    type="text"
                    value={row.observation ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateRow(idx, { observation: e.target.value })}
                    className={`${INPUT_CLASS} text-xs py-1`}
                  />
                </td>
                <td className="px-1 py-1 border-r border-b border-gray-400">
                  <input
                    type="text"
                    value={row.corrective ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateRow(idx, { corrective: e.target.value })}
                    className={`${INPUT_CLASS} text-xs py-1`}
                  />
                </td>
                <td className="px-1 py-1 border-b border-gray-400 text-center">
                  <button
                    type="button"
                    disabled={disabled || rows.length <= minRows}
                    onClick={() => removeRow(idx)}
                    className="p-1 text-red-600 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 pb-3">
        <Button type="button" variant="outline" size="sm" disabled={disabled || rows.length >= maxRows} onClick={addRow}>
          <Plus size={16} /> {options.addButtonLabel ?? 'Agregar ítem'}
        </Button>
      </div>
    </div>
  );
}
