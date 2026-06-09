import type { FormatField } from '@/types';
import { groupFields } from '@/lib/formUtils';
import FormField from './FormField';
import ItemChecklist from './ItemChecklist';
import DayScheduleTable from './DayScheduleTable';
import type { ChecklistItemData } from '@/types';

const HEADER_ONLY_KEYS = new Set(['empresa']);

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  workDate: string;
  disabled?: boolean;
}

export default function SheetFields({ fields, sheetData, onUpdate, workDate, disabled }: Props) {
  const groups = groupFields(fields);

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => {
        const visibleFields = group.fields.filter((f) => !HEADER_ONLY_KEYS.has(f.fieldKey));
        if (visibleFields.length === 0) return null;

        const dayTableField = visibleFields.find(
          (f) => f.fieldType === 'CHECKLIST' && f.options?.layout === 'day_schedule_table'
        );

        if (dayTableField) {
          const subtitles: Record<string, string> = {
            cloro: 'Cloro residual libre (0.3 – 2 ppm) y pH — los puntos se asignan automáticamente según el día',
            esterilizadores: 'Funcionamiento, temperatura (82,5°C) o solución desinfectante aprobada',
          };
          const tableType = dayTableField.options?.tableType ?? 'cloro';
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
                <h3 className="text-xs font-bold uppercase text-gray-900">
                  {group.name ?? dayTableField.label}
                </h3>
                <p className="text-[11px] text-gray-600 mt-0.5">{subtitles[tableType]}</p>
              </div>
              <div className="p-0">
                <DayScheduleTable
                  options={dayTableField.options ?? {}}
                  value={(sheetData[dayTableField.fieldKey] as Record<string, unknown>) ?? {}}
                  onChange={(v) => onUpdate(dayTableField.fieldKey, v)}
                  workDate={workDate}
                  disabled={disabled}
                />
              </div>
            </div>
          );
        }

        const checklistField = visibleFields.find(
          (f) => f.fieldType === 'CHECKLIST' && f.options?.items
        );

        if (checklistField && visibleFields.length === 1) {
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
                <h3 className="text-xs font-bold uppercase text-gray-900">
                  {group.name ?? checklistField.label}
                </h3>
              </div>
              <div className="p-0">
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
        <p className="text-blue-600">Los <strong>puntos inspeccionados</strong> y el <strong>pH (7.0)</strong> se asignan solos según el día de la semana.</p>
      </div>
    </div>
  );
}
