import type { FieldOptions } from '@/types';
import type { MeasureRowData } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';

interface Props {
  options: FieldOptions;
  value: Record<string, MeasureRowData>;
  onChange: (v: Record<string, MeasureRowData>) => void;
  disabled?: boolean;
}

type CncChoice = 'C' | 'NC';

const LACTICO_MAP: Record<string, string> = { '2.2': '1.98', '2.3': '2.07' };

function CncToggle({
  choice,
  value,
  disabled,
  onChange,
}: {
  choice: CncChoice;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const active = value === choice;
  const activeClass =
    choice === 'C' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(active ? '' : choice)}
      className={`w-full py-1 text-xs font-bold rounded border-2 ${
        active ? activeClass : 'bg-white border-gray-300'
      }`}
    >
      {choice}
    </button>
  );
}

function PowerToggle({
  choice,
  value,
  disabled,
  onChange,
}: {
  choice: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const active = value === choice;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(active ? '' : choice)}
      className={`w-full py-1 text-[10px] font-bold rounded border-2 ${
        active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-300'
      }`}
    >
      {choice}
    </button>
  );
}

export default function FormalMeasureTable({ options, value, onChange, disabled }: Props) {
  const items = options.items ?? [];
  const tableType = options.tableType ?? 'cloro';
  const thClass = 'px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800';
  const tdClass = 'px-2 py-1 border-r border-b border-gray-400';

  const updateRow = (key: string, patch: Partial<MeasureRowData>) => {
    const next = { ...value[key], ...patch };
    if (tableType === 'titulacion' && patch.volumen_naoh) {
      next.concentracion = LACTICO_MAP[patch.volumen_naoh] ?? '';
    }
    onChange({ ...value, [key]: next });
  };

  if (tableType === 'cloro') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${thClass} w-10`}>#</th>
              <th className={thClass}>Hora</th>
              <th className={`${thClass} text-left`}>Punto de toma</th>
              <th className={thClass}>pH</th>
              <th className={thClass}>Cloro residual (0.3–2 ppm)</th>
              <th className={thClass}>C</th>
              <th className={thClass}>NC</th>
              <th className={`${thClass} text-left min-w-[100px]`}>Corrección</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const row = value[item.key] ?? {};
              const cnc = row.cnc ?? '';
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdClass} text-center text-xs text-gray-500`}>{idx + 1}</td>
                  <td className={tdClass}>
                    <input type="time" value={row.hora ?? ''} onChange={(e) => updateRow(item.key, { hora: e.target.value })} disabled={disabled} className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={row.punto_toma ?? ''} onChange={(e) => updateRow(item.key, { punto_toma: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  <td className={`${tdClass} text-center text-xs font-medium text-gray-700`}>7.0</td>
                  <td className={tdClass}>
                    <input type="number" step="0.01" min={0.3} max={2} value={row.cloro_residual ?? ''} onChange={(e) => updateRow(item.key, { cloro_residual: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  {(['C', 'NC'] as CncChoice[]).map((sub) => (
                    <td key={sub} className={`${tdClass} text-center w-12 px-1`}>
                      <CncToggle choice={sub} value={cnc} disabled={disabled} onChange={(v) => updateRow(item.key, { cnc: v })} />
                    </td>
                  ))}
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input type="text" value={row.corrective ?? ''} onChange={(e) => updateRow(item.key, { corrective: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableType === 'temperaturas') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${thClass} text-left`}>Área</th>
              <th className={thClass}>Hora</th>
              <th className={thClass}>Temperatura °C</th>
              <th className={thClass}>C</th>
              <th className={thClass}>NC</th>
              <th className={`${thClass} text-left min-w-[100px]`}>Corrección</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const row = value[item.key] ?? {};
              const cnc = row.cnc ?? '';
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdClass} px-3 py-2 font-medium text-gray-900 text-xs`}>{item.label}</td>
                  <td className={tdClass}>
                    <input type="time" value={row.hora ?? ''} onChange={(e) => updateRow(item.key, { hora: e.target.value })} disabled={disabled} className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" step="0.1" value={row.temperatura ?? ''} onChange={(e) => updateRow(item.key, { temperatura: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  {(['C', 'NC'] as CncChoice[]).map((sub) => (
                    <td key={sub} className={`${tdClass} text-center w-12 px-1`}>
                      <CncToggle choice={sub} value={cnc} disabled={disabled} onChange={(v) => updateRow(item.key, { cnc: v })} />
                    </td>
                  ))}
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input type="text" value={row.corrective ?? ''} onChange={(e) => updateRow(item.key, { corrective: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableType === 'titulacion') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${thClass} w-10`}>#</th>
              <th className={thClass}>Hora</th>
              <th className={thClass}>Volumen NaOH (ml)</th>
              <th className={thClass}>Concentración AC láctico 2%</th>
              <th className={thClass}>C</th>
              <th className={thClass}>NC</th>
              <th className={`${thClass} text-left min-w-[100px]`}>Corrección</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const row = value[item.key] ?? {};
              const cnc = row.cnc ?? '';
              const conc = row.concentracion ?? LACTICO_MAP[row.volumen_naoh ?? ''] ?? '';
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdClass} text-center text-xs text-gray-500`}>{idx + 1}</td>
                  <td className={tdClass}>
                    <input type="time" value={row.hora ?? ''} onChange={(e) => updateRow(item.key, { hora: e.target.value })} disabled={disabled} className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  <td className={tdClass}>
                    <select value={row.volumen_naoh ?? ''} onChange={(e) => updateRow(item.key, { volumen_naoh: e.target.value })} disabled={disabled} className={`${INPUT_CLASS} text-xs py-1.5`}>
                      <option value="">—</option>
                      <option value="2.2">2.2</option>
                      <option value="2.3">2.3</option>
                    </select>
                  </td>
                  <td className={`${tdClass} text-center text-xs font-medium text-gray-700`}>{conc ? `${conc}%` : '—'}</td>
                  {(['C', 'NC'] as CncChoice[]).map((sub) => (
                    <td key={sub} className={`${tdClass} text-center w-12 px-1`}>
                      <CncToggle choice={sub} value={cnc} disabled={disabled} onChange={(v) => updateRow(item.key, { cnc: v })} />
                    </td>
                  ))}
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input type="text" value={row.corrective ?? ''} onChange={(e) => updateRow(item.key, { corrective: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableType === 'equipos') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${thClass} text-left`} rowSpan={2}>Equipo</th>
              <th className={thClass} colSpan={2}>Variable</th>
              <th className={thClass} colSpan={2}>Estado</th>
              <th className={`${thClass} text-left min-w-[120px]`} rowSpan={2}>Observaciones</th>
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={thClass}>T°C</th>
              <th className={thClass}>Presión</th>
              <th className={thClass}>Encendido</th>
              <th className={thClass}>Apagado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const row = value[item.key] ?? {};
              const meta = item as { naTemp?: boolean; naPresion?: boolean };
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdClass} px-3 py-2 font-medium text-gray-900 text-xs`}>{item.label}</td>
                  <td className={`${tdClass} text-center text-xs text-gray-500`}>{meta.naTemp ? 'N.A' : '—'}</td>
                  <td className={`${tdClass} text-center text-xs text-gray-500`}>{meta.naPresion ? 'N.A' : '—'}</td>
                  <td className={`${tdClass} text-center w-20 px-1`}>
                    <PowerToggle choice="Encendido" value={row.estado ?? ''} disabled={disabled} onChange={(v) => updateRow(item.key, { estado: v })} />
                  </td>
                  <td className={`${tdClass} text-center w-20 px-1`}>
                    <PowerToggle choice="Apagado" value={row.estado ?? ''} disabled={disabled} onChange={(v) => updateRow(item.key, { estado: v })} />
                  </td>
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input type="text" value={row.observation ?? ''} onChange={(e) => updateRow(item.key, { observation: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableType === 'pediluvios') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className={`${thClass} w-10`}>N°</th>
              <th className={`${thClass} text-left`}>Principio activo</th>
              <th className={thClass}>Concentración (250 ppm)</th>
              <th className={thClass}>C</th>
              <th className={thClass}>NC</th>
              <th className={`${thClass} text-left min-w-[100px]`}>Corrección</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const row = value[item.key] ?? {};
              const cnc = row.cnc ?? '';
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdClass} text-center text-xs font-medium`}>{item.label}</td>
                  <td className={tdClass}>
                    <input type="text" value={row.principio_activo ?? ''} onChange={(e) => updateRow(item.key, { principio_activo: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={row.concentracion ?? ''} onChange={(e) => updateRow(item.key, { concentracion: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                  {(['C', 'NC'] as CncChoice[]).map((sub) => (
                    <td key={sub} className={`${tdClass} text-center w-12 px-1`}>
                      <CncToggle choice={sub} value={cnc} disabled={disabled} onChange={(v) => updateRow(item.key, { cnc: v })} />
                    </td>
                  ))}
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input type="text" value={row.corrective ?? ''} onChange={(e) => updateRow(item.key, { corrective: e.target.value })} disabled={disabled} placeholder="—" className={`${INPUT_CLASS} text-xs py-1.5`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
