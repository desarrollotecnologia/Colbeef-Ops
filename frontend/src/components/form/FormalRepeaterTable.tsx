import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions, RepeaterColumn } from '@/types';
import { INPUT_CLASS, isTemperatureInput, showRequiredIndicator } from '@/lib/formUtils';
import Button from '@/components/Button';
import CncToggle, { CncColumnHeader, type CncChoice } from './CncToggle';
import { cncCellClass, cncHeaderClass, expandRepeaterColumns, type ExpandedRepeaterCol } from './repeaterColumns';

interface Props {
  options: FieldOptions;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  disabled?: boolean;
}

function RepeaterCell({
  col,
  value,
  onChange,
  disabled,
}: {
  col: RepeaterColumn;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  const type = col.type as string;

  if (type === 'SELECT') {
    const choices = col.options?.choices ?? [];
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${INPUT_CLASS} text-xs py-1`}
      >
        <option value="">—</option>
        {choices.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'MULTI_SELECT') {
    const choices = col.options?.choices ?? [];
    const selected = Array.isArray(value) ? (value as string[]) : typeof value === 'string' && value ? [value] : [];
    return (
      <div className="flex flex-wrap gap-0.5">
        {choices.map((c) => {
          const active = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = active ? selected.filter((s) => s !== c) : [...selected, c];
                onChange(next);
              }}
              className={`px-1.5 py-0.5 text-[10px] rounded border ${
                active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-300'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'NUMBER') {
    const textInput = isTemperatureInput(col.key, col.label);
    return (
      <input
        type={textInput ? 'text' : 'number'}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={textInput ? undefined : col.config?.min}
        max={textInput ? undefined : col.config?.max}
        className={`${INPUT_CLASS} text-xs py-1`}
      />
    );
  }

  if (type === 'TIME') {
    return (
      <input
        type="time"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${INPUT_CLASS} text-xs py-1`}
      />
    );
  }

  if (type === 'DATE') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${INPUT_CLASS} text-xs py-1`}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="—"
      className={`${INPUT_CLASS} text-xs py-1`}
    />
  );
}

type HeaderGroup =
  | { kind: 'field'; col: RepeaterColumn; span: 1 }
  | { kind: 'cncGroup'; col: RepeaterColumn; choices: ('C' | 'NC' | 'NA')[] };

/** Agrupa columnas C/NC/NA bajo el título del aspecto (Guantes, Cuchillo, …). */
function buildHeaderGroups(columns: RepeaterColumn[]): HeaderGroup[] {
  const groups: HeaderGroup[] = [];
  for (const col of columns) {
    if (col.type === 'CHECKLIST') {
      const choices = (col.options?.choices ?? ['C', 'NC']).filter(
        (c): c is 'C' | 'NC' | 'NA' => c === 'C' || c === 'NC' || c === 'NA'
      );
      groups.push({ kind: 'cncGroup', col, choices: choices.length ? choices : ['C', 'NC'] });
    } else {
      groups.push({ kind: 'field', col, span: 1 });
    }
  }
  return groups;
}

function hasCncGroups(groups: HeaderGroup[]) {
  return groups.some((g) => g.kind === 'cncGroup');
}

export default function FormalRepeaterTable({ options, value, onChange, disabled }: Props) {
  const columns = (options.columns_def ?? options.columns ?? []).filter(
    (c): c is RepeaterColumn => typeof c === 'object' && c !== null && 'key' in c
  );
  const expandedCols = expandRepeaterColumns(columns);
  const headerGroups = buildHeaderGroups(columns);
  const twoRowHeader = hasCncGroups(headerGroups);
  const minRows = options.minRows ?? 1;
  const maxRows = options.maxRows ?? 50;
  const rows =
    value.length >= minRows ? value : Array.from({ length: minRows }, (): Record<string, unknown> => ({}));

  const updateRow = (idx: number, key: string, val: unknown) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  };

  const addRow = () => {
    if (rows.length < maxRows) onChange([...rows, {}]);
  };

  const removeRow = (idx: number) => {
    if (rows.length > minRows) onChange(rows.filter((_, i) => i !== idx));
  };

  const fillAllCnc = (colKey: string, choice: CncChoice) => {
    onChange(rows.map((row) => ({ ...row, [colKey]: choice })));
  };

  const thClass = 'px-2 py-2 text-left text-[10px] font-bold uppercase border-r border-gray-800 whitespace-nowrap';
  const thCenter = `${thClass} text-center`;
  const thGroup =
    'px-1 py-1.5 text-center text-[9px] font-bold uppercase border-r border-l border-gray-800 leading-tight max-w-[7.5rem]';
  const tdClass = 'px-2 py-1.5 border-r border-b border-gray-400 align-top';

  const renderCell = (ec: ExpandedRepeaterCol, row: Record<string, unknown>, idx: number, i: number) => (
    <td
      key={`${ec.kind === 'cnc' ? ec.col.key + ec.choice : ec.col.key}-${i}`}
      className={`${tdClass} ${
        ec.kind === 'cnc' ? `text-center w-11 px-0.5 ${cncCellClass(ec.choice)}` : 'min-w-[80px]'
      }`}
    >
      {ec.kind === 'cnc' ? (
        <CncToggle
          choice={ec.choice}
          value={String(row[ec.col.key] ?? '')}
          disabled={disabled}
          onChange={(v) => updateRow(idx, ec.col.key, v)}
        />
      ) : (
        <RepeaterCell
          col={ec.col}
          value={row[ec.col.key]}
          onChange={(v) => updateRow(idx, ec.col.key, v)}
          disabled={disabled}
        />
      )}
    </td>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px] border-collapse">
          <thead>
            {twoRowHeader ? (
              <>
                <tr className="bg-[#d9ead3] border-b border-gray-800">
                  <th className={`${thCenter} w-8 bg-[#d9ead3]`} rowSpan={2}>
                    #
                  </th>
                  {headerGroups.map((g) =>
                    g.kind === 'field' ? (
                      <th key={g.col.key} className={`${thClass} bg-[#d9ead3]`} rowSpan={2}>
                        {g.col.label}
                        {showRequiredIndicator(g.col.required) && (
                          <span className="text-red-500 ml-0.5">*</span>
                        )}
                      </th>
                    ) : (
                      <th
                        key={g.col.key}
                        colSpan={g.choices.length}
                        className={`${thGroup} bg-[#d9ead3]`}
                      >
                        {g.col.label}
                        {showRequiredIndicator(g.col.required) && (
                          <span className="text-red-500 ml-0.5">*</span>
                        )}
                      </th>
                    )
                  )}
                  {!disabled && rows.length > minRows && <th className="w-8 bg-[#d9ead3]" rowSpan={2} />}
                </tr>
                <tr className="bg-white border-b-2 border-gray-800">
                  {headerGroups.map((g) =>
                    g.kind === 'cncGroup'
                      ? g.choices.map((choice) => (
                          <CncColumnHeader
                            key={`${g.col.key}-${choice}`}
                            choice={choice}
                            disabled={disabled}
                            onFillAll={(c) => fillAllCnc(g.col.key, c)}
                            className={`${thCenter} w-11 ${cncHeaderClass(choice)} border-l first:border-l-0 border-gray-400`}
                          />
                        ))
                      : null
                  )}
                </tr>
              </>
            ) : (
              <tr className="bg-white border-b-2 border-gray-800">
                <th className={`${thCenter} w-8`}>#</th>
                {expandedCols.map((ec, i) => (
                  <th
                    key={`${ec.kind === 'cnc' ? ec.col.key + ec.choice : ec.col.key}-${i}`}
                    className={`${thCenter} w-12 ${ec.kind === 'cnc' ? cncHeaderClass(ec.choice) : ''}`}
                  >
                    {ec.kind === 'cnc' ? ec.choice : ec.col.label}
                    {ec.kind === 'field' && showRequiredIndicator(ec.col.required) && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </th>
                ))}
                {!disabled && rows.length > minRows && <th className="w-8" />}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={`${tdClass} text-center text-xs font-semibold text-gray-500`}>{idx + 1}</td>
                {expandedCols.map((ec, i) => renderCell(ec, row, idx, i))}
                {!disabled && rows.length > minRows && (
                  <td className="px-1 py-1 border-b border-gray-400">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && rows.length < maxRows && (
        <div className="px-3 py-2 border-t border-gray-200">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus size={14} /> Agregar fila
          </Button>
        </div>
      )}
    </div>
  );
}
