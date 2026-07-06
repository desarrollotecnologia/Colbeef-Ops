import type { FormatField, MeasureRowData } from '@/types';
import FormField from './FormField';
import FormalMeasureTable from './FormalMeasureTable';
import DayScheduleTable from './DayScheduleTable';
import { groupFields, SECTION_HEADER_CLASS } from '@/lib/formUtils';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  workDate: string;
  disabled?: boolean;
  observacionesFieldKey?: string;
}

function isDayScheduleTable(field: FormatField) {
  return field.fieldType === 'CHECKLIST' && field.options?.layout === 'day_schedule_table';
}

function isFormalMeasureTable(field: FormatField) {
  return field.fieldType === 'CHECKLIST' && field.options?.layout === 'formal_measure_table';
}

function isTableField(field: FormatField) {
  return isDayScheduleTable(field) || isFormalMeasureTable(field) || field.fieldType === 'REPEATER';
}

function SubsectionHeader({ field, groupName }: { field: FormatField; groupName?: string | null }) {
  if (!field.label || field.label === groupName) return null;
  return (
    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-300">
      <p className="text-[11px] font-bold uppercase text-gray-800">{field.label}</p>
      {field.helpText && <p className="text-[10px] text-gray-600 mt-0.5">{field.helpText}</p>}
    </div>
  );
}

export default function GroupedFormalSheet({
  fields,
  sheetData,
  onUpdate,
  workDate,
  disabled,
  observacionesFieldKey,
}: Props) {
  const obs = observacionesFieldKey ? fields.find((f) => f.fieldKey === observacionesFieldKey) : undefined;
  const sectionFields = fields.filter(
    (f) => f.fieldKey !== observacionesFieldKey && f.fieldKey !== 'empresa'
  );
  const groups = groupFields(sectionFields);

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {groups.map((group, gi) => {
        const tableOnly = group.fields.every(isTableField);
        return (
          <div key={gi} className="border-t border-gray-800 first:border-t-0">
            {group.name && (
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">{group.name}</h3>
                {group.fields[0]?.options?.tableType === 'cloro' && (
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Cloro residual libre (0.3 – 2 ppm) y pH — un registro por cada punto del día
                  </p>
                )}
              </div>
            )}
            <div className={tableOnly ? 'p-0' : 'p-0'}>
              {group.fields.map((f) => {
                if (isDayScheduleTable(f)) {
                  return (
                    <div key={f.fieldKey} className="col-span-full">
                      <SubsectionHeader field={f} groupName={group.name} />
                      <DayScheduleTable
                        options={f.options ?? {}}
                        value={(sheetData[f.fieldKey] as Record<string, import('./DayScheduleTable').DayPointRow>) ?? {}}
                        onChange={(v) => onUpdate(f.fieldKey, v)}
                        workDate={workDate}
                        disabled={disabled}
                        embedded
                      />
                    </div>
                  );
                }
                if (isFormalMeasureTable(f)) {
                  return (
                    <div key={f.fieldKey} className="col-span-full">
                      <SubsectionHeader field={f} groupName={group.name} />
                      <FormalMeasureTable
                        options={f.options ?? {}}
                        value={(sheetData[f.fieldKey] as Record<string, MeasureRowData>) ?? {}}
                        onChange={(v) => onUpdate(f.fieldKey, v)}
                        disabled={disabled}
                      />
                    </div>
                  );
                }
                if (f.fieldType === 'REPEATER') {
                  return (
                    <div key={f.fieldKey} className="col-span-full">
                      <SubsectionHeader field={f} groupName={group.name} />
                      <FormField
                        field={{ ...f, label: '' }}
                        value={sheetData[f.fieldKey]}
                        onChange={(v) => onUpdate(f.fieldKey, v)}
                        disabled={disabled}
                      />
                    </div>
                  );
                }
                return (
                  <div key={f.fieldKey} className="p-4">
                    <FormField
                      field={f}
                      value={sheetData[f.fieldKey]}
                      onChange={(v) => onUpdate(f.fieldKey, v)}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {obs && (
        <div className="border-t border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{obs.groupName ?? 'Observaciones'}</h3>
          </div>
          <div className="p-4">
            <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} compact />
          </div>
        </div>
      )}
    </div>
  );
}
