import type { ReactNode } from 'react';
import type { ChecklistItemData, FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import ItemChecklist from './ItemChecklist';
import VehiculosCargaTable from './VehiculosCargaTable';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const HEADER_KEYS = new Set([
  'hora', 'placa', 'conductor', 'documento', 'destino',
  'temp_vehiculo', 'temp_producto', 'desinfeccion_vehiculo',
]);

const FIRMA_KEYS = new Set([
  'resp_revision_nombre', 'resp_revision_cargo', 'resp_revision_firma',
  'conductor_firma_nombre', 'conductor_firma_doc', 'conductor_firma',
]);

export default function Format8VehiculosSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const headerFields = fields.filter((f) => HEADER_KEYS.has(f.fieldKey));
  const carga = fields.find((f) => f.fieldKey === 'carga_productos');
  const checklist = fields.find((f) => f.fieldKey === 'inspeccion_items');
  const firmaFields = fields.filter((f) => FIRMA_KEYS.has(f.fieldKey));

  const cargaOpts = carga?.options ?? {};
  const cargaHasAlimentoCol =
    Array.isArray(cargaOpts.columns) &&
    cargaOpts.columns.some(
      (c) => typeof c === 'object' && c !== null && 'key' in c && (c as { key: string }).key === 'alimento'
    );

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      <Section title="Datos del vehículo" subtitle="T° canales &lt; 7 °C · P.C. &lt; 5 °C · Refrig. 0–4 °C · Cong. &gt; -18 °C">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {headerFields.map((f) => (
            <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
          ))}
        </div>
      </Section>

      {carga && (
        <Section title="Carga del vehículo" subtitle="Ácido láctico al 2% (± 0,1)">
          {cargaHasAlimentoCol ? (
            <FormField
              field={{ ...carga, label: '' }}
              value={sheetData[carga.fieldKey]}
              onChange={(v) => onUpdate(carga.fieldKey, v)}
              disabled={disabled}
            />
          ) : (
            <VehiculosCargaTable
              value={
                Array.isArray(sheetData[carga.fieldKey])
                  ? (sheetData[carga.fieldKey] as Record<string, unknown>[])
                  : []
              }
              onChange={(v) => onUpdate(carga.fieldKey, v)}
              disabled={disabled}
              minRows={cargaOpts.minRows ?? 1}
              maxRows={cargaOpts.maxRows ?? 10}
            />
          )}
        </Section>
      )}

      {checklist && (
        <Section title="Inspección de aspectos" subtitle="C · NC · NA">
          <ItemChecklist
            options={checklist.options ?? {}}
            value={(sheetData[checklist.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
            onChange={(v) => onUpdate(checklist.fieldKey, v)}
            disabled={disabled}
            tableMode
          />
        </Section>
      )}

      {firmaFields.length > 0 && (
        <Section title="Firmas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              <h4 className="text-xs font-bold uppercase text-gray-700">Responsable de la revisión</h4>
              {firmaFields.filter((f) => f.fieldKey.startsWith('resp_revision')).map((f) => (
                <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
              ))}
            </div>
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              <h4 className="text-xs font-bold uppercase text-gray-700">Conductor del vehículo</h4>
              {firmaFields.filter((f) => f.fieldKey.startsWith('conductor_firma')).map((f) => (
                <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
              ))}
            </div>
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
