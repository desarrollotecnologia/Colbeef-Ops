import type { FormatField } from '@/types';
import { formatSpanishDateLong } from '@/lib/formatDate';
import FormField from './FormField';
import PoesOperativoTable, { PoesBpmTable, type PoesEquiposValue } from './PoesOperativoTable';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  workDate: string;
  disabled?: boolean;
}

const META_CELL = 'px-3 py-2 border-r border-gray-800 text-xs align-middle';
const META_LABEL = 'font-bold uppercase text-gray-900 mr-2';
const SECTION_HEADER = 'px-3 py-2 border-b border-gray-800 bg-[#d9ead3] text-center';

export default function Format15PoesSheet({ fields, sheetData, onUpdate, workDate, disabled }: Props) {
  const hora1 = fields.find((f) => f.fieldKey === 'poes_hora_1');
  const hora2 = fields.find((f) => f.fieldKey === 'poes_hora_2');
  const equipos = fields.find((f) => f.fieldKey === 'poes_equipos');
  const bpm = fields.find((f) => f.fieldKey === 'poes_bpm_procedimientos');
  const obs = fields.find((f) => f.fieldKey === 'poes_observaciones');

  const h1 = String(sheetData.poes_hora_1 ?? '');
  const h2 = String(sheetData.poes_hora_2 ?? '');

  return (
    <div className="border-2 border-gray-800 rounded-sm overflow-hidden bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-800 bg-[#f3f3f3]">
        <div className={`${META_CELL} border-b sm:border-b-0`}>
          <span className={META_LABEL}>Fecha:</span>
          <span className="text-gray-800 capitalize">{formatSpanishDateLong(workDate)}</span>
        </div>
        {hora1 && (
          <div className={`${META_CELL} border-b sm:border-b-0`}>
            <span className={`${META_LABEL} block mb-1`}>Hora toma 1:</span>
            <FormField field={hora1} value={sheetData[hora1.fieldKey]} onChange={(v) => onUpdate(hora1.fieldKey, v)} disabled={disabled} compact />
          </div>
        )}
        {hora2 && (
          <div className={META_CELL}>
            <span className={`${META_LABEL} block mb-1`}>Hora toma 2:</span>
            <FormField field={hora2} value={sheetData[hora2.fieldKey]} onChange={(v) => onUpdate(hora2.fieldKey, v)} disabled={disabled} compact />
          </div>
        )}
      </div>

      {equipos && (
        <div className="border-t border-gray-800">
          <div className={SECTION_HEADER}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Equipos / utensilios / superficies</h3>
          </div>
          <PoesOperativoTable
            options={equipos.options ?? {}}
            value={(sheetData[equipos.fieldKey] as PoesEquiposValue) ?? {}}
            onChange={(v) => onUpdate(equipos.fieldKey, v)}
            disabled={disabled}
            hora1={h1}
            hora2={h2}
          />
        </div>
      )}

      {bpm && (
        <div className="border-t-2 border-gray-800">
          <div className={SECTION_HEADER}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Buenas prácticas higiénicas</h3>
          </div>
          <PoesBpmTable
            options={bpm.options ?? {}}
            value={(sheetData[bpm.fieldKey] as Record<string, import('./PoesOperativoTable').PoesBpmRow>) ?? {}}
            onChange={(v) => onUpdate(bpm.fieldKey, v)}
            disabled={disabled}
            hora1={h1}
            hora2={h2}
          />
        </div>
      )}

      {obs && (
        <div className="border-t border-gray-800">
          <div className="px-3 py-1.5 bg-[#d9d9d9] border-b border-gray-800">
            <h3 className="text-[10px] font-bold uppercase text-gray-900">{obs.groupName ?? 'Observaciones generales'}</h3>
          </div>
          <div className="p-4">
            <FormField field={obs} value={sheetData[obs.fieldKey]} onChange={(v) => onUpdate(obs.fieldKey, v)} disabled={disabled} compact />
          </div>
        </div>
      )}

      <div className="px-3 py-2 border-t border-gray-800 bg-gray-50 text-[10px] text-gray-600">
        <strong>C:</strong> Cumple · <strong>NC:</strong> No cumple · <strong>NA:</strong> No aplica
      </div>
    </div>
  );
}
