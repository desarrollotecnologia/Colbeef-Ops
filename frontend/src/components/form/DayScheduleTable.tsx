import type { FieldOptions } from '@/types';
import { getDayKey } from '@/lib/autoFill';
import { getPointsForDay } from '@/lib/daySchedules';
import { INPUT_CLASS } from '@/lib/formUtils';

export interface DayPointRow {
  hora?: string;
  punto_toma?: string;
  cloro_residual?: string;
  temperatura?: string;
  cnc?: string;
  observaciones?: string;
}

interface Props {
  options: FieldOptions;
  value: Record<string, DayPointRow>;
  onChange: (v: Record<string, DayPointRow>) => void;
  workDate: string;
  disabled?: boolean;
}

function pointKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[.]/g, '');
}

export default function DayScheduleTable({ options, value, onChange, workDate, disabled }: Props) {
  const schedule = (options.schedule ?? {}) as Record<string, string[]>;
  const tableType = options.tableType ?? 'cloro';
  const dayKey = getDayKey(workDate);
  const points = getPointsForDay(schedule, dayKey);

  if (points.length === 0) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        No hay puntos programados para este día de la semana.
      </p>
    );
  }

  const updateRow = (key: string, patch: Partial<DayPointRow>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  if (tableType === 'cloro') {
    return (
      <div className="overflow-x-auto border border-gray-800">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className="px-2 py-2 text-left text-[11px] font-bold uppercase border-r border-gray-800">
                Puntos inspeccionados
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-28">
                Hora <span className="text-red-600">*</span>
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 min-w-[120px]">
                Punto de toma <span className="text-red-600">*</span>
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-16">pH</th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 whitespace-nowrap">
                Cloro residual libre<br /><span className="font-normal">(0.3 – 2 ppm)</span>
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-12">C</th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-12">NC</th>
              <th className="px-2 py-2 text-left text-[11px] font-bold uppercase">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {points.map((punto, idx) => {
              const key = pointKey(punto);
              const row = value[key] ?? {};
              const cnc = row.cnc ?? '';
              return (
                <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border-r border-b border-gray-400 font-medium text-gray-900 text-xs">
                    {punto}
                    <span className="ml-1 text-[10px] text-blue-500 font-bold uppercase">Auto</span>
                  </td>
                  <td className="px-2 py-1 border-r border-b border-gray-400">
                    <input
                      type="time"
                      value={row.hora ?? ''}
                      onChange={(e) => updateRow(key, { hora: e.target.value })}
                      disabled={disabled}
                      className={`${INPUT_CLASS} text-xs py-1.5 text-center`}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-b border-gray-400">
                    <input
                      type="text"
                      value={row.punto_toma ?? ''}
                      onChange={(e) => updateRow(key, { punto_toma: e.target.value })}
                      disabled={disabled}
                      className={`${INPUT_CLASS} text-xs py-1.5`}
                    />
                  </td>
                  <td className="px-2 py-2 border-r border-b border-gray-400 text-center bg-blue-50 text-blue-900 font-semibold text-xs">
                    7.0
                  </td>
                  <td className="px-2 py-1 border-r border-b border-gray-400">
                    <input
                      type="number"
                      step="0.1"
                      min={0.3}
                      max={2}
                      value={row.cloro_residual ?? ''}
                      onChange={(e) => updateRow(key, { cloro_residual: e.target.value })}
                      disabled={disabled}
                      className={`${INPUT_CLASS} text-xs py-1.5 text-center`}
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-b border-gray-400 text-center w-14">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => updateRow(key, { cnc: cnc === 'C' ? '' : 'C' })}
                      className={`w-full py-1 text-xs font-bold rounded border-2 ${
                        cnc === 'C' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300'
                      }`}
                    >C</button>
                  </td>
                  <td className="px-1 py-1 border-r border-b border-gray-400 text-center w-14">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => updateRow(key, { cnc: cnc === 'NC' ? '' : 'NC' })}
                      className={`w-full py-1 text-xs font-bold rounded border-2 ${
                        cnc === 'NC' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-300'
                      }`}
                    >NC</button>
                  </td>
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input
                      type="text"
                      value={row.observaciones ?? ''}
                      onChange={(e) => updateRow(key, { observaciones: e.target.value })}
                      disabled={disabled}
                      placeholder="—"
                      className={`${INPUT_CLASS} text-xs py-1.5`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-800">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-white border-b-2 border-gray-800">
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase border-r border-gray-800">
              Puntos de inspección
            </th>
            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800">
              Valores encontrados (°C) <span className="text-red-600">*</span>
            </th>
            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-12">C</th>
            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-12">NC</th>
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase">Observación</th>
          </tr>
        </thead>
        <tbody>
          {points.map((punto, idx) => {
            const key = pointKey(punto);
            const row = value[key] ?? {};
            return (
              <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 border-r border-b border-gray-400 font-medium text-gray-900 text-xs">
                  {punto}
                  <span className="ml-1 text-[10px] text-blue-500 font-bold uppercase">Auto</span>
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-400">
                  <input
                    type="number"
                    step="0.1"
                    value={row.temperatura ?? ''}
                    onChange={(e) => updateRow(key, { temperatura: e.target.value })}
                    disabled={disabled}
                    className={`${INPUT_CLASS} text-xs py-1.5 text-center`}
                  />
                </td>
                <td className="px-1 py-1 border-r border-b border-gray-400 text-center w-14">
                  <button type="button" disabled={disabled} onClick={() => updateRow(key, { cnc: row.cnc === 'C' ? '' : 'C' })}
                    className={`w-full py-1 text-xs font-bold rounded border-2 ${row.cnc === 'C' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300'}`}>C</button>
                </td>
                <td className="px-1 py-1 border-r border-b border-gray-400 text-center w-14">
                  <button type="button" disabled={disabled} onClick={() => updateRow(key, { cnc: row.cnc === 'NC' ? '' : 'NC' })}
                    className={`w-full py-1 text-xs font-bold rounded border-2 ${row.cnc === 'NC' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-300'}`}>NC</button>
                </td>
                <td className="px-2 py-1 border-b border-gray-400">
                  <input
                    type="text"
                    value={row.observaciones ?? ''}
                    onChange={(e) => updateRow(key, { observaciones: e.target.value })}
                    disabled={disabled}
                    placeholder="—"
                    className={`${INPUT_CLASS} text-xs py-1.5`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
