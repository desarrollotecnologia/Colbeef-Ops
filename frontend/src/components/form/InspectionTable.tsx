import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import AutoValue from './AutoValue';
import { isAutoField } from '@/lib/autoFill';

interface Props {
  title: string;
  subtitle?: string;
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function InspectionTable({ title, subtitle, fields, sheetData, onUpdate, disabled }: Props) {
  return (
    <div className="border border-gray-400 rounded-lg overflow-hidden">
      <div className={SECTION_HEADER_CLASS}>
        <h3 className="text-xs font-bold uppercase text-gray-800">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              {fields.map((f) => (
                <th key={f.id} className="px-2 py-2 text-left text-[11px] font-semibold text-gray-700 uppercase whitespace-nowrap">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {fields.map((f) => (
                <td key={f.id} className="px-2 py-2 align-top border-r border-gray-200 last:border-r-0 min-w-[100px]">
                  {isAutoField(f) || f.fieldType === 'READONLY' ? (
                    <AutoValue field={f} value={sheetData[f.fieldKey]} />
                  ) : (
                    <FormField
                      field={{ ...f, label: '' }}
                      value={sheetData[f.fieldKey]}
                      onChange={(v) => onUpdate(f.fieldKey, v)}
                      disabled={disabled}
                      compact
                    />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
