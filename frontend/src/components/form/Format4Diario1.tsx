import type { FormatField } from '@/types';
import FormField from './FormField';
import { groupFields } from '@/lib/formUtils';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format4Diario1({ fields, sheetData, onUpdate, disabled }: Props) {
  const especie = fields.find((f) => f.fieldKey === 'especie');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');
  const sectionFields = fields.filter(
    (f) => !['especie', 'observaciones', 'empresa'].includes(f.fieldKey)
  );
  const groups = groupFields(sectionFields);

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {especie && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2]">
          <FormField field={especie} value={sheetData[especie.fieldKey]} onChange={(v) => onUpdate(especie.fieldKey, v)} disabled={disabled} />
        </div>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="border-t border-gray-800">
          {group.name && (
            <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
              <h3 className="text-xs font-bold uppercase text-gray-900">{group.name}</h3>
            </div>
          )}
          <div className={group.fields.length === 1 && group.fields[0].fieldType === 'REPEATER' ? 'p-0' : 'grid grid-cols-1 sm:grid-cols-2 gap-4 p-4'}>
            {group.fields.map((f) => (
              <div key={f.fieldKey} className={f.fieldType === 'REPEATER' ? 'col-span-full' : ''}>
                <FormField field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {obs && (
        <div className="border-t border-gray-800">
          <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
            <h3 className="text-xs font-bold uppercase text-gray-900">Observaciones</h3>
          </div>
          <div className="p-4">
            <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} compact />
          </div>
        </div>
      )}
    </div>
  );
}
