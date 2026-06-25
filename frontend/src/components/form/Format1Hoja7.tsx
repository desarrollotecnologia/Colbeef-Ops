import type { FormatField, ChecklistItemData } from '@/types';
import { resolveHoja7Field } from '@/lib/format1Hoja7Defaults';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import ItemChecklist from './ItemChecklist';
import CavaMatrixSplit from './CavaMatrixSplit';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

function MatrixSection({
  field,
  sheetData,
  onUpdate,
  disabled,
  splitAt,
  subtitles,
}: {
  field: FormatField;
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
  splitAt: number[];
  subtitles: string[];
}) {
  return (
    <div className="border-b border-gray-800">
      <div className={SECTION_HEADER_CLASS}>
        <h3 className="text-xs font-bold uppercase text-gray-900">{field.label}</h3>
        {field.helpText && <p className="text-[11px] text-gray-600 mt-0.5">{field.helpText}</p>}
      </div>
      <CavaMatrixSplit
        options={field.options ?? {}}
        value={(sheetData[field.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
        onChange={(v) => onUpdate(field.fieldKey, v)}
        disabled={disabled}
        splitAt={splitAt}
        subtitles={subtitles}
      />
    </div>
  );
}

export default function Format1Hoja7({ fields, sheetData, onUpdate, disabled }: Props) {
  const pcField = fields.find((f) => f.fieldKey === 'pc_comestibles');
  const refri = resolveHoja7Field(fields.find((f) => f.fieldKey === 'area_refri'));
  const obsField = fields.find((f) => f.fieldKey === 'observaciones');
  const acField = fields.find((f) => f.fieldKey === 'acciones_correctivas');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {pcField && (
        <div className="border-b border-gray-800">
          <div className={SECTION_HEADER_CLASS}>
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

      {refri && (refri.options?.columnDefs?.length ?? 0) > 0 ? (
        <MatrixSection
          field={refri}
          sheetData={sheetData}
          onUpdate={onUpdate}
          disabled={disabled}
          splitAt={[4, 9, 14]}
          subtitles={[
            'Cavas principales — C#10 · C#9 · C#8 · C#7',
            'Cavas y máquinas — M7 · C#6B · M6B · C#6A · C#5',
            'Cavas y máquinas — M5 · C#4 · M4 · C#3 · M#3',
            'Cavas y máquinas — C#2 · M2 · C#1 · M1 · PRE',
          ]}
        />
      ) : refri ? (
        <div className="border-b border-gray-800">
          <ItemChecklist
            options={refri.options ?? {}}
            value={(sheetData[refri.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
            onChange={(v) => onUpdate(refri.fieldKey, v)}
            disabled={disabled}
            tableMode
          />
        </div>
      ) : null}

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
