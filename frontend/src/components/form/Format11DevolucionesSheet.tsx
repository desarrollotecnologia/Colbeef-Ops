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

const HEADER_KEYS = new Set(['motivo', 'fecha_despacho', 'destino', 'condicion_producto', 'tipo_empaque']);

export default function Format11DevolucionesSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const headerFields = fields.filter((f) => HEADER_KEYS.has(f.fieldKey));
  const registros = fields.find((f) => f.fieldKey === 'registros');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      <Section title="Datos de la devolución">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {headerFields.map((f) => (
            <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
          ))}
        </div>
      </Section>

      {registros && (
        <Section title="Productos devueltos" subtitle="Varios registros por devolución">
          <FormField field={{ ...registros, label: '' }} value={sheetData[registros.fieldKey]} onChange={(v) => onUpdate(registros.fieldKey, v)} disabled={disabled} />
        </Section>
      )}

      {obs && (
        <Section title="Observaciones">
          <div className="p-4">
            <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} compact />
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
