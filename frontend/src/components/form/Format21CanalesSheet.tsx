import type { FormatField } from '@/types';
import FormField from './FormField';
import CanalesTempPhRepeater, { type CanalesTempPhRow } from './CanalesTempPhRepeater';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

const HEADER_KEYS = ['cliente'] as const;

const CONTROL_GROUPS = [
  { title: 'Control 1', keys: ['c1_cava', 'c1_temp_cava', 'c1_fecha', 'c1_hora'] },
  { title: 'Control 2', keys: ['c2_cava', 'c2_temp_cava', 'c2_fecha', 'c2_hora'] },
  { title: 'Control 3', keys: ['c3_cava', 'c3_temp_cava', 'c3_fecha', 'c3_hora'] },
  { title: 'Control 4', keys: ['c4_cava', 'c4_temp_cava', 'c4_fecha', 'c4_hora'] },
] as const;

const LIB_KEYS = ['lib_cava', 'lib_temp_cava', 'lib_fecha', 'lib_hora'] as const;

export default function Format21CanalesSheet({
  fields,
  sheetData,
  onUpdate,
  disabled,
  currentUserId,
  currentUserName,
}: Props) {
  const headerFields = HEADER_KEYS.map((k) => fields.find((f) => f.fieldKey === k)).filter(
    (f): f is FormatField => Boolean(f)
  );
  const tiempoField = fields.find((f) => f.fieldKey === 'tiempo_almacenamiento_horas');
  const registros = fields.find((f) => f.fieldKey === 'registros');
  const obsField = fields.find((f) => f.fieldKey === 'observaciones_generales');

  const fieldByKey = (key: string) => fields.find((f) => f.fieldKey === key);

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {headerFields.length > 0 && (
        <div>
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Encabezado</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Rango temperatura cavas: 0 °C – 4 °C · pH canales: 5,5 – 5,8
            </p>
          </div>
          <div className="p-4">
            {headerFields.map((f) => (
              <FormField
                key={f.fieldKey}
                field={f}
                value={sheetData[f.fieldKey]}
                onChange={(v) => onUpdate(f.fieldKey, v)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-800">
        <div className={SECTION_HEADER_CLASS}>
          <h3 className="text-xs font-bold uppercase text-gray-900">Controles de temperatura en cava</h3>
          <p className="text-[11px] text-gray-600 mt-0.5">Cava, T°C, fecha y hora por cada control</p>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CONTROL_GROUPS.map((group) => (
            <div key={group.title} className="border border-gray-300 rounded-sm p-3 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-gray-900">{group.title}</h4>
              <div className="grid grid-cols-2 gap-3">
                {group.keys.map((key) => {
                  const f = fieldByKey(key);
                  if (!f) return null;
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
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className={SECTION_HEADER_CLASS}>
          <h3 className="text-xs font-bold uppercase text-gray-900">Liberación de canales</h3>
          <p className="text-[11px] text-gray-600 mt-0.5">Despacho T° &lt; 7 °C · Desposte T° &lt; 4 °C</p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LIB_KEYS.map((key) => {
            const f = fieldByKey(key);
            if (!f) return null;
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

      {tiempoField && (
        <div className="border-t border-gray-800 p-4">
          <FormField
            field={tiempoField}
            value={sheetData[tiempoField.fieldKey]}
            onChange={(v) => onUpdate(tiempoField.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}

      {registros && (
        <div className="border-t border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{registros.label}</h3>
            {registros.helpText && (
              <p className="text-[11px] text-gray-600 mt-0.5">{registros.helpText}</p>
            )}
          </div>
          <div className="p-3">
            <CanalesTempPhRepeater
              options={registros.options ?? {}}
              value={
                Array.isArray(sheetData.registros)
                  ? (sheetData.registros as CanalesTempPhRow[])
                  : []
              }
              onChange={(rows) => onUpdate('registros', rows)}
              disabled={disabled}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        </div>
      )}

      {obsField && (
        <div className="border-t border-gray-800 p-4">
          <FormField
            field={obsField}
            value={sheetData[obsField.fieldKey]}
            onChange={(v) => onUpdate(obsField.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
