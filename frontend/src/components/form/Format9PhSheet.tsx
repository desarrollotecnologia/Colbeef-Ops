import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import CardRepeater from './CardRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format9PhSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const calibraciones = fields.find((f) => f.fieldKey === 'calibraciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      {calibraciones && (
        <>
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Calibración pH-metro</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">pH 7,0 y pH 4,0 · C = Cumple · NC = No cumple · Responsable = operario</p>
          </div>
          <CardRepeater
            options={calibraciones.options ?? {}}
            value={Array.isArray(sheetData[calibraciones.fieldKey]) ? (sheetData[calibraciones.fieldKey] as Record<string, unknown>[]) : []}
            onChange={(v) => onUpdate(calibraciones.fieldKey, v)}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}
