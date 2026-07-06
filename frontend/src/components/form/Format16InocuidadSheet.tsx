import type { FormatField } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import { formatSpanishDateLong } from '@/lib/formatDate';
import FormField from './FormField';
import PcInocuidadRepeater from './PcInocuidadRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  workDate: string;
  disabled?: boolean;
}

const META_CELL = 'px-3 py-2 border-r border-gray-800 text-xs align-middle';
const META_LABEL = 'font-bold uppercase text-gray-900 mr-2';

export default function Format16InocuidadSheet({ fields, sheetData, onUpdate, workDate, disabled }: Props) {
  const totalAnimales = fields.find((f) => f.fieldKey === 'total_animales');
  const leyenda = fields.find((f) => f.fieldKey === 'leyenda_hallazgos');
  const registros = fields.find((f) => f.fieldKey === 'pc_inocuidad_registros');
  const obs = fields.find((f) => f.fieldKey === 'observaciones_generales');

  const legendText = leyenda?.defaultValue ?? String(sheetData[leyenda?.fieldKey ?? ''] ?? '');

  return (
    <div className="border-2 border-gray-800 rounded-sm overflow-hidden bg-white">
      {leyenda && (
        <div className="border-b border-gray-800 bg-[#f3f3f3] px-3 py-2">
          <p className="text-[11px] text-gray-800 leading-relaxed">{legendText}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-gray-800 bg-white">
        <div className={`${META_CELL} border-b sm:border-b-0`}>
          <span className={META_LABEL}>Fecha:</span>
          <span className="text-gray-800 capitalize">{formatSpanishDateLong(workDate)}</span>
        </div>
        {totalAnimales && (
          <div className={META_CELL}>
            <label className="flex items-center gap-2">
              <span className={`${META_LABEL} shrink-0`}>Total animales:</span>
              <input
                type="number"
                min={totalAnimales.config?.min ?? 1}
                value={sheetData[totalAnimales.fieldKey] != null ? String(sheetData[totalAnimales.fieldKey]) : ''}
                disabled={disabled}
                onChange={(e) => onUpdate(totalAnimales.fieldKey, e.target.value === '' ? '' : Number(e.target.value))}
                className={`${INPUT_CLASS} text-xs py-1 max-w-[120px]`}
              />
            </label>
          </div>
        )}
      </div>

      {registros && (
        <PcInocuidadRepeater
          options={registros.options ?? {}}
          value={
            Array.isArray(sheetData[registros.fieldKey])
              ? (sheetData[registros.fieldKey] as import('./PcInocuidadRepeater').PcInocuidadRow[])
              : []
          }
          onChange={(v) => onUpdate(registros.fieldKey, v)}
          disabled={disabled}
        />
      )}

      {obs && (
        <div className="border-t border-gray-800">
          <div className="px-3 py-1.5 bg-[#d9d9d9] border-b border-gray-800">
            <h3 className="text-[10px] font-bold uppercase text-gray-900">
              {obs.groupName ?? 'Observaciones generales'}
            </h3>
          </div>
          <div className="p-3">
            <FormField
              field={obs}
              value={sheetData[obs.fieldKey]}
              onChange={(v) => onUpdate(obs.fieldKey, v)}
              disabled={disabled}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
