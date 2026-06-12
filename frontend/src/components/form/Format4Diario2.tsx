import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format4Diario2({ fields, sheetData, onUpdate, disabled }: Props) {
  const proceso = fields.filter((f) => f.fieldKey.startsWith('proceso_'));
  const inspeccion = fields.find((f) => f.fieldKey === 'inspeccion_cortes');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      <div className="border-b border-gray-800">
        <div className={SECTION_HEADER_CLASS}>
          <h3 className="text-xs font-bold uppercase text-gray-900">Proceso del día</h3>
          <p className="text-[11px] text-gray-600 mt-0.5">Indique si hay despostado y/o porcionado</p>
        </div>
        <div className="flex flex-wrap gap-6 p-4">
          {proceso.map((f) => (
            <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
          ))}
        </div>
      </div>

      {inspeccion && (
        <div className="border-b border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{inspeccion.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">2 cortes por hora · T°C 0–7 · Hematomas · Abscesos · Vacunas</p>
          </div>
          <FormField field={{ ...inspeccion, label: '' }} value={sheetData[inspeccion.fieldKey]} onChange={(v) => onUpdate(inspeccion.fieldKey, v)} disabled={disabled} />
        </div>
      )}

      {obs && (
        <div className="p-4">
          <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
