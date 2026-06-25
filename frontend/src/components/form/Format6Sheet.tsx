import type { FormatField } from '@/types';
import { INPUT_CLASS, SECTION_HEADER_CLASS, showRequiredIndicator } from '@/lib/formUtils';
import ChoiceButtons from './ChoiceButtons';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const HEADER_KEYS = [
  'cava_almacenamiento',
  'temp_cava_cnc',
  'cantidad_canales',
  'especie',
  'fecha_beneficio',
  'cliente',
  'lote',
] as const;

function TempCavaField({
  cncField,
  tempField,
  cncValue,
  tempValue,
  onUpdate,
  disabled,
}: {
  cncField: FormatField;
  tempField: FormatField;
  cncValue: unknown;
  tempValue: unknown;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  const cnc = String(cncValue ?? '');
  const showTemp = cnc === 'C';

  const handleCncChange = (v: string) => {
    onUpdate(cncField.fieldKey, v);
    if (v !== 'C') onUpdate(tempField.fieldKey, '');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {cncField.label}
        {showRequiredIndicator(cncField.required) && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <ChoiceButtons
          choices={['C', 'NC']}
          value={cnc}
          onChange={handleCncChange}
          disabled={disabled}
          size="sm"
        />
        {showTemp && (
          <input
            type="text"
            inputMode="decimal"
            value={String(tempValue ?? '')}
            onChange={(e) => onUpdate(tempField.fieldKey, e.target.value)}
            disabled={disabled}
            placeholder="T°C cava"
            className={`${INPUT_CLASS} !w-28 !py-1.5 !px-3 text-sm`}
          />
        )}
      </div>
      {showTemp && (
        <p className="text-[11px] text-gray-500 mt-1">Ingrese la temperatura de la cava al cumplir (C)</p>
      )}
    </div>
  );
}

export default function Format6Sheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const fieldMap = Object.fromEntries(fields.map((f) => [f.fieldKey, f]));
  const tempCavaCnc = fieldMap.temp_cava_cnc;
  const tempCava = fieldMap.temp_cava;
  const header = HEADER_KEYS.map((key) => fieldMap[key]).filter(Boolean) as FormatField[];
  const inspeccion = fields.find((f) => f.fieldKey === 'inspeccion_canales');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      <div className="border-b border-gray-800">
        <div className={SECTION_HEADER_CLASS}>
          <h3 className="text-xs font-bold uppercase text-gray-900">Encabezado — Inspección de canales</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {header.map((f) => {
            if (f.fieldKey === 'temp_cava_cnc' && tempCavaCnc && tempCava) {
              return (
                <TempCavaField
                  key={f.fieldKey}
                  cncField={tempCavaCnc}
                  tempField={tempCava}
                  cncValue={sheetData[tempCavaCnc.fieldKey]}
                  tempValue={sheetData[tempCava.fieldKey]}
                  onUpdate={onUpdate}
                  disabled={disabled}
                />
              );
            }
            return (
              <FormField
                key={f.fieldKey}
                field={f}
                value={sheetData[f.fieldKey]}
                onChange={(v) => onUpdate(f.fieldKey, v)}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>

      {inspeccion && (
        <div className="border-b border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{inspeccion.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">CR · MF · LV · PELO — pH 5.4–5.7 · T°C 0–4</p>
          </div>
          <FormField
            field={{ ...inspeccion, label: '' }}
            value={sheetData[inspeccion.fieldKey]}
            onChange={(v) => onUpdate(inspeccion.fieldKey, v)}
            disabled={disabled}
          />
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
