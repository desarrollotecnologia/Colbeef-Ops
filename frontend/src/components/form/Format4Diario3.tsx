import type { ReactNode } from 'react';
import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import CardRepeater from './CardRepeater';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

function isCardRepeater(field: FormatField) {
  return field.fieldType === 'REPEATER' && field.options?.layout === 'card_repeater';
}

export default function Format4Diario3({ fields, sheetData, onUpdate, disabled }: Props) {
  const empaque = fields.find((f) => f.fieldKey === 'condiciones_empaque');
  const poes4h = fields.find((f) => f.fieldKey === 'poes_equipos_4h');
  const poes1h = fields.find((f) => f.fieldKey === 'poes_operativos_1h');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {empaque && (
        <Section title={empaque.label} subtitle="Sellado · Etiqueta · Legibilidad">
          <FormField field={{ ...empaque, label: '' }} value={sheetData[empaque.fieldKey]} onChange={(v) => onUpdate(empaque.fieldKey, v)} disabled={disabled} />
        </Section>
      )}

      {poes4h && isCardRepeater(poes4h) && (
        <Section title="POES equipos — cada 4 horas" subtitle="Tablas · Sierra · Bandas · Delantales">
          <CardRepeater
            options={poes4h.options ?? {}}
            value={Array.isArray(sheetData[poes4h.fieldKey]) ? (sheetData[poes4h.fieldKey] as Record<string, unknown>[]) : []}
            onChange={(v) => onUpdate(poes4h.fieldKey, v)}
            disabled={disabled}
          />
        </Section>
      )}

      {poes1h && isCardRepeater(poes1h) && (
        <Section title="POES operativos — cada hora" subtitle="Molino · Grameras">
          <CardRepeater
            options={poes1h.options ?? {}}
            value={Array.isArray(sheetData[poes1h.fieldKey]) ? (sheetData[poes1h.fieldKey] as Record<string, unknown>[]) : []}
            onChange={(v) => onUpdate(poes1h.fieldKey, v)}
            disabled={disabled}
          />
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
      <div className={SECTION_HEADER_CLASS}>
        <h3 className="text-xs font-bold uppercase text-gray-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
