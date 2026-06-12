import type { FormatField } from '@/types';
import { SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const PRODUCT_BLOCKS = [
  { prefix: 'refri_sin_hueso', title: 'Producto refrigerado sin hueso' },
  { prefix: 'refri_con_hueso', title: 'Producto refrigerado con hueso' },
  { prefix: 'cong_sin_hueso', title: 'Producto congelado sin hueso' },
  { prefix: 'cong_con_hueso', title: 'Producto congelado con hueso' },
];

export default function Format4Diario5({ fields, sheetData, onUpdate, disabled }: Props) {
  const lote = fields.find((f) => f.fieldKey === 'lote');
  const obs = fields.find((f) => f.fieldKey === 'observaciones');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {lote && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2]">
          <FormField field={lote} value={sheetData[lote.fieldKey]} onChange={(v) => onUpdate(lote.fieldKey, v)} disabled={disabled} />
        </div>
      )}

      {PRODUCT_BLOCKS.map(({ prefix, title }) => {
        const blockFields = fields.filter((f) => f.fieldKey.startsWith(`${prefix}_`));
        if (blockFields.length === 0) return null;
        return (
          <div key={prefix} className="border-t border-gray-800">
            <div className={SECTION_HEADER_CLASS}>
              <h3 className="text-xs font-bold uppercase text-gray-900">{title}</h3>
              <p className="text-[11px] text-gray-600 mt-0.5">Empaque Vacío/Granel · Etiqueta C/NC · Video Jet C/NC/NA · Foto</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {blockFields.map((f) => (
                <div key={f.fieldKey} className={f.fieldType === 'PHOTO' ? 'col-span-full' : ''}>
                  <FormField field={f} value={sheetData[f.fieldKey]} onChange={(v) => onUpdate(f.fieldKey, v)} disabled={disabled} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {obs && (
        <div className="p-4 border-t border-gray-800">
          <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} />
        </div>
      )}
    </div>
  );
}
