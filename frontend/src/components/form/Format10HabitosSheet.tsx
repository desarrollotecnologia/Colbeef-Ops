import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format10HabitosSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const area = fields.find((f) => f.fieldKey === 'area');
  const personas = fields.find((f) => f.fieldKey === 'personas');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {area && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2]">
          <FormField field={area} value={sheetData[area.fieldKey]} onChange={(v) => onUpdate(area.fieldKey, v)} disabled={disabled} />
        </div>
      )}
      {personas && (
        <div>
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Personal inspeccionado</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">C · NC · NA — Agregar filas según personal del área</p>
          </div>
          <FormField
            field={{ ...personas, label: '' }}
            value={sheetData[personas.fieldKey]}
            onChange={(v) => onUpdate(personas.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
