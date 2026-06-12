import { Fragment } from 'react';
import type { ChecklistItemData, FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';

type CncChoice = 'C' | 'NC' | 'NA';

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
}

type ChecklistColumn = 'cnc' | 'observation' | 'corrective' | 'platforms' | 'cavaColumns';

function checklistColumns(options: FieldOptions): ChecklistColumn[] {
  const rawCols = options.columns;
  if (Array.isArray(rawCols) && (!rawCols[0] || typeof rawCols[0] === 'string')) {
    return rawCols as ChecklistColumn[];
  }
  return ['cavaColumns'];
}

export default function CavaMatrixTable({ options, value, onChange, disabled }: Props) {
  const items = options.items ?? [];
  const areaLabel = options.areaLabel;
  const cavaColumns = options.cavaColumns ?? [];
  const columns = checklistColumns(options);
  const columnDefs =
    options.columnDefs?.length
      ? options.columnDefs
      : cavaColumns.map((key) => ({ key, mode: 'cnc_na' as const }));

  const subColsFor = (mode?: 'cnc' | 'cnc_na'): CncChoice[] =>
    mode === 'cnc_na' ? ['C', 'NC', 'NA'] : ['C', 'NC'];

  const showObsCols = columns.includes('observation') || columns.includes('corrective');

  const thClass = 'px-1 py-2 text-center text-[10px] font-bold uppercase border-r border-gray-800 whitespace-nowrap';
  const tdClass = 'px-1 py-1 border-r border-b border-gray-400';
  const stickyLabelClass = `sticky ${areaLabel ? 'left-8' : 'left-0'} z-10 bg-inherit px-3 py-2 font-medium text-gray-900 text-xs border-r border-gray-400`;

  const updateItem = (itemKey: string, patch: Partial<ChecklistItemData>) => {
    onChange({ ...value, [itemKey]: { ...value[itemKey], ...patch } });
  };

  if (columnDefs.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] text-amber-800 bg-amber-50 border-b border-amber-200 px-3 py-1.5">
        Deslice horizontalmente → cada columna es una cava o máquina. Marque C / NC / NA en cada cruce.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: `${280 + columnDefs.length * 52}px` }}>
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              {areaLabel && <th className={`${thClass} w-8 sticky left-0 z-20 bg-gray-100`} rowSpan={2} />}
              <th
                className={`${thClass} text-left sticky ${areaLabel ? 'left-8' : 'left-0'} z-20 bg-gray-100 min-w-[140px]`}
                rowSpan={2}
              >
                Equipo o superficie
              </th>
              {columnDefs.map((col) => (
                <th key={col.key} colSpan={subColsFor(col.mode).length} className={thClass}>
                  {col.key}
                </th>
              ))}
              {showObsCols && columns.includes('observation') && (
                <th className={`${thClass} text-left min-w-[90px]`} rowSpan={2}>Obs.</th>
              )}
              {showObsCols && columns.includes('corrective') && (
                <th className="px-1 py-2 text-left text-[10px] font-bold uppercase min-w-[90px]" rowSpan={2}>AC</th>
              )}
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {columnDefs.map((col) =>
                subColsFor(col.mode).map((sub) => (
                  <th key={`${col.key}-${sub}`} className={`${thClass} w-9 min-w-[2.25rem]`}>{sub}</th>
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
                  {columnDefs.map((col) => {
                    const cnc = data.cavas?.[col.key] ?? '';
                    return (
                      <Fragment key={col.key}>
                        {subColsFor(col.mode).map((sub) => (
                          <td key={`${col.key}-${sub}`} className={`${tdClass} text-center w-9 min-w-[2.25rem] px-0.5`}>
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
                        value={data.observation ?? ''}
                        onChange={(e) => updateItem(item.key, { observation: e.target.value })}
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
                        value={data.corrective ?? ''}
                        onChange={(e) => updateItem(item.key, { corrective: e.target.value })}
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
