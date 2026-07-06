import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import PcInocuidadRepeater from './PcInocuidadRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format16InocuidadSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const totalAnimales = fields.find((f) => f.fieldKey === 'total_animales');
  const leyenda = fields.find((f) => f.fieldKey === 'leyenda_hallazgos');
  const registros = fields.find((f) => f.fieldKey === 'pc_inocuidad_registros');
  const obs = fields.find((f) => f.fieldKey === 'observaciones_generales');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {(totalAnimales || leyenda) && (
        <div className="border-b border-gray-800 bg-[#e8edf2] px-4 py-3 space-y-3">
          {totalAnimales && (
            <FormField
              field={totalAnimales}
              value={sheetData[totalAnimales.fieldKey]}
              onChange={(v) => onUpdate(totalAnimales.fieldKey, v)}
              disabled={disabled}
            />
          )}
          {leyenda && (
            <p className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-3 py-2 font-medium">
              {leyenda.defaultValue ?? String(sheetData[leyenda.fieldKey] ?? '')}
            </p>
          )}
        </div>
      )}

      {registros && (
        <div className="border-t border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{registros.groupName ?? registros.label}</h3>
            {registros.helpText && <p className="text-[11px] text-gray-600 mt-0.5">{registros.helpText}</p>}
          </div>
          <div className="p-3">
            <PcInocuidadRepeater
              options={registros.options ?? {}}
              value={Array.isArray(sheetData[registros.fieldKey]) ? (sheetData[registros.fieldKey] as import('./PcInocuidadRepeater').PcInocuidadRow[]) : []}
              onChange={(v) => onUpdate(registros.fieldKey, v)}
              disabled={disabled}
            />
          </div>
        </div>
      )}

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
