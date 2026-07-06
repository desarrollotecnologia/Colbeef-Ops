import { Fragment } from 'react';
import { Plus } from 'lucide-react';
import type { FieldOptions, MeasureRowData } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';
import CncToggle from './CncToggle';
import { cncCellClass, cncHeaderClass } from './repeaterColumns';

export type PcOperativoVariant =
  | 'codigo_responsable'
  | 'codigo_operario'
  | 'operario_cnc'
  | 'proceso_tiempos'
  | 'proceso_tiempos_cnc'
  | 'esterilizadores';

type AspectItem = { key: string; label: string; slotCount?: number };

export type PcOperativoValue = Record<string, MeasureRowData[]>;

interface Props {
  options: FieldOptions;
  value: PcOperativoValue | MeasureRowData[] | Record<string, unknown>;
  onChange: (v: PcOperativoValue) => void;
  disabled?: boolean;
}

const TH = 'px-2 py-1.5 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#d9ead3]';
const TD = 'px-1 py-1 border-r border-b border-gray-400 align-middle';

function normalizeEntries(raw: unknown, minSlots: number): MeasureRowData[] {
  if (Array.isArray(raw)) {
    if (raw.length >= minSlots) return raw as MeasureRowData[];
    return [...raw, ...Array.from({ length: minSlots - raw.length }, () => ({}))];
  }
  if (raw && typeof raw === 'object') {
    return [raw as MeasureRowData, ...Array.from({ length: minSlots - 1 }, () => ({}))];
  }
  return Array.from({ length: minSlots }, () => ({}));
}

function normalizeValue(raw: unknown, items: AspectItem[]): PcOperativoValue {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (items.some((i) => i.key in obj)) {
      const result: PcOperativoValue = {};
      items.forEach((item) => {
        result[item.key] = normalizeEntries(obj[item.key], item.slotCount ?? 2);
      });
      return result;
    }
  }
  if (Array.isArray(raw)) {
    const result: PcOperativoValue = {};
    items.forEach((item, i) => {
      const legacy = raw[i] as MeasureRowData | undefined;
      result[item.key] = normalizeEntries(legacy ? [legacy] : [], item.slotCount ?? 2);
    });
    return result;
  }
  const result: PcOperativoValue = {};
  items.forEach((item) => {
    result[item.key] = normalizeEntries(undefined, item.slotCount ?? 2);
  });
  return result;
}

function AspectLabel({ label }: { label: string }) {
  return (
    <div className="px-2 py-2 text-[10px] font-bold uppercase text-gray-900 leading-snug text-left">
      {label}
    </div>
  );
}

function TextCell({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${INPUT_CLASS} text-xs py-1`}
    />
  );
}

export default function PcOperativoAspectTable({ options, value, onChange, disabled }: Props) {
  const items = (options.items ?? []) as AspectItem[];
  const variant = (options.pcOperativoVariant ?? 'operario_cnc') as PcOperativoVariant;
  const operarioLabel = options.operarioLabel ?? 'Nombre del operario';
  const data = normalizeValue(value, items);

  const patch = (aspectKey: string, minSlots: number, idx: number, p: Partial<MeasureRowData>) => {
    const entries = [...normalizeEntries(data[aspectKey], minSlots)];
    entries[idx] = { ...entries[idx], ...p };
    onChange({ ...data, [aspectKey]: entries });
  };

  const addRow = (aspectKey: string, minSlots: number) => {
    const entries = normalizeEntries(data[aspectKey], minSlots);
    onChange({ ...data, [aspectKey]: [...entries, {}] });
  };

  const renderCnc = (aspectKey: string, minSlots: number, idx: number, row: MeasureRowData) =>
    (['C', 'NC'] as const).map((choice) => (
      <td key={choice} className={`${TD} text-center w-11 px-0.5 ${cncCellClass(choice)}`}>
        <CncToggle
          choice={choice}
          value={row.cnc ?? ''}
          disabled={disabled}
          onChange={(v) => patch(aspectKey, minSlots, idx, { cnc: v })}
          compact
        />
      </td>
    ));

  const renderObsAc = (aspectKey: string, minSlots: number, idx: number, row: MeasureRowData) => (
    <>
      <td className={`${TD} min-w-[100px]`}>
        <TextCell value={row.observation ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { observation: v })} />
      </td>
      <td className={`${TD} min-w-[100px]`}>
        <TextCell value={row.corrective ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { corrective: v })} />
      </td>
    </>
  );

  const renderRowCells = (aspectKey: string, minSlots: number, idx: number, row: MeasureRowData) => {
    switch (variant) {
      case 'codigo_responsable':
        return (
          <>
            <td className={TD}>
              <TextCell value={row.codigo ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { codigo: v })} />
            </td>
            {renderCnc(aspectKey, minSlots, idx, row)}
            {renderObsAc(aspectKey, minSlots, idx, row)}
            <td className={TD}>
              <TextCell value={row.responsable ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { responsable: v })} />
            </td>
          </>
        );
      case 'codigo_operario':
        return (
          <>
            <td className={TD}>
              <TextCell value={row.codigo ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { codigo: v })} />
            </td>
            {renderCnc(aspectKey, minSlots, idx, row)}
            <td className={TD}>
              <TextCell value={row.operario ?? row.responsable ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { operario: v })} />
            </td>
            {renderObsAc(aspectKey, minSlots, idx, row)}
          </>
        );
      case 'operario_cnc':
        return (
          <>
            <td className={TD}>
              <TextCell value={row.operario ?? row.responsable ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { operario: v })} />
            </td>
            {renderCnc(aspectKey, minSlots, idx, row)}
            {renderObsAc(aspectKey, minSlots, idx, row)}
          </>
        );
      case 'proceso_tiempos':
        return (
          <>
            <td className={TD}>
              <TextCell value={row.cantidad ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { cantidad: v })} />
            </td>
            <td className={TD}>
              <TextCell value={row.tiempo ?? row.minutos ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { tiempo: v })} />
            </td>
            <td className={TD}>
              <TextCell value={row.temperatura ?? row.valor ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { temperatura: v })} />
            </td>
            {renderObsAc(aspectKey, minSlots, idx, row)}
          </>
        );
      case 'proceso_tiempos_cnc':
        return (
          <>
            <td className={TD}>
              <TextCell value={row.cantidad ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { cantidad: v })} />
            </td>
            <td className={TD}>
              <TextCell value={row.tiempo ?? row.minutos ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { tiempo: v })} />
            </td>
            <td className={TD}>
              <TextCell value={row.temperatura ?? row.valor ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { temperatura: v })} />
            </td>
            {renderCnc(aspectKey, minSlots, idx, row)}
            <td className={TD}>
              <TextCell value={row.operario ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { operario: v })} />
            </td>
            {renderObsAc(aspectKey, minSlots, idx, row)}
          </>
        );
      case 'esterilizadores':
        return (
          <>
            <td className={TD}>
              <TextCell value={row.temperatura ?? row.valor ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { temperatura: v })} />
            </td>
            <td className={TD}>
              <TextCell value={row.hora ?? row.turno ?? ''} disabled={disabled} onChange={(v) => patch(aspectKey, minSlots, idx, { hora: v })} />
            </td>
            {renderCnc(aspectKey, minSlots, idx, row)}
            {renderObsAc(aspectKey, minSlots, idx, row)}
          </>
        );
      default:
        return null;
    }
  };

  const colspanMap: Record<PcOperativoVariant, number> = {
    codigo_responsable: 7,
    codigo_operario: 7,
    operario_cnc: 5,
    proceso_tiempos: 5,
    proceso_tiempos_cnc: 8,
    esterilizadores: 6,
  };

  const renderHeader = () => {
    switch (variant) {
      case 'codigo_responsable':
        return (
          <tr className="border-b-2 border-gray-800">
            <th className={`${TH} text-left w-[140px]`}>Aspectos a verificar</th>
            <th className={TH}>Código</th>
            <th className={`${TH} w-11 ${cncHeaderClass('C')}`}>Cumple</th>
            <th className={`${TH} w-11 ${cncHeaderClass('NC')}`}>No cumple</th>
            <th className={`${TH} text-left min-w-[100px]`}>Observaciones</th>
            <th className={`${TH} text-left min-w-[100px]`}>Acción correctiva</th>
            <th className={`${TH} text-left`}>Operario responsable</th>
          </tr>
        );
      case 'codigo_operario':
        return (
          <tr className="border-b-2 border-gray-800">
            <th className={`${TH} text-left w-[140px]`}>Aspectos a verificar</th>
            <th className={TH}>Código</th>
            <th className={`${TH} w-11 ${cncHeaderClass('C')}`}>Cumple</th>
            <th className={`${TH} w-11 ${cncHeaderClass('NC')}`}>No cumple</th>
            <th className={`${TH} text-left`}>Nombre operario</th>
            <th className={`${TH} text-left min-w-[100px]`}>Observaciones</th>
            <th className={`${TH} text-left min-w-[100px]`}>Acción correctiva</th>
          </tr>
        );
      case 'operario_cnc':
        return (
          <tr className="border-b-2 border-gray-800">
            <th className={`${TH} text-left w-[140px]`}>Aspectos a verificar</th>
            <th className={`${TH} text-left`}>{operarioLabel}</th>
            <th className={`${TH} w-11 ${cncHeaderClass('C')}`}>Cumple</th>
            <th className={`${TH} w-11 ${cncHeaderClass('NC')}`}>No cumple</th>
            <th className={`${TH} text-left min-w-[100px]`}>Observaciones</th>
            <th className={`${TH} text-left min-w-[100px]`}>Acción correctiva</th>
          </tr>
        );
      case 'proceso_tiempos':
        return (
          <tr className="border-b-2 border-gray-800">
            <th className={`${TH} text-left w-[160px]`}>Aspectos a verificar</th>
            <th className={TH}>Cantidad de producto</th>
            <th className={TH}>Tiempo (min)</th>
            <th className={TH}>Temperatura (°C)</th>
            <th className={`${TH} text-left min-w-[100px]`}>Observaciones</th>
            <th className={`${TH} text-left min-w-[100px]`}>Acción correctiva</th>
          </tr>
        );
      case 'proceso_tiempos_cnc':
        return (
          <tr className="border-b-2 border-gray-800">
            <th className={`${TH} text-left w-[160px]`}>Aspectos a verificar</th>
            <th className={TH}>Cantidad de producto</th>
            <th className={TH}>Tiempo</th>
            <th className={TH}>Temperatura (°C)</th>
            <th className={`${TH} w-11 ${cncHeaderClass('C')}`}>C</th>
            <th className={`${TH} w-11 ${cncHeaderClass('NC')}`}>NC</th>
            <th className={TH}>Operario</th>
            <th className={`${TH} text-left min-w-[90px]`}>Observaciones</th>
            <th className={`${TH} text-left min-w-[90px]`}>Acción correctiva</th>
          </tr>
        );
      case 'esterilizadores':
        return (
          <tr className="border-b-2 border-gray-800">
            <th className={`${TH} text-left w-[140px]`}>Aspectos a verificar</th>
            <th className={TH}>Temperatura (°C)</th>
            <th className={TH}>Hora</th>
            <th className={`${TH} w-11 ${cncHeaderClass('C')}`}>Cumple</th>
            <th className={`${TH} w-11 ${cncHeaderClass('NC')}`}>No cumple</th>
            <th className={`${TH} text-left min-w-[100px]`}>Observaciones</th>
            <th className={`${TH} text-left min-w-[100px]`}>Acción correctiva</th>
          </tr>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px] border-collapse border border-gray-800">
        <thead>{renderHeader()}</thead>
        <tbody>
          {items.map((item) => {
            const minSlots = item.slotCount ?? 2;
            const entries = normalizeEntries(data[item.key], minSlots);
            return (
              <Fragment key={item.key}>
                {entries.map((row, idx) => (
                  <tr key={`${item.key}-${idx}`} className="bg-white">
                    {idx === 0 && (
                      <td rowSpan={entries.length + 1} className={`${TD} align-top border-l border-gray-400 w-[160px]`}>
                        <AspectLabel label={item.label} />
                      </td>
                    )}
                    {renderRowCells(item.key, minSlots, idx, row)}
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={colspanMap[variant] - 1} className="px-2 py-1 border-b border-gray-400 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => addRow(item.key, minSlots)}
                      className="text-[10px] py-0.5 h-7"
                    >
                      <Plus size={12} /> Agregar casilla
                    </Button>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
