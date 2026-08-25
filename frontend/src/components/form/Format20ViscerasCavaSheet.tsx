import type { FormatField } from '@/types';
import FormField from './FormField';
import ViscerasCavaRepeater, { type VisceraCavaRow } from './ViscerasCavaRepeater';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

const HEADER_KEYS = ['cava_almacenamiento', 'cliente_destino'] as const;

export default function Format20ViscerasCavaSheet({
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
  const registros = fields.find((f) => f.fieldKey === 'registros');
  const codigoLabel =
    (registros?.options as { codigoLabel?: string } | undefined)?.codigoLabel ||
    'Código víscera';

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {headerFields.length > 0 && (
        <div>
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Encabezado</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">Cava y cliente / destino del registro</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {registros && (
        <div className="border-t border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{registros.label}</h3>
            {registros.helpText && (
              <p className="text-[11px] text-gray-600 mt-0.5">{registros.helpText}</p>
            )}
          </div>
          <div className="p-3">
            <ViscerasCavaRepeater
              options={registros.options ?? {}}
              value={
                Array.isArray(sheetData.registros)
                  ? (sheetData.registros as VisceraCavaRow[])
                  : []
              }
              onChange={(rows) => onUpdate('registros', rows)}
              disabled={disabled}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              codigoLabel={codigoLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
