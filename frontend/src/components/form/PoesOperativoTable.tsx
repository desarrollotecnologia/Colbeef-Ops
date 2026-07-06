import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';
import CncToggle from './CncToggle';
import { cncCellClass } from './repeaterColumns';

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
  observation?: string;
  corrective?: string;
  responsible?: string;
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

const TOMA_COL_COUNT = 3;

const DEFAULT_OBS: Record<string, string> = {
  cuchilla_patas: 'Ácido láctico',
  cuchillo_neumatico: 'Ácido láctico',
};

function EstCncCell({
  value,
  disabled,
  onChange,
}: {
  value: Cnc;
  disabled?: boolean;
  onChange: (v: Cnc) => void;
}) {
  return (
    <td className={`px-0.5 py-1 border-r border-b border-gray-400 text-center align-middle`}>
      <div className="flex flex-col gap-0.5 items-center">
        {(['C', 'NC', 'NA'] as const).map((choice) => (
          <div key={choice} className={`w-full max-w-[32px] ${cncCellClass(choice)}`}>
            <CncToggle choice={choice} value={value} disabled={disabled} onChange={(v) => onChange(v as Cnc)} compact />
          </div>
        ))}
      </div>
    </td>
  );
}

function LavCncCell({
  value,
  disabled,
  onChange,
}: {
  value: Cnc;
  disabled?: boolean;
  onChange: (v: Cnc) => void;
}) {
  return (
    <td className={`px-0.5 py-1 border-r border-b border-gray-400 text-center align-middle`}>
      <div className="flex flex-col gap-0.5 items-center">
        {(['C', 'NC'] as const).map((choice) => (
          <div key={choice} className={`w-full max-w-[32px] ${cncCellClass(choice)}`}>
            <CncToggle choice={choice} value={value} disabled={disabled} onChange={(v) => onChange(v as Cnc)} compact />
          </div>
        ))}
      </div>
    </td>
  );
}

function TomaCells({
  data,
  disabled,
  onPatch,
}: {
  data: TomaData;
  disabled?: boolean;
  onPatch: (p: Partial<TomaData>) => void;
}) {
  const est = (data.cnc_est ?? '') as Cnc;
  const lav = (data.cnc_lav ?? '') as Cnc;
  return (
    <>
      <td className="px-1 py-1 border-r border-b border-gray-400">
        <input type="text" value={data.temp ?? ''} disabled={disabled} onChange={(e) => onPatch({ temp: e.target.value })} placeholder="°C" className={`${INPUT_CLASS} text-xs py-1 text-center`} />
      </td>
      <EstCncCell value={est} disabled={disabled} onChange={(v) => onPatch({ cnc_est: v })} />
      <LavCncCell value={lav} disabled={disabled} onChange={(v) => onPatch({ cnc_lav: v })} />
    </>
  );
}

interface Props {
  options: FieldOptions;
  value: PoesEquiposValue;
  onChange: (v: PoesEquiposValue) => void;
  disabled?: boolean;
  hora1?: string;
  hora2?: string;
}

export default function PoesOperativoTable({ options, value, onChange, disabled, hora1, hora2 }: Props) {
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

  const renderRow = (key: string, label: string, editableLabel = false, idx = 0, defaultObs?: string) => {
    const row = getEquipoRow(value, key);
    const legacyObs = row.toma1?.obs ?? row.toma2?.obs ?? '';
    const observation = row.observation ?? (legacyObs || defaultObs || DEFAULT_OBS[key] || '');
    return (
      <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <td className="px-2 py-1 border-r border-b border-gray-400 text-xs font-medium align-top">
          {editableLabel ? (
            <input type="text" value={row.label ?? label} disabled={disabled} onChange={(e) => updateRow(key, { label: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="Equipo" />
          ) : (
            label
          )}
        </td>
        <TomaCells data={row.toma1 ?? {}} disabled={disabled} onPatch={(p) => updateToma(key, 'toma1', p)} />
        <TomaCells data={row.toma2 ?? {}} disabled={disabled} onPatch={(p) => updateToma(key, 'toma2', p)} />
        <td className="px-2 py-1 border-r border-b border-gray-400 align-top">
          <input type="text" value={observation} disabled={disabled} onChange={(e) => updateRow(key, { observation: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="—" />
        </td>
        <td className="px-2 py-1 border-r border-b border-gray-400 align-top">
          <input type="text" value={row.corrective ?? ''} disabled={disabled} onChange={(e) => updateRow(key, { corrective: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="—" />
        </td>
        <td className="px-2 py-1 border-r border-b border-gray-400 align-top">
          <input type="text" value={row.responsible ?? ''} disabled={disabled} onChange={(e) => updateRow(key, { responsible: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="—" />
        </td>
        {editableLabel && (
          <td className="px-1 border-b border-gray-400 align-top">
            <button type="button" disabled={disabled} onClick={() => removeExtra(key)} className="p-1 text-red-600"><Trash2 size={14} /></button>
          </td>
        )}
      </tr>
    );
  };

  const th = 'px-1 py-1.5 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#d9ead3]';
  const thSub = 'px-1 py-1 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#e8f4e8]';
  const toma1Label = hora1 ? `Hora: ${hora1}` : 'Hora';
  const toma2Label = hora2 ? `Hora: ${hora2}` : 'Hora';

  return (
    <div className="space-y-2 p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px] border-collapse">
          <thead>
            <tr className="border-b border-gray-800">
              <th className={`${th} text-left align-bottom`} rowSpan={2}>Equipo / utensilio / superficie</th>
              <th className={th} colSpan={TOMA_COL_COUNT}>{toma1Label}</th>
              <th className={th} colSpan={TOMA_COL_COUNT}>{toma2Label}</th>
              <th className={`${th} text-left align-bottom`} rowSpan={2}>Observaciones</th>
              <th className={`${th} text-left align-bottom`} rowSpan={2}>Acción correctiva</th>
              <th className={`${th} text-left align-bottom`} rowSpan={2}>Responsable proceso</th>
              {extras.length > 0 && <th className={th} rowSpan={2} />}
            </tr>
            <tr className="border-b-2 border-gray-800">
              <th className={thSub}>Temp. esterilización (°C)</th>
              <th className={thSub}>C / NC</th>
              <th className={thSub}>Lavado C / NC</th>
              <th className={thSub}>Temp. esterilización (°C)</th>
              <th className={thSub}>C / NC</th>
              <th className={thSub}>Lavado C / NC</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) =>
              renderRow(
                item.key,
                item.label,
                false,
                idx,
                (item as { defaultObservation?: string }).defaultObservation
              )
            )}
            {extras.map((ex, idx) => renderRow(ex.id, ex.label, true, items.length + idx))}
          </tbody>
        </table>
      </div>
      {options.allowAddEquipos && (
        <div className="px-3 pb-3">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addExtra}>
            <Plus size={16} /> Agregar equipo
          </Button>
        </div>
      )}
    </div>
  );
}

export type PoesBpmRow = {
  toma1?: { lavado_manos?: string; tapabocas?: string };
  toma2?: { lavado_manos?: string; tapabocas?: string };
  lavado_manos?: string;
  tapabocas?: string;
  observation?: string;
  corrective?: string;
  responsible?: string;
};

function BpmTomaCells({
  data,
  disabled,
  onPatch,
}: {
  data: { lavado_manos?: string; tapabocas?: string };
  disabled?: boolean;
  onPatch: (p: Partial<{ lavado_manos?: string; tapabocas?: string }>) => void;
}) {
  const lav = data.lavado_manos ?? '';
  const tap = data.tapabocas ?? '';
  return (
    <>
      <td className={`px-1 py-1 border-r border-b border-gray-400 text-center w-10 ${cncCellClass('C')}`}>
        <CncToggle choice="C" value={lav} disabled={disabled} onChange={(v) => onPatch({ lavado_manos: v })} compact />
      </td>
      <td className={`px-1 py-1 border-r border-b border-gray-400 text-center w-10 ${cncCellClass('NC')}`}>
        <CncToggle choice="NC" value={lav} disabled={disabled} onChange={(v) => onPatch({ lavado_manos: v })} compact />
      </td>
      <td className={`px-1 py-1 border-r border-b border-gray-400 text-center w-10 ${cncCellClass('C')}`}>
        <CncToggle choice="C" value={tap} disabled={disabled} onChange={(v) => onPatch({ tapabocas: v })} compact />
      </td>
      <td className={`px-1 py-1 border-r border-b border-gray-400 text-center w-10 ${cncCellClass('NC')}`}>
        <CncToggle choice="NC" value={tap} disabled={disabled} onChange={(v) => onPatch({ tapabocas: v })} compact />
      </td>
    </>
  );
}

export function PoesBpmTable({
  options,
  value,
  onChange,
  disabled,
  hora1,
  hora2,
}: {
  options: FieldOptions;
  value: Record<string, PoesBpmRow>;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
  hora1?: string;
  hora2?: string;
}) {
  const items = options.items ?? [];
  const th = 'px-1 py-1.5 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#d9ead3]';
  const thSub = 'px-1 py-1 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#e8f4e8]';
  const td = 'px-2 py-1 border-r border-b border-gray-400 align-top';
  const toma1Label = hora1 ? `Hora: ${hora1}` : 'Hora';
  const toma2Label = hora2 ? `Hora: ${hora2}` : 'Hora';

  const update = (key: string, patch: Partial<PoesBpmRow>) => {
    onChange({ ...value, [key]: { ...(value[key] ?? {}), ...patch } });
  };

  const updateToma = (key: string, toma: 'toma1' | 'toma2', patch: Partial<{ lavado_manos?: string; tapabocas?: string }>) => {
    const row = value[key] ?? {};
    onChange({
      ...value,
      [key]: { ...row, [toma]: { ...(row[toma] ?? {}), ...patch } },
    });
  };

  return (
    <div className="overflow-x-auto p-0">
      <table className="w-full text-sm min-w-[1000px] border-collapse">
        <thead>
          <tr className="border-b border-gray-800">
            <th className={`${th} text-left align-bottom`} rowSpan={2}>Buenas prácticas higiénicas</th>
            <th className={th} colSpan={4}>{toma1Label}</th>
            <th className={th} colSpan={4}>{toma2Label}</th>
            <th className={`${th} text-left align-bottom`} rowSpan={2}>Observaciones</th>
            <th className={`${th} text-left align-bottom`} rowSpan={2}>Acción correctiva</th>
            <th className={`${th} text-left align-bottom`} rowSpan={2}>Responsable proceso</th>
          </tr>
          <tr className="border-b-2 border-gray-800">
            <th className={thSub} colSpan={2}>Lavado de manos C/NC</th>
            <th className={thSub} colSpan={2}>Uso de tapabocas C/NC</th>
            <th className={thSub} colSpan={2}>Lavado de manos C/NC</th>
            <th className={thSub} colSpan={2}>Uso de tapabocas C/NC</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const row = value[item.key] ?? {};
            const toma1 = row.toma1 ?? (row.lavado_manos || row.tapabocas ? { lavado_manos: row.lavado_manos, tapabocas: row.tapabocas } : {});
            const toma2 = row.toma2 ?? {};
            return (
              <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={`${td} font-medium text-xs`}>{item.label}</td>
                <BpmTomaCells data={toma1} disabled={disabled} onPatch={(p) => updateToma(item.key, 'toma1', p)} />
                <BpmTomaCells data={toma2} disabled={disabled} onPatch={(p) => updateToma(item.key, 'toma2', p)} />
                <td className={td}>
                  <input type="text" value={row.observation ?? ''} disabled={disabled} onChange={(e) => update(item.key, { observation: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="—" />
                </td>
                <td className={td}>
                  <input type="text" value={row.corrective ?? ''} disabled={disabled} onChange={(e) => update(item.key, { corrective: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="—" />
                </td>
                <td className={td}>
                  <input type="text" value={row.responsible ?? ''} disabled={disabled} onChange={(e) => update(item.key, { responsible: e.target.value })} className={`${INPUT_CLASS} text-xs py-1`} placeholder="—" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
