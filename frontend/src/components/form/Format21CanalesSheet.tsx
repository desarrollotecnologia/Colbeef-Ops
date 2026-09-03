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
    <div className="border border-gray-800 rounded-sm overflow-hidden">

      {/* ── Encabezado: Cliente + rangos ── */}
      <div className="bg-emerald-50 border-b border-gray-800 px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Cliente</label>
          <input
            type="text"
            className={`${INPUT_CLASS} text-sm`}
            disabled={disabled}
            value={String(sheetData.cliente ?? '')}
            onChange={(e) => onUpdate('cliente', e.target.value)}
          />
        </div>
        <div className="text-[10px] text-gray-600 space-y-0.5 pt-1">
          <p>Rango temperatura de cavas: <strong>0 °C – 4 °C</strong></p>
          <p>Rango de pH: <strong>5,5 – 5,8</strong></p>
        </div>
      </div>

      {/* ── Tabla de controles 1-4 + Liberación (replicando el Excel) ── */}
      <div className="overflow-x-auto border-b border-gray-800">
        <table className="w-full text-[11px] border-collapse min-w-[860px]">
          <thead>
            {/* Fila de títulos de grupo */}
            <tr className="bg-emerald-100/80">
              <th className="border border-gray-400 px-2 py-1 text-[10px] font-bold w-[80px]" rowSpan={2} />
              {CONTROLS.map((c) => (
                <th key={c.prefix} className="border border-gray-400 px-2 py-1 text-[11px] font-bold text-center" colSpan={2}>
                  {c.label}
                </th>
              ))}
              <th className="border border-gray-400 px-2 py-1 text-[11px] font-bold text-center bg-emerald-200/60" colSpan={2}>
                Liberación de canales
              </th>
            </tr>
            {/* Sub-fila Cava / T°C */}
            <tr className="bg-emerald-50/60">
              {CONTROLS.map((c) => (
                <>
                  <th key={`${c.prefix}_cava`} className="border border-gray-400 px-2 py-0.5 text-[10px] font-semibold">
                    Cava
                  </th>
                  <th key={`${c.prefix}_temp`} className="border border-gray-400 px-2 py-0.5 text-[10px] font-semibold">
                    T °C
                  </th>
                </>
              ))}
              <th className="border border-gray-400 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50">
                T°C Desp. (&lt;7°C) · Desposte (&lt;4°C)
              </th>
              <th className="border border-gray-400 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50">
                pH
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Fecha */}
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-[10px] font-semibold bg-gray-50 whitespace-nowrap">Fecha:</td>
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_fecha_a`} className="border border-gray-300 p-1" colSpan={2}>
                    <input
                      type="date"
                      className={`${INPUT_CLASS} text-xs py-0.5 w-full`}
                      disabled={disabled}
                      value={String(sheetData[`${c.prefix}_fecha`] ?? '')}
                      onChange={(e) => onUpdate(`${c.prefix}_fecha`, e.target.value)}
                    />
                  </td>
                </>
              ))}
              <td className="border border-gray-300 p-1" colSpan={2}>
                <input
                  type="date"
                  className={`${INPUT_CLASS} text-xs py-0.5 w-full`}
                  disabled={disabled}
                  value={String(sheetData.lib_fecha ?? '')}
                  onChange={(e) => onUpdate('lib_fecha', e.target.value)}
                />
              </td>
            </tr>
            {/* Hora */}
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-[10px] font-semibold bg-gray-50">Hora:</td>
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_hora_a`} className="border border-gray-300 p-1" colSpan={2}>
                    <input
                      type="time"
                      className={`${INPUT_CLASS} text-xs py-0.5 w-full`}
                      disabled={disabled}
                      value={String(sheetData[`${c.prefix}_hora`] ?? '')}
                      onChange={(e) => onUpdate(`${c.prefix}_hora`, e.target.value)}
                    />
                  </td>
                </>
              ))}
              <td className="border border-gray-300 p-1" colSpan={2}>
                <input
                  type="time"
                  className={`${INPUT_CLASS} text-xs py-0.5 w-full`}
                  disabled={disabled}
                  value={String(sheetData.lib_hora ?? '')}
                  onChange={(e) => onUpdate('lib_hora', e.target.value)}
                />
              </td>
            </tr>
            {/* Cava + T°C en fila de datos */}
            <tr>
              <td className="border border-gray-400 px-2 py-1 text-[10px] font-semibold bg-gray-50">Cava / T°C:</td>
              {CONTROLS.map((c) => (
                <>
                  <td key={`${c.prefix}_cava_inp`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      className={`${INPUT_CLASS} text-xs py-0.5`}
                      disabled={disabled}
                      placeholder="Cava"
                      value={String(sheetData[`${c.prefix}_cava`] ?? '')}
                      onChange={(e) => onUpdate(`${c.prefix}_cava`, e.target.value)}
                    />
                  </td>
                  <td key={`${c.prefix}_temp_inp`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      className={`${INPUT_CLASS} text-xs py-0.5`}
                      disabled={disabled}
                      placeholder="T°C"
                      value={String(sheetData[`${c.prefix}_temp_cava`] ?? '')}
                      onChange={(e) => onUpdate(`${c.prefix}_temp_cava`, e.target.value)}
                    />
                  </td>
                </>
              ))}
              <td className="border border-gray-300 p-1">
                <input
                  type="text"
                  className={`${INPUT_CLASS} text-xs py-0.5`}
                  disabled={disabled}
                  placeholder="Cava"
                  value={String(sheetData.lib_cava ?? '')}
                  onChange={(e) => onUpdate('lib_cava', e.target.value)}
                />
              </td>
              <td className="border border-gray-300 p-1">
                <input
                  type="text"
                  className={`${INPUT_CLASS} text-xs py-0.5`}
                  disabled={disabled}
                  placeholder="T°C"
                  value={String(sheetData.lib_temp_cava ?? '')}
                  onChange={(e) => onUpdate('lib_temp_cava', e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tiempo de almacenamiento */}
      {tiempoField && (
        <div className="border-b border-gray-800 px-4 py-2 flex items-center gap-3 bg-gray-50">
          <label className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">
            {tiempoField.label}:
          </label>
          <input
            type="text"
            className={`${INPUT_CLASS} text-xs w-32`}
            disabled={disabled}
            value={String(sheetData[tiempoField.fieldKey] ?? '')}
            onChange={(e) => onUpdate(tiempoField.fieldKey, e.target.value)}
          />
        </div>
      )}

      {/* Tabla de canales */}
      {registros && (
        <div className="border-b border-gray-800">
          <div className="bg-emerald-100/70 border-b border-gray-800 px-4 py-1.5">
            <h3 className="text-[11px] font-bold uppercase text-gray-900">
              Temperatura de las canales en almacenamiento
            </h3>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Ctrl 1–4 = temperatura en cava · T°C lib. = temperatura de liberación · pH
            </p>
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

      {/* Observaciones */}
      {obsField && (
        <div className="px-4 py-3">
          <label className="block text-[11px] font-semibold text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            className={`${INPUT_CLASS} text-xs w-full resize-y min-h-[60px]`}
            disabled={disabled}
            value={String(sheetData[obsField.fieldKey] ?? '')}
            onChange={(e) => onUpdate(obsField.fieldKey, e.target.value)}
            placeholder="Observaciones generales del registro"
          />
        </div>
      )}
    </div>
  );
}
