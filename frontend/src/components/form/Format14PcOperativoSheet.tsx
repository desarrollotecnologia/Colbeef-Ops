import type { FormatField } from '@/types';
import { groupFields } from '@/lib/formUtils';
import PcOperativoAspectTable from './PcOperativoAspectTable';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const SECTION_HEADER = 'px-3 py-2 border-b border-gray-800 bg-[#d9ead3] text-center';
const SUBSECTION_HEADER = 'px-3 py-1.5 border-b border-gray-400 bg-[#e8f4e8]';

function isPcOperativoTable(field: FormatField) {
  return field.fieldType === 'CHECKLIST' && field.options?.layout === 'pc_operativo_table';
}

export default function Format14PcOperativoSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const visible = fields.filter((f) => f.fieldKey !== 'empresa');
  const groups = groupFields(visible);

  return (
    <div className="border-2 border-gray-800 rounded-sm overflow-hidden bg-white">
      {groups.map((group, gi) => (
        <div key={gi} className={gi > 0 ? 'border-t-2 border-gray-800' : ''}>
          {group.name && (
            <div className={SECTION_HEADER}>
              <h3 className="text-xs font-bold uppercase text-gray-900">{group.name}</h3>
            </div>
          )}
          {group.fields.map((f) => {
            if (!isPcOperativoTable(f)) return null;
            const showSubsection = f.label && f.label !== group.name && group.fields.length > 1;
            return (
              <div key={f.fieldKey} className="border-t border-gray-300 first:border-t-0">
                {showSubsection && (
                  <div className={SUBSECTION_HEADER}>
                    <p className="text-[10px] font-bold uppercase text-gray-800">{f.label}</p>
                    {f.helpText && <p className="text-[10px] text-gray-600 mt-0.5 normal-case">{f.helpText}</p>}
                  </div>
                )}
                <PcOperativoAspectTable
                  options={f.options ?? {}}
                  value={(sheetData[f.fieldKey] ?? {}) as import('./PcOperativoAspectTable').PcOperativoValue}
                  onChange={(v) => onUpdate(f.fieldKey, v)}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
