import type { ReactNode } from 'react';
import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const RECEPCION_KEYS = new Set([
  'desinfeccion_canales', 'concentracion_acido', 'placa_vehiculo', 'temp_vehiculo',
  'cantidad_canales', 'fecha_beneficio', 'cliente', 'especie', 'lote',
]);

const DESPOSTE_KEYS = new Set([
  'fecha_desposte', 'cava_almacenamiento', 'temp_rango', 'temp_promedio', 'ph_promedio', 'lote_asignado',
]);

export default function Format5Sheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const recepcion = fields.filter((f) => RECEPCION_KEYS.has(f.fieldKey));
  const inspeccion = fields.find((f) => f.fieldKey === 'inspeccion_canales');
  const desposte = fields.filter((f) => DESPOSTE_KEYS.has(f.fieldKey));
  const obsFijas = fields.find((f) => f.fieldKey === 'observaciones_fijas');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      <Section title="Recepción de canales" subtitle="Datos del vehículo y lote">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {recepcion.map((f) => (
            <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
          ))}
        </div>
      </Section>

      {inspeccion && (
        <Section title={inspeccion.label} subtitle="CR · MF · LV · PELO · HM · GS — pH 5.4–5.8 · T°C 0–4">
          <FormField field={{ ...inspeccion, label: '' }} value={sheetData[inspeccion.fieldKey]} onChange={(v) => onUpdate(inspeccion.fieldKey, v)} disabled={disabled} />
        </Section>
      )}

      {desposte.length > 0 && (
        <Section title="Inspección durante desposte">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {desposte.map((f) => (
              <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
            ))}
          </div>
        </Section>
      )}

      {(obsFijas || obs) && (
        <Section title="Observaciones">
          <div className="p-4 space-y-3">
            {obsFijas && (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                {obsFijas.defaultValue ?? String(sheetData[obsFijas.fieldKey] ?? '')}
              </p>
            )}
            {obs && (
              <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} compact />
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="border-t border-gray-800">
      <div className={SECTION_HEADER_CLASS}>
        <h3 className="text-xs font-bold uppercase text-gray-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
