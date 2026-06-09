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

  const updateItem = (itemKey: string, patch: Partial<ChecklistItemData>) => {
    onChange({ ...value, [itemKey]: { ...value[itemKey], ...patch } });
  };

  if (tableMode && !columns.includes('platforms') && !columns.includes('cavaColumns') && !hasSanitary) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-700">
                Equipo o superficie
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase text-gray-700 w-28">C / NC</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-700">Observaciones</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-700">Acción correctiva</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const data = value[item.key] ?? {};
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-3 py-2 border-b border-gray-200 font-medium text-gray-800 text-xs">
                    {item.label}
                  </td>
                  <td className="px-2 py-2 border-b border-gray-200 text-center">
                    <ChoiceButtons
                      choices={choices}
                      value={data.cnc ?? ''}
                      onChange={(cnc) => updateItem(item.key, { cnc })}
                      disabled={disabled}
                      size="sm"
                    />
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200">
                    <input
                      type="text"
                      value={data.observation ?? ''}
                      onChange={(e) => updateItem(item.key, { observation: e.target.value })}
                      disabled={disabled}
                      placeholder="—"
                      className={`${INPUT_CLASS} text-xs py-1.5`}
                    />
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200">
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
