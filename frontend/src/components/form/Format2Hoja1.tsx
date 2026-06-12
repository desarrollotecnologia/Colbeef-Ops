import type { FormatField, MeasureRowData } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormalMeasureTable from './FormalMeasureTable';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format2Hoja1({ fields, sheetData, onUpdate, disabled }: Props) {
  const especieField = fields.find((f) => f.fieldKey === 'especie');
  const measureFields = fields.filter(
    (f) => f.fieldType === 'CHECKLIST' && f.options?.layout === 'formal_measure_table'
  );
  const obsField = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      {especieField && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2]">
          <FormField
            field={especieField}
            value={sheetData[especieField.fieldKey]}
            onChange={(v) => onUpdate(especieField.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}

      {measureFields.map((field) => (
        <div key={field.fieldKey} className="border-t border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{field.label}</h3>
            {field.helpText && (
              <p className="text-[11px] text-gray-600 mt-0.5">{field.helpText}</p>
            )}
          </div>
          <FormalMeasureTable
            options={field.options ?? {}}
            value={(sheetData[field.fieldKey] as Record<string, MeasureRowData>) ?? {}}
            onChange={(v) => onUpdate(field.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      ))}

      {obsField && (
        <div className="border-t border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Observaciones</h3>
          </div>
          <div className="p-4">
            <FormField
              field={obsField}
              value={sheetData[obsField.fieldKey]}
              onChange={(v) => onUpdate(obsField.fieldKey, v)}
              disabled={disabled}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
