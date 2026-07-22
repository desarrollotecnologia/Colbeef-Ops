import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const HEADER_KEYS = new Set([
  'especie', 'fecha', 'hora', 'destino', 'conductor', 'placa',
  'temp_vehiculo', 'limpieza_vehiculo', 'desinfeccion_vehiculo', 'observaciones_encabezado',
]);

export default function Format3Sheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const headerFields = fields.filter((f) => HEADER_KEYS.has(f.fieldKey));
  const productosField = fields.find((f) => f.fieldKey === 'productos');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      <div className="border-b border-gray-800">
        <div className={SECTION_HEADER_CLASS}>
          <h3 className="text-xs font-bold uppercase text-gray-900">Datos del despacho</h3>
          <p className="text-[11px] text-gray-600 mt-0.5">Vehículo, conductor y condiciones sanitarias</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {headerFields.map((field) => (
            <FormField
              key={field.fieldKey}
              field={field}
              value={sheetData[field.fieldKey]}
              onChange={(v) => onUpdate(field.fieldKey, v)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {productosField && (
        <div>
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{productosField.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Empaque vacío / granel · REFR 0–4 °C · CONG -18 °C · C = Cumple · NC = No cumple · NA = No aplica
            </p>
          </div>
          <div className="p-0">
            <FormField
              field={{ ...productosField, label: '' }}
              value={sheetData[productosField.fieldKey]}
              onChange={(v) => onUpdate(productosField.fieldKey, v)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
