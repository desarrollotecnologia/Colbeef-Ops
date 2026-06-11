import type { ChecklistItemData, FormatField } from '@/types';
import ItemChecklist from './ItemChecklist';
interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export default function Format2SanitarySheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const checklistField = fields.find((f) => f.fieldKey === 'operacion_sanitaria');
  if (!checklistField) return null;

  const detergente = fields.find((f) => f.fieldKey === 'detergente')?.defaultValue ?? 'Alcalino clorado 2%';
  const desinfectante = fields.find((f) => f.fieldKey === 'desinfectante')?.defaultValue ?? 'Amonio cuaternario 200 ppm';

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 border-b border-gray-800 bg-[#e8edf2] text-xs">
        <div className="px-4 py-2.5">
          <span className="font-bold uppercase text-gray-900">Detergente / Concentración: </span>
          <span className="text-gray-800">{detergente}</span>
        </div>
        <div className="px-4 py-2.5">
          <span className="font-bold uppercase text-gray-900">Desinfectante / Concentración: </span>
          <span className="text-gray-800">{desinfectante}</span>
        </div>
      </div>
      <ItemChecklist
        options={checklistField.options ?? {}}
        value={(sheetData[checklistField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
        onChange={(v) => onUpdate(checklistField.fieldKey, v)}
        disabled={disabled}
        tableMode
      />
    </div>
  );
}
