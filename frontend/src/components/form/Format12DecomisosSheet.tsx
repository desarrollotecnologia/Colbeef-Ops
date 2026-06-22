import type { ReactNode } from 'react';
import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import DecomisosRepeater from './DecomisosRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const HEADER_KEYS = new Set(['cliente', 'lote', 'especie', 'temp_inicio_proceso']);

export default function Format12DecomisosSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const headerFields = fields.filter((f) => HEADER_KEYS.has(f.fieldKey));
  const decomisos = fields.find((f) => f.fieldKey === 'decomisos');
  const obsFijas = fields.find((f) => f.fieldKey === 'observaciones_fijas');
  const obsAdic = fields.find((f) => f.fieldKey === 'observaciones_adicionales');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      <Section title="Datos del proceso">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {headerFields.map((f) => (
            <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
          ))}
        </div>
      </Section>

      {decomisos && (
        <Section title="Registro de decomisos" subtitle="Totales automáticos por causal y peso total">
          <DecomisosRepeater
            options={decomisos.options ?? {}}
            value={Array.isArray(sheetData[decomisos.fieldKey]) ? (sheetData[decomisos.fieldKey] as Record<string, unknown>[]) : []}
            onChange={(v) => onUpdate(decomisos.fieldKey, v)}
            disabled={disabled}
          />
        </Section>
      )}

      {(obsFijas || obsAdic) && (
        <Section title="Observaciones">
          <div className="p-4 space-y-3">
            {obsFijas && (
              <p className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-2 font-medium uppercase">
                {obsFijas.defaultValue ?? String(sheetData[obsFijas.fieldKey] ?? '')}
              </p>
            )}
            {obsAdic && (
              <FormField field={obsAdic} value={sheetData[obsAdic.fieldKey]} onChange={(v) => onUpdate(obsAdic.fieldKey, v)} disabled={disabled} compact />
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
