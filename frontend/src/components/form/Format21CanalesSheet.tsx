import type { FormatField } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import CanalesTempPhRepeater, { type CanalesTempPhRow } from './CanalesTempPhRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

const CONTROLS = [
  { label: 'Control 1', prefix: 'c1' },
  { label: 'Control 2', prefix: 'c2' },
  { label: 'Control 3', prefix: 'c3' },
  { label: 'Control 4', prefix: 'c4' },
] as const;

function TextInput({
  value,
  onChange,
  disabled,
  placeholder,
  type = 'text',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      className={`${INPUT_CLASS} text-xs py-0.5 px-1 h-6 w-full ${className}`}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function cell(v: unknown) {
  return String(v ?? '');
}

export default function Format21CanalesSheet({
  fields,
  sheetData,
  onUpdate,
  disabled,
  currentUserId,
  currentUserName,
}: Props) {
  const registros = fields.find((f) => f.fieldKey === 'registros');
  const obsField = fields.find((f) => f.fieldKey === 'observaciones_generales');
  const tiempoField = fields.find((f) => f.fieldKey === 'tiempo_almacenamiento_horas');

  return (
    <div className="border border-gray-700 rounded-sm overflow-hidden bg-white">

      {/* ── Cliente ── */}
      <div className="border-b border-gray-700 px-3 py-1.5 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-gray-800 whitespace-nowrap">Cliente:</span>
        <TextInput
          value={cell(sheetData.cliente)}
          onChange={(v) => onUpdate('cliente', v)}
          disabled={disabled}
          className="flex-1"
        />
      </div>

      {/* ── Tabla de controles (replicando layout del Excel) ── */}
      <div className="overflow-x-auto border-b border-gray-700">
        <table className="w-full text-[11px] border-collapse" style={{ minWidth: 900 }}>
          <thead>
            {/* Fila 1: etiqueta izquierda + encabezados Control 1-4 + Liberación (Despacho/Desposte) */}
            <tr className="bg-gray-100">
              {/* celda izquierda: rango cavas – abarca 4 filas */}
              <td
                className="border border-gray-500 px-2 py-1 text-[10px] font-semibold text-center align-middle bg-gray-50"
                rowSpan={4}
                style={{ width: 110 }}
              >
                <div>Rango temperatura</div>
                <div>de cavas:</div>
                <div className="font-bold mt-0.5">0°C – 4°C</div>
              </td>
              {CONTROLS.map((c) => (
                <th
                  key={c.prefix}
                  className="border border-gray-500 px-2 py-1 text-[11px] font-bold text-center"
                  colSpan={2}
                >
                  {c.label}
                </th>
              ))}
              {/* Liberación de canales → Despacho + Desposte */}
              <th
                className="border border-gray-500 px-2 py-1 text-[11px] font-bold text-center bg-emerald-100"
                colSpan={4}
              >
                LIBERACIÓN DE CANALES
              </th>
            </tr>
            {/* Fila 2: sub-cols Cava/T°C para c1-c4 + Despacho / Desposte */}
            <tr className="bg-gray-50">
              {CONTROLS.map((c) => (
                <>
                  <th key={`${c.prefix}_cava_h`} className="border border-gray-400 px-1 py-0.5 text-[10px] font-semibold w-[70px]">Cava:</th>
                  <th key={`${c.prefix}_temp_h`} className="border border-gray-400 px-1 py-0.5 text-[10px] font-semibold w-[60px]">T °C:</th>
                </>
              ))}
              <th className="border border-gray-400 px-1 py-0.5 text-[10px] font-bold text-center bg-emerald-50" colSpan={2}>
                Despacho<br /><span className="font-normal">T°: &lt;7°C</span>
              </th>
              <th className="border border-gray-400 px-1 py-0.5 text-[10px] font-bold text-center bg-emerald-50" colSpan={2}>
                Desposte<br /><span className="font-normal">T°: &lt;4°C</span>
              </th>
            </tr>
            {/* Fila 3: sub-cols Cava/T°C para liberación */}
            <tr className="bg-gray-50/50">
              {/* rango pH ocupa todo el ancho de Despacho + Desposte — en la celda correspondiente */}
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_cava_fill`} className="border border-gray-300 p-0" />
                  <td key={`${c.prefix}_temp_fill`} className="border border-gray-300 p-0" />
                </>
              ))}
              <th className="border border-gray-400 px-1 py-0.5 text-[10px] font-semibold w-[65px]">Cava:</th>
              <th className="border border-gray-400 px-1 py-0.5 text-[10px] font-semibold w-[55px]">T °C:</th>
              <th className="border border-gray-400 px-1 py-0.5 text-[10px] font-semibold">Cava:</th>
              <th className="border border-gray-400 px-1 py-0.5 text-[10px] font-semibold">T °C:</th>
            </tr>
            {/* Fila 4: rango de pH */}
            <tr className="bg-gray-50/30">
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_cv2`} className="border border-gray-300 p-0" />
                  <td key={`${c.prefix}_tp2`} className="border border-gray-300 p-0" />
                </>
              ))}
              <td className="border border-gray-400 px-2 py-0.5 text-[10px] text-gray-600" colSpan={4}>
                Rango de pH: 5,4 – 5,8
              </td>
            </tr>
          </thead>
          <tbody>
            {/* Fecha */}
            <tr>
              <td className="border border-gray-500 px-2 py-0.5 text-[10px] font-semibold bg-gray-50 whitespace-nowrap">Fecha:</td>
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_fecha_c`} className="border border-gray-300 p-0.5">
                    <TextInput type="date" value={cell(sheetData[`${c.prefix}_fecha`])} onChange={(v) => onUpdate(`${c.prefix}_fecha`, v)} disabled={disabled} />
                  </td>
                  <td key={`${c.prefix}_fecha_d`} className="border border-gray-300 p-0" />
                </>
              ))}
              <td className="border border-gray-300 p-0.5" colSpan={2}>
                <TextInput type="date" value={cell(sheetData.lib_despacho_fecha)} onChange={(v) => onUpdate('lib_despacho_fecha', v)} disabled={disabled} />
              </td>
              <td className="border border-gray-300 p-0.5" colSpan={2}>
                <TextInput type="date" value={cell(sheetData.lib_desposte_fecha)} onChange={(v) => onUpdate('lib_desposte_fecha', v)} disabled={disabled} />
              </td>
            </tr>
            {/* Hora */}
            <tr>
              <td className="border border-gray-500 px-2 py-0.5 text-[10px] font-semibold bg-gray-50">Hora:</td>
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_hora_c`} className="border border-gray-300 p-0.5">
                    <TextInput type="time" value={cell(sheetData[`${c.prefix}_hora`])} onChange={(v) => onUpdate(`${c.prefix}_hora`, v)} disabled={disabled} />
                  </td>
                  <td key={`${c.prefix}_hora_d`} className="border border-gray-300 p-0" />
                </>
              ))}
              <td className="border border-gray-300 p-0.5" colSpan={2}>
                <TextInput type="time" value={cell(sheetData.lib_despacho_hora)} onChange={(v) => onUpdate('lib_despacho_hora', v)} disabled={disabled} />
              </td>
              <td className="border border-gray-300 p-0.5" colSpan={2}>
                <TextInput type="time" value={cell(sheetData.lib_desposte_hora)} onChange={(v) => onUpdate('lib_desposte_hora', v)} disabled={disabled} />
              </td>
            </tr>
            {/* Cava + T°C */}
            <tr>
              <td className="border border-gray-500 px-2 py-0.5 text-[10px] font-semibold bg-gray-50" />
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_cava_v`} className="border border-gray-300 p-0.5">
                    <TextInput value={cell(sheetData[`${c.prefix}_cava`])} onChange={(v) => onUpdate(`${c.prefix}_cava`, v)} disabled={disabled} placeholder="Cava" />
                  </td>
                  <td key={`${c.prefix}_temp_v`} className="border border-gray-300 p-0.5">
                    <TextInput value={cell(sheetData[`${c.prefix}_temp_cava`])} onChange={(v) => onUpdate(`${c.prefix}_temp_cava`, v)} disabled={disabled} placeholder="T°C" />
                  </td>
                </>
              ))}
              <td className="border border-gray-300 p-0.5">
                <TextInput value={cell(sheetData.lib_despacho_cava)} onChange={(v) => onUpdate('lib_despacho_cava', v)} disabled={disabled} placeholder="Cava" />
              </td>
              <td className="border border-gray-300 p-0.5">
                <TextInput value={cell(sheetData.lib_despacho_temp)} onChange={(v) => onUpdate('lib_despacho_temp', v)} disabled={disabled} placeholder="T°C" />
              </td>
              <td className="border border-gray-300 p-0.5">
                <TextInput value={cell(sheetData.lib_desposte_cava)} onChange={(v) => onUpdate('lib_desposte_cava', v)} disabled={disabled} placeholder="Cava" />
              </td>
              <td className="border border-gray-300 p-0.5">
                <TextInput value={cell(sheetData.lib_desposte_temp)} onChange={(v) => onUpdate('lib_desposte_temp', v)} disabled={disabled} placeholder="T°C" />
              </td>
            </tr>
            {/* Tiempo de almacenamiento — dentro de la tabla como en el Excel */}
            {tiempoField && (
              <tr>
                <td
                  className="border border-gray-500 px-2 py-1 text-[10px] font-semibold bg-gray-50 text-center"
                  colSpan={9}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Tiempo de almacenamiento del producto en refrigeración (horas):</span>
                    <TextInput
                      value={cell(sheetData[tiempoField.fieldKey])}
                      onChange={(v) => onUpdate(tiempoField.fieldKey, v)}
                      disabled={disabled}
                      className="w-24 inline-block"
                    />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Tabla de registros de canales ── */}
      {registros && (
        <div className="border-b border-gray-700">
          <div className="px-3 py-2">
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

      {/* ── Observaciones ── */}
      {obsField && (
        <div className="px-3 py-2">
          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Observaciones:</label>
          <textarea
            className={`${INPUT_CLASS} text-xs w-full resize-y min-h-[56px]`}
            disabled={disabled}
            value={cell(sheetData[obsField.fieldKey])}
            onChange={(e) => onUpdate(obsField.fieldKey, e.target.value)}
            placeholder="Observaciones generales del registro"
          />
        </div>
      )}
    </div>
  );
}
