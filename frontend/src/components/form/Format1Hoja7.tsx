import type { FormatField, ChecklistItemData } from '@/types';
import ItemChecklist from './ItemChecklist';
import CavaMatrixTable from './CavaMatrixTable';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format1Hoja7({ fields, sheetData, onUpdate, disabled }: Props) {
  const pcField = fields.find((f) => f.fieldKey === 'pc_comestibles');
  const refriField = fields.find((f) => f.fieldKey === 'area_refri');
  const obsField = fields.find((f) => f.fieldKey === 'observaciones');
  const acField = fields.find((f) => f.fieldKey === 'acciones_correctivas');

  const isMatrix = (f: FormatField) => Boolean(f.options?.columnDefs?.length);

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {pcField && (
        <div className="border-b border-gray-800">
          <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
            <h3 className="text-xs font-bold uppercase text-gray-900">{pcField.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">C / NC por ítem · Observación y acción correctiva</p>
          </div>
          <ItemChecklist
            options={pcField.options ?? {}}
            value={(sheetData[pcField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
            onChange={(v) => onUpdate(pcField.fieldKey, v)}
            disabled={disabled}
            tableMode
          />
        </div>
      )}

      {refriField && (
        <div className="border-b border-gray-800">
          <div className="bg-gray-200 px-3 py-2 border-b border-gray-800">
            <h3 className="text-xs font-bold uppercase text-gray-900">{refriField.label}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {refriField.helpText ??
                'Cada fila es un equipo o superficie · Cada columna es una cava, máquina o zona (C#10…PVC, M7, PRE…)'}
            </p>
          </div>
          {isMatrix(refriField) ? (
            <CavaMatrixTable
              options={refriField.options ?? {}}
              value={(sheetData[refriField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
              onChange={(v) => onUpdate(refriField.fieldKey, v)}
              disabled={disabled}
            />
          ) : (
            <ItemChecklist
              options={refriField.options ?? {}}
              value={(sheetData[refriField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
              onChange={(v) => onUpdate(refriField.fieldKey, v)}
              disabled={disabled}
              tableMode
            />
          )}
        </div>
      )}

      {(obsField || acField) && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
          {obsField && (
            <div className="p-4">
              <FormField
                field={obsField}
                value={sheetData[obsField.fieldKey]}
                onChange={(v) => onUpdate(obsField.fieldKey, v)}
                disabled={disabled}
                compact
              />
            </div>
          )}
          {acField && (
            <div className="p-4">
              <FormField
                field={acField}
                value={sheetData[acField.fieldKey]}
                onChange={(v) => onUpdate(acField.fieldKey, v)}
                disabled={disabled}
                compact
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
