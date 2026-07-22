import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format4Diario4({ fields, sheetData, onUpdate, disabled }: Props) {
  const manipulador = fields.find((f) => f.fieldKey === 'poes_manipulador');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      {manipulador && (
        <div className="border-b border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">{manipulador.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Registro cada hora — guantes · guante de malla · cuchillo · gancho despostador · soporte gancho
            </p>
          </div>
          <FormField field={{ ...manipulador, label: '' }} value={sheetData[manipulador.fieldKey]} onChange={(v) => onUpdate(manipulador.fieldKey, v)} disabled={disabled} />
        </div>
      )}
      {obs && (
        <div className="p-4">
          <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
