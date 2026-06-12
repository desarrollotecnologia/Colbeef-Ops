import type { FormatField, ChecklistItemData } from '@/types';
import CavaMatrixTable from './CavaMatrixTable';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format1Hoja8({ fields, sheetData, onUpdate, disabled }: Props) {
  const condField = fields.find((f) => f.fieldKey === 'condensacion');
  const obsField = fields.find((f) => f.fieldKey === 'observaciones');
  const acField = fields.find((f) => f.fieldKey === 'acciones_correctivas');
  const obsGenField = fields.find((f) => f.fieldKey === 'observaciones_generales');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      {condField && (
        <div className="border-b border-gray-800">
          <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
            <h3 className="text-xs font-bold uppercase text-gray-900">{condField.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {condField.helpText ?? 'Marque C / NC / NA en cada cava o máquina (C#10…PVC)'}
            </p>
          </div>
          <CavaMatrixTable
            options={condField.options ?? {}}
            value={(sheetData[condField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
            onChange={(v) => onUpdate(condField.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}

      {(obsField || acField) && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 border-b border-gray-800">
          {obsField && (
            <div className="p-4">
              <FormField field={obsField} value={sheetData[obsField.fieldKey]} onChange={(v) => onUpdate(obsField.fieldKey, v)} disabled={disabled} compact />
            </div>
          )}
          {acField && (
            <div className="p-4">
              <FormField field={acField} value={sheetData[acField.fieldKey]} onChange={(v) => onUpdate(acField.fieldKey, v)} disabled={disabled} compact />
            </div>
          )}
        </div>
      )}

      {obsGenField && (
        <div className="p-4">
          <FormField field={obsGenField} value={sheetData[obsGenField.fieldKey]} onChange={(v) => onUpdate(obsGenField.fieldKey, v)} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
