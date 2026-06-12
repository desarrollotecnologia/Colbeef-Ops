import type { ReactNode } from 'react';
import type { FormatField } from '@/types';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format4Diario3({ fields, sheetData, onUpdate, disabled }: Props) {
  const empaque = fields.find((f) => f.fieldKey === 'condiciones_empaque');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  const poes4hFields = fields.filter((f) =>
    ['poes_4h_hora', 'poes_tablas', 'poes_sierra', 'poes_bandas', 'poes_delantales', 'poes_4h_correccion'].includes(f.fieldKey)
  );
  const poes1hFields = fields.filter((f) =>
    ['poes_1h_hora', 'poes_molino', 'poes_grameras', 'poes_1h_obs', 'poes_1h_correccion'].includes(f.fieldKey)
  );

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {empaque && (
        <Section title={empaque.label} subtitle="Sellado · Etiqueta · Legibilidad">
          <FormField field={{ ...empaque, label: '' }} value={sheetData[empaque.fieldKey]} onChange={(v) => onUpdate(empaque.fieldKey, v)} disabled={disabled} />
        </Section>
      )}

      {poes4hFields.length > 0 && (
        <Section title="POES equipos — cada 4 horas" subtitle="Tablas · Sierra · Bandas · Delantales">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {poes4hFields.map((f) => (
              <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
            ))}
          </div>
        </Section>
      )}

      {poes1hFields.length > 0 && (
        <Section title="POES operativos — cada hora" subtitle="Molino · Grameras">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {poes1hFields.map((f) => (
              <FormField key={f.fieldKey} field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
            ))}
          </div>
        </Section>
      )}

      {obs && (
        <div className="p-4 border-t border-gray-800">
          <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} />
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="border-t border-gray-800">
      <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
        <h3 className="text-xs font-bold uppercase text-gray-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
