import { Fragment } from 'react';
import type { ChecklistItemData, FieldOptions } from '@/types';
import ChoiceButtons from './ChoiceButtons';
import { INPUT_CLASS } from '@/lib/formUtils';

interface Props {
  options: FieldOptions;
  value: Record<string, ChecklistItemData>;
  onChange: (v: Record<string, ChecklistItemData>) => void;
  disabled?: boolean;
  tableMode?: boolean;
}

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
      className={`w-full py-1 text-xs font-bold rounded border-2 ${
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
      className="px-1 py-2 border-r border-gray-400 bg-gray-50 align-middle text-center w-8 min-w-[2rem]"
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

type ChecklistItem = NonNullable<FieldOptions['items']>[number];

interface SectionGroup {
  label: string;
  items: ChecklistItem[];
}

function groupBySection(items: ChecklistItem[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  for (const item of items) {
    const sec = item.section ?? '';
    const last = groups[groups.length - 1];
    if (last && last.label === sec) last.items.push(item);
    else groups.push({ label: sec, items: [item] });
  }
  return groups;
}

export default function ItemChecklist({ options, value, onChange, disabled, tableMode = false }: Props) {
  const items = options.items ?? [];
  const choices = options.choices ?? ['C', 'NC'];
  const rawCols = options.columns;
  const columns = (
    Array.isArray(rawCols) && (!rawCols[0] || typeof rawCols[0] === 'string')
      ? rawCols
      : ['cnc', 'observation', 'corrective']
  ) as ('cnc' | 'observation' | 'corrective' | 'platforms' | 'cavaColumns' | 'fr' | 'rev_cnc' | 'final_cnc' | 'responsible')[];

  const hasSanitary = columns.includes('rev_cnc') || columns.includes('final_cnc');
  const platformCount = options.platformCount ?? 5;
  const cavaColumns = options.cavaColumns ?? [];
  const areaLabel = options.areaLabel;
  const useNa = options.mode === 'cnc_na' || choices.includes('NA');
  const cncSubCols: CncChoice[] = useNa ? ['C', 'NC', 'NA'] : ['C', 'NC'];
  const columnDefs =
    options.columnDefs?.length
      ? options.columnDefs
      : cavaColumns.map((key) => ({ key, mode: (useNa ? 'cnc_na' : 'cnc') as 'cnc' | 'cnc_na' }));
  const subColsFor = (mode?: 'cnc' | 'cnc_na'): CncChoice[] =>
    mode === 'cnc_na' ? ['C', 'NC', 'NA'] : ['C', 'NC'];

  const updateItem = (itemKey: string, patch: Partial<ChecklistItemData>) => {
    onChange({ ...value, [itemKey]: { ...value[itemKey], ...patch } });
  };

  const thClass = 'px-2 py-2 text-center text-[11px] font-bold uppercase border-r border-gray-800';
  const tdClass = 'px-2 py-1 border-r border-b border-gray-400';

  if (tableMode && columns.includes('platforms')) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              {areaLabel && <th className={`${thClass} w-8`} rowSpan={2} />}
              <th className={`${thClass} text-left`} rowSpan={2}>
                Equipo o superficie
              </th>
              {Array.from({ length: platformCount }, (_, i) => (
                <th key={i} colSpan={2} className={`${thClass} whitespace-nowrap`}>
                  PLAT {i + 1}
                </th>
              ))}
              <th className={`${thClass} text-left min-w-[100px]`} rowSpan={2}>Observaciones</th>
              <th className="px-2 py-2 text-left text-[11px] font-bold uppercase min-w-[100px]" rowSpan={2}>
                Acción correctiva
              </th>
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {Array.from({ length: platformCount }, (_, i) => (
                <Fragment key={i}>
                  <th className={`${thClass} w-10`}>C</th>
                  <th className={`${thClass} w-10`}>NC</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const data = value[item.key] ?? {};
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {areaLabel && idx === 0 && <AreaLabelCell label={areaLabel} rowSpan={items.length} />}
                  <td className={`${tdClass} px-3 py-2 font-medium text-gray-900 text-xs`}>
                    {item.label}
                  </td>
                  {Array.from({ length: platformCount }, (_, i) => {
                    const plat = String(i + 1);
                    const cnc = data.platforms?.[plat] ?? '';
                    return (
                      <Fragment key={plat}>
                        <td className={`${tdClass} text-center w-12 px-1`}>
                          <CncToggle
                            choice="C"
                            value={cnc}
                            disabled={disabled}
                            onChange={(v) => updateItem(item.key, { platforms: { ...data.platforms, [plat]: v } })}
                          />
                        </td>
                        <td className={`${tdClass} text-center w-12 px-1`}>
                          <CncToggle
                            choice="NC"
                            value={cnc}
                            disabled={disabled}
                            onChange={(v) => updateItem(item.key, { platforms: { ...data.platforms, [plat]: v } })}
                          />
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className={tdClass}>
                    <input
                      type="text"
                      value={data.observation ?? ''}
                      onChange={(e) => updateItem(item.key, { observation: e.target.value })}
                      disabled={disabled}
                      placeholder="—"
                      className={`${INPUT_CLASS} text-xs py-1.5`}
                    />
                  </td>
                  <td className="px-2 py-1 border-b border-gray-400">
                    <input
                      type="text"
                      value={data.corrective ?? ''}
                      onChange={(e) => updateItem(item.key, { corrective: e.target.value })}
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

  if (tableMode && hasSanitary) {
    const hasSections = items.some((item) => item.section);
    const sectionGroups = hasSections ? groupBySection(items) : [{ label: '', items }];
    let rowIdx = 0;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              {hasSections && <th className={`${thClass} text-left w-28`} rowSpan={2}>Sección</th>}
              <th className={`${thClass} text-left`} rowSpan={2}>Operación sanitaria</th>
              <th className={`${thClass} w-10`} rowSpan={2}>FR</th>
              <th className={thClass} colSpan={2}>Rev.</th>
              <th className={`${thClass} text-left min-w-[100px]`} rowSpan={2}>Observación</th>
              <th className={`${thClass} text-left min-w-[100px]`} rowSpan={2}>Corrección</th>
              <th className={thClass} colSpan={2}>Verif. final</th>
              <th className={`${thClass} text-left min-w-[90px]`} rowSpan={2}>Responsable</th>
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {cncSubCols.map((sub) => (
                <th key={`rev-${sub}`} className={`${thClass} w-10`}>{sub}</th>
              ))}
              {cncSubCols.map((sub) => (
                <th key={`final-${sub}`} className={`${thClass} w-10`}>{sub}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionGroups.flatMap((group) =>
              group.items.map((item, idxInGroup) => {
                const data = value[item.key] ?? {};
                const currentRow = rowIdx;
                rowIdx += 1;
                return (
                  <tr key={item.key} className={currentRow % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {hasSections && idxInGroup === 0 && (
                      <td
                        rowSpan={group.items.length}
                        className={`${tdClass} px-2 py-2 text-xs font-bold uppercase text-gray-800 bg-gray-50 align-middle`}
                      >
                        {group.label}
                      </td>
                    )}
                    <td className={`${tdClass} px-3 py-2 font-medium text-gray-900 text-xs`}>{item.label}</td>
                    <td className={`${tdClass} text-center text-xs font-mono text-gray-600`}>{item.fr ?? '—'}</td>
                    {cncSubCols.map((sub) => (
                      <td key={`rev-${sub}`} className={`${tdClass} text-center w-11 px-0.5`}>
                        <CncToggle
                          choice={sub}
                          value={data.rev_cnc ?? ''}
                          disabled={disabled}
                          onChange={(v) => updateItem(item.key, { rev_cnc: v })}
                        />
                      </td>
                    ))}
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={data.observation ?? ''}
                        onChange={(e) => updateItem(item.key, { observation: e.target.value })}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={data.corrective ?? ''}
                        onChange={(e) => updateItem(item.key, { corrective: e.target.value })}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                    {cncSubCols.map((sub) => (
                      <td key={`final-${sub}`} className={`${tdClass} text-center w-11 px-0.5`}>
                        <CncToggle
                          choice={sub}
                          value={data.final_cnc ?? ''}
                          disabled={disabled}
                          onChange={(v) => updateItem(item.key, { final_cnc: v })}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 border-b border-gray-400">
                      <input
                        type="text"
                        value={data.responsible ?? ''}
                        onChange={(e) => updateItem(item.key, { responsible: e.target.value })}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableMode && columns.includes('cavaColumns') && columnDefs.length > 0 && !columns.includes('cnc')) {
    const showObsCols = columns.includes('observation') || columns.includes('corrective');
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              {areaLabel && <th className={`${thClass} w-8`} rowSpan={2} />}
              <th className={`${thClass} text-left`} rowSpan={2}>Equipo o superficie</th>
              {columnDefs.map((col) => (
                <th key={col.key} colSpan={subColsFor(col.mode).length} className={`${thClass} whitespace-nowrap`}>
                  {col.key}
                </th>
              ))}
              {showObsCols && columns.includes('observation') && (
                <th className={`${thClass} text-left min-w-[100px]`} rowSpan={2}>Observaciones</th>
              )}
              {showObsCols && columns.includes('corrective') && (
                <th className="px-2 py-2 text-left text-[11px] font-bold uppercase min-w-[100px]" rowSpan={2}>
                  Acción correctiva
                </th>
              )}
            </tr>
            <tr className="bg-white border-b-2 border-gray-800">
              {columnDefs.map((col) =>
                subColsFor(col.mode).map((sub) => (
                  <th key={`${col.key}-${sub}`} className={`${thClass} w-10`}>{sub}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const data = value[item.key] ?? {};
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {areaLabel && idx === 0 && <AreaLabelCell label={areaLabel} rowSpan={items.length} />}
                  <td className={`${tdClass} px-3 py-2 font-medium text-gray-900 text-xs`}>{item.label}</td>
                  {columnDefs.map((col) => {
                    const cnc = data.cavas?.[col.key] ?? '';
                    return (
                      <Fragment key={col.key}>
                        {subColsFor(col.mode).map((sub) => (
                          <td key={`${col.key}-${sub}`} className={`${tdClass} text-center w-11 px-0.5`}>
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
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                  )}
                  {showObsCols && columns.includes('corrective') && (
                    <td className="px-2 py-1 border-b border-gray-400">
                      <input
                        type="text"
                        value={data.corrective ?? ''}
                        onChange={(e) => updateItem(item.key, { corrective: e.target.value })}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableMode && !columns.includes('platforms') && !hasSanitary && (columns.includes('cnc') || (!columns.includes('cavaColumns') && columnDefs.length === 0))) {
    const hasSections = items.some((item) => item.section);
    const sectionGroups = hasSections ? groupBySection(items) : [{ label: '', items }];
    let rowIdx = 0;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              {areaLabel && <th className={`${thClass} w-8`} />}
              {hasSections && <th className={`${thClass} text-left w-28`}>Área</th>}
              <th className={`${thClass} text-left`}>Equipo o superficie</th>
              {cncSubCols.map((sub) => (
                <th key={sub} className={`${thClass} w-12`}>{sub}</th>
              ))}
              <th className={`${thClass} text-left`}>Observaciones</th>
              <th className="px-2 py-2 text-left text-[11px] font-bold uppercase">Acción correctiva</th>
            </tr>
          </thead>
          <tbody>
            {sectionGroups.flatMap((group) =>
              group.items.map((item, idxInGroup) => {
                const data = value[item.key] ?? {};
                const cnc = data.cnc ?? '';
                const currentRow = rowIdx;
                rowIdx += 1;
                return (
                  <tr key={item.key} className={currentRow % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {areaLabel && currentRow === 0 && (
                      <AreaLabelCell label={areaLabel} rowSpan={items.length} />
                    )}
                    {hasSections && idxInGroup === 0 && (
                      <td
                        rowSpan={group.items.length}
                        className={`${tdClass} px-2 py-2 text-xs font-bold uppercase text-gray-800 bg-gray-50 align-middle`}
                      >
                        {group.label}
                      </td>
                    )}
                    <td className={`${tdClass} px-3 py-2 font-medium text-gray-900 text-xs`}>
                      {item.label}
                    </td>
                    {cncSubCols.map((sub) => (
                      <td key={sub} className={`${tdClass} text-center w-12 px-1`}>
                        <CncToggle choice={sub} value={cnc} disabled={disabled} onChange={(v) => updateItem(item.key, { cnc: v })} />
                      </td>
                    ))}
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={data.observation ?? ''}
                        onChange={(e) => updateItem(item.key, { observation: e.target.value })}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                    <td className="px-2 py-1 border-b border-gray-400">
                      <input
                        type="text"
                        value={data.corrective ?? ''}
                        onChange={(e) => updateItem(item.key, { corrective: e.target.value })}
                        disabled={disabled}
                        placeholder="—"
                        className={`${INPUT_CLASS} text-xs py-1.5`}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const data = value[item.key] ?? {};
        return (
          <div key={item.key} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-medium text-sm text-gray-800">{item.label}</p>
              {(columns.includes('fr') || item.fr) && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">{item.fr ?? '—'}</span>
              )}
            </div>
            {columns.includes('rev_cnc') && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Rev. C/NC</p>
                <ChoiceButtons choices={choices.filter((c) => c !== 'NA')} value={data.rev_cnc ?? ''} onChange={(v) => updateItem(item.key, { rev_cnc: v })} disabled={disabled} size="sm" />
              </div>
            )}
            {columns.includes('cnc') && (
              <div className="mb-2">
                <ChoiceButtons choices={choices} value={data.cnc ?? ''} onChange={(cnc) => updateItem(item.key, { cnc })} disabled={disabled} size="sm" />
              </div>
            )}
            {columns.includes('platforms') && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Plataformas</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: platformCount }, (_, i) => {
                    const plat = String(i + 1);
                    return (
                      <div key={plat} className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 w-12">PLAT {plat}</span>
                        <ChoiceButtons choices={choices.filter((c) => c !== 'NA')} value={data.platforms?.[plat] ?? ''} onChange={(v) => updateItem(item.key, { platforms: { ...data.platforms, [plat]: v } })} disabled={disabled} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {columns.includes('cavaColumns') && cavaColumns.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Cavas</p>
                <div className="flex flex-wrap gap-3">
                  {cavaColumns.map((cava) => (
                    <div key={cava} className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">{cava}</span>
                      <ChoiceButtons choices={choices} value={data.cavas?.[cava] ?? ''} onChange={(v) => updateItem(item.key, { cavas: { ...data.cavas, [cava]: v } })} disabled={disabled} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {columns.includes('observation') && (
              <input type="text" value={data.observation ?? ''} onChange={(e) => updateItem(item.key, { observation: e.target.value })} disabled={disabled} placeholder="Observación" className={`${INPUT_CLASS} text-sm mb-2`} />
            )}
            {columns.includes('corrective') && (
              <input type="text" value={data.corrective ?? ''} onChange={(e) => updateItem(item.key, { corrective: e.target.value })} disabled={disabled} placeholder="Corrección (si aplica)" className={`${INPUT_CLASS} text-sm mb-2`} />
            )}
            {columns.includes('final_cnc') && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">C/NC Final</p>
                <ChoiceButtons choices={choices.filter((c) => c !== 'NA')} value={data.final_cnc ?? ''} onChange={(v) => updateItem(item.key, { final_cnc: v })} disabled={disabled} size="sm" />
              </div>
            )}
            {columns.includes('responsible') && (
              <input type="text" value={data.responsible ?? ''} onChange={(e) => updateItem(item.key, { responsible: e.target.value })} disabled={disabled} placeholder="Responsable" className={`${INPUT_CLASS} text-sm`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
