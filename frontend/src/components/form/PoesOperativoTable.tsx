import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

type Cnc = 'C' | 'NC' | 'NA' | '';

type TomaData = {
  temp?: string;
  cnc_est?: string;
  cnc_lav?: string;
  obs?: string;
};

export type PoesEquipoRow = {
  label?: string;
  toma1?: TomaData;
  toma2?: TomaData;
};

export interface PoesEquiposValue {
  _extras?: { id: string; label: string }[];
  [key: string]: PoesEquipoRow | { id: string; label: string }[] | undefined;
}

function getEquipoRow(value: PoesEquiposValue, key: string): PoesEquipoRow {
  const row = value[key];
  if (!row || Array.isArray(row)) return {};
  return row;
}

function CncBtn({
  choice,
  value,
  disabled,
  onChange,
  na = false,
}: {
  choice: 'C' | 'NC' | 'NA';
  value: string;
  disabled?: boolean;
  onChange: (v: Cnc) => void;
  na?: boolean;
}) {
  if (na && choice === 'NA') {
    return (
      <button type="button" disabled={disabled} onClick={() => onChange(value === 'NA' ? '' : 'NA')} className={`w-full py-0.5 text-[10px] font-bold rounded border ${value === 'NA' ? 'bg-gray-500 text-white' : 'bg-white border-gray-300'}`}>NA</button>
    );
  }
  const active = value === choice;
  const cls = choice === 'C' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(active ? '' : choice)} className={`w-full py-0.5 text-[10px] font-bold rounded border ${active ? cls : 'bg-white border-gray-300'}`}>{choice}</button>
  );
}

function TomaCells({
  data,
  disabled,
  onPatch,
  estNa,
}: {
  data: TomaData;
  disabled?: boolean;
  onPatch: (p: Partial<TomaData>) => void;
  estNa?: boolean;
}) {
  return (
    <>
      <td className="px-1 py-1 border-b border-gray-400">
        <input type="text" value={data.temp ?? ''} disabled={disabled} onChange={(e) => onPatch({ temp: e.target.value })} placeholder="°C" className={`${INPUT_CLASS} text-xs py-1`} />
      </td>
      <td className="px-1 py-1 border-b border-gray-400 text-center w-10"><CncBtn choice="C" value={data.cnc_est ?? ''} disabled={disabled} onChange={(v) => onPatch({ cnc_est: v })} na={estNa} /></td>
      <td className="px-1 py-1 border-b border-gray-400 text-center w-10"><CncBtn choice="NC" value={data.cnc_est ?? ''} disabled={disabled} onChange={(v) => onPatch({ cnc_est: v })} na={estNa} /></td>
      {estNa && <td className="px-1 py-1 border-b border-gray-400 text-center w-10"><CncBtn choice="NA" value={data.cnc_est ?? ''} disabled={disabled} onChange={(v) => onPatch({ cnc_est: v })} na /></td>}
      <td className="px-1 py-1 border-b border-gray-400 text-center w-10"><CncBtn choice="C" value={data.cnc_lav ?? ''} disabled={disabled} onChange={(v) => onPatch({ cnc_lav: v })} /></td>
      <td className="px-1 py-1 border-b border-gray-400 text-center w-10"><CncBtn choice="NC" value={data.cnc_lav ?? ''} disabled={disabled} onChange={(v) => onPatch({ cnc_lav: v })} /></td>
      <td className="px-1 py-1 border-b border-gray-400">
        <input type="text" value={data.obs ?? ''} disabled={disabled} onChange={(e) => onPatch({ obs: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} />
      </td>
    </>
  );
}

interface Props {
  options: FieldOptions;
  value: PoesEquiposValue;
  onChange: (v: PoesEquiposValue) => void;
  disabled?: boolean;
}

export default function PoesOperativoTable({ options, value, onChange, disabled }: Props) {
  const items = options.items ?? [];
  const extras = (value._extras as { id: string; label: string }[] | undefined) ?? [];

  const updateRow = (key: string, patch: Partial<PoesEquipoRow>) => {
    onChange({ ...value, [key]: { ...getEquipoRow(value, key), ...patch } });
  };

  const updateToma = (key: string, toma: 'toma1' | 'toma2', patch: Partial<TomaData>) => {
    const row = getEquipoRow(value, key);
    onChange({
      ...value,
      [key]: { ...row, [toma]: { ...(row[toma] ?? {}), ...patch } },
    });
  };

  const addExtra = () => {
    const id = `extra_${Date.now()}`;
    onChange({ ...value, _extras: [...extras, { id, label: '' }] });
  };

  const removeExtra = (id: string) => {
    const next = { ...value };
    delete next[id];
    onChange({ ...next, _extras: extras.filter((e) => e.id !== id) });
  };

  const renderRow = (key: string, label: string, editableLabel = false) => {
    const row = getEquipoRow(value, key);
    const isAcido = label.toLowerCase().includes('ácido') || label.toLowerCase().includes('acido');
    return (
      <tr key={key} className="bg-white">
        <td className="px-2 py-1 border-b border-gray-400 text-xs font-medium">
          {editableLabel ? (
            <input type="text" value={row.label ?? label} disabled={disabled} onChange={(e) => updateRow(key, { label: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="Equipo" />
          ) : (
            label
          )}
          {isAcido && <p className="text-[10px] text-gray-500 mt-0.5">Obs. ácido láctico en observaciones</p>}
        </td>
        <TomaCells data={row.toma1 ?? {}} disabled={disabled} onPatch={(p) => updateToma(key, 'toma1', p)} estNa />
        <TomaCells data={row.toma2 ?? {}} disabled={disabled} onPatch={(p) => updateToma(key, 'toma2', p)} estNa />
        {editableLabel && (
          <td className="px-1 border-b border-gray-400">
            <button type="button" disabled={disabled} onClick={() => removeExtra(key)} className="p-1 text-red-600"><Trash2 size={14} /></button>
          </td>
        )}
      </tr>
    );
  };

  const th = 'px-1 py-2 text-[10px] font-bold uppercase border-r border-gray-800 text-center';

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${th} text-left`} rowSpan={2}>Equipo / utensilio</th>
              <th className={th} colSpan={6}>Toma 1</th>
              <th className={th} colSpan={6}>Toma 2</th>
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {['Toma 1', 'Toma 2'].map((t) => (
                <th key={t} colSpan={6} className="hidden">{t}</th>
              ))}
              {[1, 2].map((t) => (
                <th key={`h-${t}`} colSpan={6} className={th}>
                  {t === 1 ? 'Hora 1' : 'Hora 2'} — Temp · C/NC est. · C/NC lav. · Obs.
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => renderRow(item.key, item.label))}
            {extras.map((ex) => renderRow(ex.id, ex.label, true))}
          </tbody>
        </table>
      </div>
      {options.allowAddEquipos && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addExtra}>
          <Plus size={16} /> Agregar equipo
        </Button>
      )}
    </div>
  );
}

export function PoesBpmTable({
  options,
  value,
  onChange,
  disabled,
}: {
  options: FieldOptions;
  value: Record<string, { lavado_manos?: string; tapabocas?: string; observation?: string; corrective?: string; responsible?: string }>;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const items = options.items ?? [];
  const th = 'px-2 py-2 text-[11px] font-bold uppercase border-r border-gray-800';
  const td = 'px-2 py-1 border-r border-b border-gray-400';

  const update = (key: string, patch: Record<string, string>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="bg-white border-b-2 border-gray-800">
            <th className={`${th} text-left`}>Procedimiento</th>
            <th className={th}>Lavado manos C</th>
            <th className={th}>Lavado manos NC</th>
            <th className={th}>Tapabocas C</th>
            <th className={th}>Tapabocas NC</th>
            <th className={`${th} text-left`}>Observaciones</th>
            <th className={`${th} text-left`}>Acción correctiva</th>
            <th className={`${th} text-left`}>Responsable</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const row = value[item.key] ?? {};
            const lav = row.lavado_manos ?? '';
            const tap = row.tapabocas ?? '';
            return (
              <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={`${td} font-medium text-xs`}>{item.label}</td>
                <td className={`${td} text-center`}><CncBtn choice="C" value={lav} disabled={disabled} onChange={(v) => update(item.key, { lavado_manos: v })} /></td>
                <td className={`${td} text-center`}><CncBtn choice="NC" value={lav} disabled={disabled} onChange={(v) => update(item.key, { lavado_manos: v })} /></td>
                <td className={`${td} text-center`}><CncBtn choice="C" value={tap} disabled={disabled} onChange={(v) => update(item.key, { tapabocas: v })} /></td>
                <td className={`${td} text-center`}><CncBtn choice="NC" value={tap} disabled={disabled} onChange={(v) => update(item.key, { tapabocas: v })} /></td>
                <td className={td}><input type="text" value={row.observation ?? ''} disabled={disabled} onChange={(e) => update(item.key, { observation: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} /></td>
                <td className={td}><input type="text" value={row.corrective ?? ''} disabled={disabled} onChange={(e) => update(item.key, { corrective: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} /></td>
                <td className={td}><input type="text" value={row.responsible ?? ''} disabled={disabled} onChange={(e) => update(item.key, { responsible: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
