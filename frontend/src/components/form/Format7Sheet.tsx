import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const BLOQUE_LABELS: Record<string, string> = {
  bloque_1: 'Registro de lote 1',
  bloque_2: 'Registro de lote 2',
  bloque_3: 'Registro de lote 3',
  bloque_4: 'Registro de lote 4',
};

/** Vista legada (envíos con schemaSnapshot de 4 bloques fijos). */
function LegacyBloques({ fields, sheetData, onUpdate, disabled }: Props) {
  const obsGen = fields.find((f) => f.fieldKey === 'observaciones_generales');
  const prefixes = ['bloque_1', 'bloque_2', 'bloque_3', 'bloque_4'];

  return (
    <>
      {prefixes.map((prefix) => {
        const blockFields = fields.filter((f) => f.fieldKey.startsWith(`${prefix}_`));
        if (blockFields.length === 0) return null;
        return (
          <div key={prefix} className="border-b border-gray-800">
            <div className={SECTION_HEADER_CLASS}>
              <h3 className="text-xs font-bold uppercase text-gray-900">{BLOQUE_LABELS[prefix]}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {blockFields.map((f) => (
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
        );
      })}
      {obsGen && (
        <div className="p-4">
          <FormField
            field={obsGen}
            value={sheetData[obsGen.fieldKey]}
            onChange={(v) => onUpdate(obsGen.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}
    </>
  );
}

export default function Format7Sheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const lotes = fields.find((f) => f.fieldKey === 'lotes');
  const obsGen = fields.find((f) => f.fieldKey === 'observaciones_generales');
  const hasLegacy = fields.some((f) => f.fieldKey.startsWith('bloque_1_'));

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {lotes ? (
        <>
          <FormField
            field={{ ...lotes, label: '' }}
            value={sheetData[lotes.fieldKey]}
            onChange={(v) => onUpdate(lotes.fieldKey, v)}
            disabled={disabled}
          />
          {obsGen && (
            <div className="p-4 border-t border-gray-800">
              <FormField
                field={obsGen}
                value={sheetData[obsGen.fieldKey]}
                onChange={(v) => onUpdate(obsGen.fieldKey, v)}
                disabled={disabled}
              />
            </div>
          )}
        </>
      ) : hasLegacy ? (
        <LegacyBloques fields={fields} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
      ) : null}
    </div>
  );
}
