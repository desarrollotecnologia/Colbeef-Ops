import { Fragment } from 'react';
import type { ChecklistItemData, FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import { CncColumnHeader, type CncChoice } from './CncToggle';

/** Fondos alternados por grupo de cava (C#10, C#9, …) para no confundir columnas */
const GROUP_HEADER_BG = ['bg-sky-100', 'bg-teal-100'] as const;
const GROUP_CELL_BG = ['bg-sky-50/90', 'bg-teal-50/90'] as const;

function groupHeaderBg(colIdx: number) {
  return GROUP_HEADER_BG[colIdx % GROUP_HEADER_BG.length];
}

function groupCellBg(colIdx: number) {
  return GROUP_CELL_BG[colIdx % GROUP_CELL_BG.length];
}

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
    choice === 'C'
      ? 'bg-green-600 text-white border-green-600'
      : choice === 'NC'
        ? 'bg-red-600 text-white border-red-600'
        : 'bg-gray-500 text-white border-gray-500';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(active ? '' : choice)}
      className={`w-full py-0.5 text-[10px] font-bold rounded border ${
        active ? activeClass : 'bg-white border-gray-300'
      }`}
    >
      {choice}
    </button>
  );
}

function AreaLabelCell({ label, rowSpan }: { label: string; rowSpan: number }) {
  return (
    <td
      rowSpan={rowSpan}
      className="sticky left-0 z-20 px-1 py-2 border-r border-gray-400 bg-gray-50 align-middle text-center w-8 min-w-[2rem]"
    >
      <span
        className="text-[9px] font-bold uppercase text-gray-800 inline-block leading-tight"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '12rem' }}
      >
        {label}
      </span>
    </td>
  );
}

interface Props {
  options: FieldOptions;
  value: Record<string, ChecklistItemData>;
  onChange: (v: Record<string, ChecklistItemData>) => void;
  disabled?: boolean;
  showObsCols?: boolean;
  showScrollHint?: boolean;
  hideAreaLabel?: boolean;
  compact?: boolean;
  /** Cuando la matriz está dividida en bloques, observaciones van por bloque */
  obsScopeKey?: string;
  /** Primer bloque: leer observation/corrective planos de datos viejos */
  migrateLegacyObs?: boolean;
}

type ChecklistColumn = 'cnc' | 'observation' | 'corrective' | 'platforms' | 'cavaColumns';

function checklistColumns(options: FieldOptions): ChecklistColumn[] {
  const rawCols = options.columns;
  if (Array.isArray(rawCols) && (!rawCols[0] || typeof rawCols[0] === 'string')) {
    return rawCols as ChecklistColumn[];
  }
  return ['cavaColumns'];
}

export default function CavaMatrixTable({
  options,
  value,
  onChange,
  disabled,
  showObsCols: showObsColsProp,
  showScrollHint = true,
  hideAreaLabel = false,
  compact = false,
  obsScopeKey,
  migrateLegacyObs = false,
}: Props) {
  const items = options.items ?? [];
  const areaLabel = hideAreaLabel ? undefined : options.areaLabel;
  const cavaColumns = options.cavaColumns ?? [];
  const columns = checklistColumns(options);
  const columnDefs =
    options.columnDefs?.length
      ? options.columnDefs
      : cavaColumns.map((key) => ({ key, mode: 'cnc_na' as const }));

  const subColsFor = (mode?: 'cnc' | 'cnc_na'): CncChoice[] =>
    mode === 'cnc_na' ? ['C', 'NC', 'NA'] : ['C', 'NC'];

  const showObsCols =
    showObsColsProp ?? (columns.includes('observation') || columns.includes('corrective'));
  const rowLabel = options.matrixRowLabel ?? 'Equipo o superficie';

  const thClass = `px-1 ${compact ? 'py-1.5' : 'py-2'} text-center text-[10px] font-bold uppercase border-r border-gray-800 whitespace-nowrap`;
  const tdClass = `px-1 ${compact ? 'py-1.5' : 'py-1'} border-r border-b border-gray-400`;
  const stickyLabelClass = `sticky ${areaLabel ? 'left-8' : 'left-0'} z-10 bg-inherit px-3 ${compact ? 'py-1.5' : 'py-2'} font-medium text-gray-900 text-xs border-r border-gray-400 min-w-[120px] max-w-[180px]`;

  const updateItem = (itemKey: string, patch: Partial<ChecklistItemData>) => {
    onChange({ ...value, [itemKey]: { ...value[itemKey], ...patch } });
  };

  const fillAllCava = (cavaKey: string, choice: CncChoice) => {
    const next = { ...value };
    for (const item of items) {
      const row = next[item.key] ?? {};
      next[item.key] = {
        ...row,
        cavas: { ...row.cavas, [cavaKey]: choice },
      };
    }
    onChange(next);
  };

  const readObservation = (data: ChecklistItemData): string => {
    if (!obsScopeKey) return data.observation ?? '';
    if (data.observations?.[obsScopeKey] !== undefined) return data.observations[obsScopeKey] ?? '';
    if (migrateLegacyObs && data.observation) return data.observation;
    return '';
  };

  const readCorrective = (data: ChecklistItemData): string => {
    if (!obsScopeKey) return data.corrective ?? '';
    if (data.correctives?.[obsScopeKey] !== undefined) return data.correctives[obsScopeKey] ?? '';
    if (migrateLegacyObs && data.corrective) return data.corrective;
    return '';
  };

  const writeObservation = (data: ChecklistItemData, text: string): Partial<ChecklistItemData> => {
    if (!obsScopeKey) return { observation: text };
    return { observations: { ...(data.observations ?? {}), [obsScopeKey]: text } };
  };

  const writeCorrective = (data: ChecklistItemData, text: string): Partial<ChecklistItemData> => {
    if (!obsScopeKey) return { corrective: text };
    return { correctives: { ...(data.correctives ?? {}), [obsScopeKey]: text } };
  };

  if (columnDefs.length === 0) return null;

  return (
    <div>
      {showScrollHint && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border-b border-amber-200 px-3 py-1.5">
          Cada grupo de color (azul / verde claro) es una cava o máquina — marque C / NC / NA en cada cruce.
          Puede hacer clic en el encabezado C, NC o NA para marcar toda la columna y luego ajustar fila por fila.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: `${280 + columnDefs.length * 52}px` }}>
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              {areaLabel && <th className={`${thClass} w-8 sticky left-0 z-20 bg-gray-100`} rowSpan={2} />}
              <th
                className={`${thClass} text-left sticky ${areaLabel ? 'left-8' : 'left-0'} z-20 bg-gray-100 min-w-[140px]`}
                rowSpan={2}
              >
                {rowLabel}
              </th>
              {columnDefs.map((col, colIdx) => (
                <th
                  key={col.key}
                  colSpan={subColsFor(col.mode).length}
                  className={`${thClass} ${groupHeaderBg(colIdx)} border-l-2 border-l-gray-400`}
                >
                  {col.key}
                </th>
              ))}
              {showObsCols && columns.includes('observation') && (
                <th className={`${thClass} text-left min-w-[110px]`} rowSpan={2}>Observaciones</th>
              )}
              {showObsCols && columns.includes('corrective') && (
                <th className="px-1 py-2 text-left text-[10px] font-bold uppercase min-w-[110px]" rowSpan={2}>
                  Acción correctiva
                </th>
              )}
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {columnDefs.map((col, colIdx) =>
                subColsFor(col.mode).map((sub, subIdx) => (
                  <CncColumnHeader
                    key={`${col.key}-${sub}`}
                    choice={sub}
                    disabled={disabled}
                    onFillAll={(c) => fillAllCava(col.key, c)}
                    className={`${thClass} w-9 min-w-[2.25rem] ${groupHeaderBg(colIdx)} ${
                      subIdx === 0 ? 'border-l-2 border-l-gray-400' : ''
                    }`}
                  />
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const data = value[item.key] ?? {};
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
              return (
                <tr key={item.key} className={rowBg}>
                  {areaLabel && idx === 0 && <AreaLabelCell label={areaLabel} rowSpan={items.length} />}
                  <td className={`${stickyLabelClass} ${rowBg}`}>{item.label}</td>
                  {columnDefs.map((col, colIdx) => {
                    const cnc = data.cavas?.[col.key] ?? '';
                    const cellBg = groupCellBg(colIdx);
                    return (
                      <Fragment key={col.key}>
                        {subColsFor(col.mode).map((sub, subIdx) => (
                          <td
                            key={`${col.key}-${sub}`}
                            className={`${tdClass} text-center w-9 min-w-[2.25rem] px-0.5 ${cellBg} ${
                              subIdx === 0 ? 'border-l-2 border-l-gray-300' : ''
                            }`}
                          >
                            <CncToggle
                              choice={sub}
                              value={cnc}
                              disabled={disabled}
                              onChange={(v) => updateItem(item.key, { cavas: { ...data.cavas, [col.key]: v } })}
                            />
                          </td>
                        ))}
                      </Fragment>
                    );
                  })}
                  {showObsCols && columns.includes('observation') && (
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={readObservation(data)}
                        onChange={(e) => updateItem(item.key, writeObservation(data, e.target.value))}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1`}
                      />
                    </td>
                  )}
                  {showObsCols && columns.includes('corrective') && (
                    <td className="px-1 py-1 border-b border-gray-400">
                      <input
                        type="text"
                        value={readCorrective(data)}
                        onChange={(e) => updateItem(item.key, writeCorrective(data, e.target.value))}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1`}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
