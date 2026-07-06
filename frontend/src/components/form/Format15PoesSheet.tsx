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
  const hora1 = fields.find((f) => f.fieldKey === 'poes_hora_1');
  const hora2 = fields.find((f) => f.fieldKey === 'poes_hora_2');
  const obs = fields.find((f) => f.fieldKey === 'poes_observaciones');
  const sectionFields = fields.filter(
    (f) => !['poes_hora_1', 'poes_hora_2', 'poes_observaciones', 'empresa'].includes(f.fieldKey)
  );
  const groups = groupFields(sectionFields);

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {(hora1 || hora2) && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            {hora1 && (
              <FormField field={hora1} value={sheetData[hora1.fieldKey]} onChange={(v) => onUpdate(hora1.fieldKey, v)} disabled={disabled} />
            )}
            {hora2 && (
              <FormField field={hora2} value={sheetData[hora2.fieldKey]} onChange={(v) => onUpdate(hora2.fieldKey, v)} disabled={disabled} />
            )}
          </div>
        </div>
      )}

      {groups.map((group, gi) => {
        const equipos = group.fields.find((f) => f.options?.layout === 'poes_operativo_table');
        const bpm = group.fields.find((f) => f.options?.layout === 'poes_bpm_table');

        return (
          <div key={gi} className="border-t border-gray-800">
            {group.name && (
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">{group.name}</h3>
              </div>
            )}
            {equipos && (
              <div>
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-300">
                  <p className="text-[11px] font-bold uppercase text-gray-800">{equipos.label}</p>
                  {equipos.helpText && <p className="text-[10px] text-gray-600 mt-0.5">{equipos.helpText}</p>}
                </div>
                <div className="p-0">
                  <PoesOperativoTable
                    options={equipos.options ?? {}}
                    value={(sheetData[equipos.fieldKey] as PoesEquiposValue) ?? {}}
                    onChange={(v) => onUpdate(equipos.fieldKey, v)}
                    disabled={disabled}
                    hora1={String(sheetData.poes_hora_1 ?? '')}
                    hora2={String(sheetData.poes_hora_2 ?? '')}
                  />
                </div>
              </div>
            )}
            {bpm && (
              <div className={equipos ? 'border-t border-gray-800' : ''}>
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-300">
                  <p className="text-[11px] font-bold uppercase text-gray-800">{bpm.label}</p>
                  {bpm.helpText && <p className="text-[10px] text-gray-600 mt-0.5">{bpm.helpText}</p>}
                </div>
                <PoesBpmTable
                  options={bpm.options ?? {}}
                  value={(sheetData[bpm.fieldKey] as Record<string, { lavado_manos?: string; tapabocas?: string; observation?: string; corrective?: string; responsible?: string }>) ?? {}}
                  onChange={(v) => onUpdate(bpm.fieldKey, v)}
                  disabled={disabled}
                />
              </div>
            )}
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
