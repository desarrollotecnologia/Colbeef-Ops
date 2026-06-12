import type { FormatField } from '@/types';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const HEADER_KEYS = new Set([
  'cava_almacenamiento', 'temp_cava_cnc', 'cantidad_canales', 'especie',
  'fecha_beneficio', 'cliente', 'lote',
]);

export default function Format6Sheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const header = fields.filter((f) => HEADER_KEYS.has(f.fieldKey));
  const inspeccion = fields.find((f) => f.fieldKey === 'inspeccion_canales');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      <div className="border-b border-gray-800">
        <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
          <h3 className="text-xs font-bold uppercase text-gray-900">Encabezado — Inspección de canales</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {header.map((f) => (
            <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
          ))}
        </div>
      </div>

      {inspeccion && (
        <div className="border-b border-gray-800">
          <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
            <h3 className="text-xs font-bold uppercase text-gray-900">{inspeccion.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">CR · MF · LV · PELO — pH 5.4–5.7 · T°C 0–4</p>
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
