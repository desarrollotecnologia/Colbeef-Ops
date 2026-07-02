import type { FormatField } from '@/types';
import { groupFields, SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import PoesOperativoTable, { PoesBpmTable, type PoesEquiposValue } from './PoesOperativoTable';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format15PoesSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const groups = groupFields(fields);

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => {
        const visible = group.fields;
        if (visible.length === 0) return null;

        const equipos = visible.find((f) => f.options?.layout === 'poes_operativo_table');
        const bpm = visible.find((f) => f.options?.layout === 'poes_bpm_table');
        const others = visible.filter((f) => f !== equipos && f !== bpm);

        return (
          <div key={gi}>
            {group.name && (
              <h3 className="text-xs font-bold uppercase text-gray-800 mb-3 pb-1 border-b border-gray-300">{group.name}</h3>
            )}
            <div className="space-y-4">
              {others.map((field) => (
                <FormField key={field.id} field={field} value={sheetData[field.fieldKey]} onChange={(v) => onUpdate(field.fieldKey, v)} disabled={disabled} />
              ))}
              {equipos && (
                <div className="border border-gray-800 rounded-sm overflow-hidden">
                  <div className={SECTION_HEADER_CLASS}>
                    <h3 className="text-xs font-bold uppercase text-gray-900">{equipos.label}</h3>
                    {equipos.helpText && <p className="text-[11px] text-gray-600 mt-0.5">{equipos.helpText}</p>}
                  </div>
                  <div className="p-3">
                    <PoesOperativoTable
                      options={equipos.options ?? {}}
                      value={(sheetData[equipos.fieldKey] as PoesEquiposValue) ?? {}}
                      onChange={(v) => onUpdate(equipos.fieldKey, v)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}
              {bpm && (
                <div className="border border-gray-800 rounded-sm overflow-hidden">
                  <div className={SECTION_HEADER_CLASS}>
                    <h3 className="text-xs font-bold uppercase text-gray-900">{bpm.label}</h3>
                    {bpm.helpText && <p className="text-[11px] text-gray-600 mt-0.5">{bpm.helpText}</p>}
                  </div>
                  <div className="p-0">
                    <PoesBpmTable
                      options={bpm.options ?? {}}
                      value={(sheetData[bpm.fieldKey] as Record<string, { lavado_manos?: string; tapabocas?: string; observation?: string; corrective?: string; responsible?: string }>) ?? {}}
                      onChange={(v) => onUpdate(bpm.fieldKey, v)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="text-xs text-gray-500 border-t pt-3">
        <p><strong>C:</strong> Cumple &nbsp; <strong>NC:</strong> No cumple &nbsp; <strong>NA:</strong> No aplica</p>
      </div>
    </div>
  );
}
