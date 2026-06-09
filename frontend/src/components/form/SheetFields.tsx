import type { FormatField } from '@/types';
import { groupFields } from '@/lib/formUtils';
import FormField from './FormField';
import InspectionTable from './InspectionTable';
import ItemChecklist from './ItemChecklist';
import type { ChecklistItemData } from '@/types';

const TABLE_GROUPS: Record<string, string | undefined> = {
  'Control cloro': 'Cloro residual libre (0.3 – 2 ppm) y pH',
  'Esterilizadores': 'Funcionamiento, temperatura (82,5°C) o solución desinfectante aprobada',
};

const HEADER_ONLY_KEYS = new Set(['empresa']);

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function SheetFields({ fields, sheetData, onUpdate, disabled }: Props) {
  const groups = groupFields(fields);

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => {
        const visibleFields = group.fields.filter((f) => !HEADER_ONLY_KEYS.has(f.fieldKey));
        if (visibleFields.length === 0) return null;

        const tableSubtitle = group.name ? TABLE_GROUPS[group.name] : undefined;

        if (group.name && TABLE_GROUPS[group.name]) {
          return (
            <InspectionTable
              key={gi}
              title={group.name}
              subtitle={tableSubtitle}
              fields={visibleFields}
              sheetData={sheetData}
              onUpdate={onUpdate}
              disabled={disabled}
            />
          );
        }

        const checklistField = visibleFields.find(
          (f) => f.fieldType === 'CHECKLIST' && f.options?.items
        );

        if (checklistField && visibleFields.length === 1) {
          return (
            <div key={gi} className="border border-gray-400 rounded-lg overflow-hidden">
              <div className="bg-gray-200 px-3 py-2 border-b border-gray-400">
                <h3 className="text-xs font-bold uppercase text-gray-800">
                  {group.name ?? checklistField.label}
                </h3>
              </div>
              <div className="p-2">
                <ItemChecklist
                  options={checklistField.options ?? {}}
                  value={(sheetData[checklistField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
                  onChange={(v) => onUpdate(checklistField.fieldKey, v)}
                  disabled={disabled}
                  tableMode
                />
              </div>
            </div>
          );
        }

        return (
          <div key={gi}>
            {group.name && (
              <h3 className="text-xs font-bold uppercase text-gray-800 mb-3 pb-1 border-b border-gray-300">
                {group.name}
              </h3>
            )}
            <div className="space-y-4">
              {visibleFields.map((field) => (
                <FormField
                  key={field.id}
                  field={field}
                  value={sheetData[field.fieldKey]}
                  onChange={(v) => onUpdate(field.fieldKey, v)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="text-xs text-gray-500 border-t pt-3 space-y-0.5">
        <p><strong>C:</strong> Cumple &nbsp; <strong>NC:</strong> No cumple &nbsp; <strong>AC:</strong> Acción correctiva</p>
        <p className="text-blue-600">Campos marcados <strong>Auto</strong> se llenan solos según el día o reglas del formato.</p>
      </div>
    </div>
  );
}
