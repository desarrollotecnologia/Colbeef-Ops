import type { FieldOptions } from '@/types';
import { getDayKey } from '@/lib/autoFill';
import { getPointsForDay } from '@/lib/daySchedules';
import { INPUT_CLASS } from '@/lib/formUtils';
import { CncColumnHeader, type CncChoice } from './CncToggle';

export interface DayPointRow {
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
  embedded?: boolean;
}

function pointKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[.]/g, '');
}

function CncButtons({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <td className="px-1 py-1 border-r border-b border-gray-400 text-center w-14">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === 'C' ? '' : 'C')}
          className={`w-full py-1 text-xs font-bold rounded border-2 ${
            value === 'C' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300'
          }`}
        >
          C
        </button>
      </td>
      <td className="px-1 py-1 border-r border-b border-gray-400 text-center w-14">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === 'NC' ? '' : 'NC')}
          className={`w-full py-1 text-xs font-bold rounded border-2 ${
            value === 'NC' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-300'
          }`}
        >
          NC
        </button>
      </td>
    </>
  );
}

export default function DayScheduleTable({ options, value, onChange, workDate, disabled, embedded }: Props) {
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

  const fillAllCnc = (choice: CncChoice) => {
    const next = { ...value };
    for (const punto of points) {
      const key = pointKey(punto);
      next[key] = { ...next[key], cnc: choice };
    }
    onChange(next);
  };

  const wrapClass = embedded ? 'overflow-x-auto' : 'overflow-x-auto border border-gray-800';
  const thCnc = 'px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-12';

  if (tableType === 'cloro') {
    return (
      <div className={wrapClass}>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className="px-2 py-2 text-left text-[11px] font-bold uppercase border-r border-gray-800">
                Puntos inspeccionados
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 whitespace-nowrap">
                Cloro residual libre<br /><span className="font-normal">(0.3 – 2 ppm)</span>
              </th>
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800 w-16">pH</th>
              <CncColumnHeader choice="C" disabled={disabled} onFillAll={fillAllCnc} className={thCnc} />
              <CncColumnHeader choice="NC" disabled={disabled} onFillAll={fillAllCnc} className={thCnc} />
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
                  <td className="px-3 py-2.5 border-r border-b border-gray-400 font-medium text-gray-900 text-xs align-top">
                    {punto}
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
                  <td className="px-2 py-2.5 border-r border-b border-gray-400 text-center bg-blue-50 text-blue-900 font-semibold text-xs">
                    7.0
                  </td>
                  <CncButtons
                    value={cnc}
                    disabled={disabled}
                    onChange={(v) => updateRow(key, { cnc: v })}
                  />
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

  const esterilizadoresNote =
    'Funcionamiento, temperatura (82,5°C) o presencia de solución desinfectante aprobada para utilización en industria de alimentos';

  return (
    <div className={wrapClass}>
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-white border-b-2 border-gray-800">
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase border-r border-gray-800 w-36" />
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase border-r border-gray-800">
              Puntos de inspección
            </th>
            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800">
              Valores encontrados (°C)
            </th>
            <CncColumnHeader choice="C" disabled={disabled} onFillAll={fillAllCnc} className={thCnc} />
            <CncColumnHeader choice="NC" disabled={disabled} onFillAll={fillAllCnc} className={thCnc} />
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase">Observación</th>
          </tr>
        </thead>
        <tbody>
          {points.map((punto, idx) => {
            const key = pointKey(punto);
            const row = value[key] ?? {};
            const cnc = row.cnc ?? '';
            return (
              <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {idx === 0 && (
                  <td
                    rowSpan={points.length}
                    className="px-2 py-2 border-r border-b border-gray-400 align-top bg-gray-50 text-[10px] text-gray-800 leading-snug"
                  >
                    <p className="font-bold uppercase text-xs mb-1">Esterilizadores</p>
                    <p>{esterilizadoresNote}</p>
                  </td>
                )}
                <td className="px-3 py-2.5 border-r border-b border-gray-400 font-medium text-gray-900 text-xs align-top">
                  {punto}
                </td>
                <td className="px-2 py-1 border-r border-b border-gray-400">
                  <input
                    type="text"
                    value={row.temperatura ?? ''}
                    onChange={(e) => updateRow(key, { temperatura: e.target.value })}
                    disabled={disabled}
                    className={`${INPUT_CLASS} text-xs py-1.5 text-center`}
                  />
                </td>
                <CncButtons
                  value={cnc}
                  disabled={disabled}
                  onChange={(v) => updateRow(key, { cnc: v })}
                />
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
