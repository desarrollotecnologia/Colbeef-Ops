import type { ChecklistItemData } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';

interface Item {
  key: string;
  label: string;
}

interface Props {
  items: Item[];
  value: Record<string, ChecklistItemData>;
  onChange: (v: Record<string, ChecklistItemData>) => void;
  disabled?: boolean;
}

export default function MatrixObsFooter({ items, value, onChange, disabled }: Props) {
  const updateItem = (itemKey: string, patch: Partial<ChecklistItemData>) => {
    onChange({ ...value, [itemKey]: { ...value[itemKey], ...patch } });
  };

  return (
    <div className="border-t border-gray-300 bg-slate-50">
      <p className="text-[10px] font-bold uppercase text-gray-600 px-4 pt-3 pb-1">
        Observaciones y acción correctiva
      </p>
      <div className="overflow-x-auto px-2 pb-3">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-gray-600">
              <th className="text-left px-2 py-1.5 w-[40%]">Ítem</th>
              <th className="text-left px-2 py-1.5">Observación</th>
              <th className="text-left px-2 py-1.5">Acción correctiva</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const data = value[item.key] ?? {};
              return (
                <tr key={item.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1.5 text-xs text-gray-800 align-top">{item.label}</td>
                  <td className="px-2 py-1 align-top">
                    <input
                      type="text"
                      value={data.observation ?? ''}
                      onChange={(e) => updateItem(item.key, { observation: e.target.value })}
                      disabled={disabled}
                      placeholder="—"
                      className={`${INPUT_CLASS} text-xs py-1.5`}
                    />
                  </td>
                  <td className="px-2 py-1 align-top">
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
    </div>
  );
}
