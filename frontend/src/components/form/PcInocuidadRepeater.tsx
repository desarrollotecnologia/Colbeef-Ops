import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

type Cnc = 'C' | 'NC' | 'NA' | '';

const HALLAZGO_COLS: { key: string; label: string; group: string }[] = [
  { key: 'vr_cr', label: 'CR', group: 'V.R.' },
  { key: 'vb_cr', label: 'CR', group: 'V.B.' },
  { key: 'vb_mf', label: 'MF', group: 'V.B.' },
  { key: 'cb_cr', label: 'CR', group: 'C.B.' },
  { key: 'pm_coc', label: 'COC', group: 'P.M.' },
  { key: 'pm_pelo', label: 'PELO', group: 'P.M.' },
  { key: 'lg_cr', label: 'CR', group: 'L.G.' },
];

export type PcInocuidadRow = {
  codigo?: string;
  hallazgos?: Record<string, Cnc>;
  observation?: string;
  corrective?: string;
};

const CNC_ACTIVE: Record<'C' | 'NC' | 'NA', string> = {
  C: 'bg-green-600 text-white border-green-600',
  NC: 'bg-red-600 text-white border-red-600',
  NA: 'bg-gray-500 text-white border-gray-500',
};

function CncBtn({ choice, value, disabled, onChange }: { choice: 'C' | 'NC' | 'NA'; value: string; disabled?: boolean; onChange: (v: Cnc) => void }) {
  const active = value === choice;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(active ? '' : choice)}
      className={`w-full py-0.5 text-[9px] font-bold rounded border-2 ${
        active ? CNC_ACTIVE[choice] : 'bg-white border-gray-300'
      }`}
    >
      {choice}
    </button>
  );
}

interface Props {
  options: FieldOptions;
  value: PcInocuidadRow[];
  onChange: (v: PcInocuidadRow[]) => void;
  disabled?: boolean;
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

  const th = 'px-1 py-2 text-[10px] font-bold uppercase border-r border-gray-800 text-center';

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${th} w-10`} rowSpan={2}>Ítem</th>
              <th className={`${th} text-left`} rowSpan={2}>Código</th>
              <th className={th} colSpan={1}>V.R.</th>
              <th className={th} colSpan={2}>V.B.</th>
              <th className={th} colSpan={1}>C.B.</th>
              <th className={th} colSpan={2}>P.M.</th>
              <th className={th} colSpan={1}>L.G.</th>
              <th className={`${th} text-left`} rowSpan={2}>Observaciones</th>
              <th className={`${th} text-left`} rowSpan={2}>Acciones correctivas</th>
              <th className={th} rowSpan={2} />
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {HALLAZGO_COLS.map((c) => (
                <th key={c.key} className={th}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 border-r border-b border-gray-400 text-center text-xs font-medium">{idx + 1}</td>
                <td className="px-2 py-1 border-r border-b border-gray-400">
                  <input type="text" value={row.codigo ?? ''} disabled={disabled} onChange={(e) => updateRow(idx, { codigo: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} />
                </td>
                {HALLAZGO_COLS.map((col) => {
                  const val = row.hallazgos?.[col.key] ?? '';
                  return (
                    <td key={col.key} className="px-0.5 py-1 border-r border-b border-gray-400 text-center w-[52px]">
                      <div className="flex gap-0.5">
                        <CncBtn choice="C" value={val} disabled={disabled} onChange={(v) => updateHallazgo(idx, col.key, v)} />
                        <CncBtn choice="NC" value={val} disabled={disabled} onChange={(v) => updateHallazgo(idx, col.key, v)} />
                        <CncBtn choice="NA" value={val} disabled={disabled} onChange={(v) => updateHallazgo(idx, col.key, v)} />
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 py-1 border-r border-b border-gray-400">
                  <input type="text" value={row.observation ?? ''} disabled={disabled} onChange={(e) => updateRow(idx, { observation: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} />
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-400">
                  <input type="text" value={row.corrective ?? ''} disabled={disabled} onChange={(e) => updateRow(idx, { corrective: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} />
                </td>
                <td className="px-1 py-1 border-b border-gray-400">
                  <button type="button" disabled={disabled || rows.length <= minRows} onClick={() => removeRow(idx)} className="p-1 text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={disabled || rows.length >= maxRows} onClick={addRow}>
        <Plus size={16} /> {options.addButtonLabel ?? 'Agregar ítem'}
      </Button>
    </div>
  );
}
