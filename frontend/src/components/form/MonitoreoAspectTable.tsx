import { Fragment } from 'react';
import { Plus } from 'lucide-react';
import type { FieldOptions, MeasureRowData } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';
import CncToggle, { CncColumnHeader, type CncChoice } from './CncToggle';
import { cncCellClass, cncHeaderClass } from './repeaterColumns';

type MonitoreoVariant = 'tiempos' | 'sanitario' | 'lavado' | 'temperatura';

type AspectItem = { key: string; label: string; slotCount?: number };

interface Props {
  options: FieldOptions;
  value: Record<string, MeasureRowData | MeasureRowData[]>;
  onChange: (v: Record<string, MeasureRowData | MeasureRowData[]>) => void;
  disabled?: boolean;
}

const HEADER = 'px-2 py-1.5 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#d9ead3]';
const SUB_HEADER = 'px-2 py-1 text-[10px] font-bold uppercase border-r border-gray-800 text-center bg-[#e8f4e8]';
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

function AspectLabel({ label }: { label: string }) {
  return (
    <div className="px-2 py-2 text-[10px] font-bold uppercase text-gray-900 leading-snug text-center whitespace-pre-line">
      {label}
    </div>
  );
}

export default function MonitoreoAspectTable({ options, value, onChange, disabled }: Props) {
  const items = (options.items ?? []) as AspectItem[];
  const variant = (options.monitoreoVariant ?? 'sanitario') as MonitoreoVariant;
  const valorLabel = options.valorLabel ?? 'Valores encontrados';
  const hasValor = variant === 'tiempos' || variant === 'temperatura';
  const twoRowHeader = hasValor;

  const updateEntry = (aspectKey: string, minSlots: number, idx: number, patch: Partial<MeasureRowData>) => {
    const entries = [...normalizeEntries(value[aspectKey], minSlots)];
    entries[idx] = { ...entries[idx], ...patch };
    onChange({ ...value, [aspectKey]: entries });
  };

  const addRow = (aspectKey: string, minSlots: number) => {
    const entries = normalizeEntries(value[aspectKey], minSlots);
    onChange({ ...value, [aspectKey]: [...entries, {}] });
  };

  const fillAllCnc = (choice: CncChoice) => {
    const next: Record<string, MeasureRowData | MeasureRowData[]> = { ...value };
    for (const item of items) {
      const minSlots = item.slotCount ?? 4;
      const entries = normalizeEntries(value[item.key], minSlots).map((row) => ({ ...row, cnc: choice }));
      next[item.key] = entries;
    }
    onChange(next);
  };

  const renderCncCells = (aspectKey: string, minSlots: number, idx: number, row: MeasureRowData) => {
    const cnc = row.cnc ?? '';
    return (['C', 'NC'] as const).map((choice) => (
      <td key={choice} className={`${TD} text-center w-11 px-0.5 ${cncCellClass(choice)}`}>
        <CncToggle
          choice={choice}
          value={cnc}
          disabled={disabled}
          onChange={(v) => updateEntry(aspectKey, minSlots, idx, { cnc: v })}
          compact
        />
      </td>
    ));
  };

  const renderDataRow = (
    aspectKey: string,
    minSlots: number,
    idx: number,
    row: MeasureRowData,
    isFirst: boolean,
    rowSpan: number,
    label: string
  ) => (
    <tr key={`${aspectKey}-r${idx}`} className="bg-white">
      {isFirst && (
        <td rowSpan={rowSpan} className={`${TD} align-middle border-l border-gray-400 w-[140px] min-w-[120px]`}>
          <AspectLabel label={label} />
        </td>
      )}
      <td className={TD}>
        <input
          type="text"
          value={row.turno ?? ''}
          disabled={disabled}
          onChange={(e) => updateEntry(aspectKey, minSlots, idx, { turno: e.target.value })}
          className={`${INPUT_CLASS} text-xs py-1`}
        />
      </td>
      {hasValor && (
        <td className={TD}>
          <input
            type="text"
            value={String(row.valor ?? row.minutos ?? row.temperatura ?? '')}
            disabled={disabled}
            onChange={(e) => updateEntry(aspectKey, minSlots, idx, { valor: e.target.value })}
            className={`${INPUT_CLASS} text-xs py-1`}
          />
        </td>
      )}
      {renderCncCells(aspectKey, minSlots, idx, row)}
      <td className={`${TD} min-w-[120px]`}>
        <input
          type="text"
          value={row.observation ?? ''}
          disabled={disabled}
          onChange={(e) => updateEntry(aspectKey, minSlots, idx, { observation: e.target.value })}
          className={`${INPUT_CLASS} text-xs py-1`}
        />
      </td>
    </tr>
  );

  const procesoGroupLabel =
    variant === 'temperatura' ? 'Condiciones de proceso — temperatura' : 'Condiciones de proceso';

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px] border-collapse border border-gray-800">
          <thead>
            {twoRowHeader ? (
              <>
                <tr className="border-b border-gray-800">
                  <th className={`${HEADER} text-left`} rowSpan={2}>
                    Aspecto a verificar
                  </th>
                  <th className={HEADER} colSpan={2}>
                    {procesoGroupLabel}
                  </th>
                  <th className={`${HEADER} w-11`} rowSpan={2}>
                    <button
                      type="button"
                      disabled={disabled}
                      title="Marcar todos como Cumple (C). Luego puede cambiar cada fila."
                      onClick={() => fillAllCnc('C')}
                      className="w-full font-bold uppercase hover:underline disabled:opacity-50"
                    >
                      C
                    </button>
                  </th>
                  <th className={`${HEADER} w-11`} rowSpan={2}>
                    <button
                      type="button"
                      disabled={disabled}
                      title="Marcar todos como No cumple (NC). Luego puede cambiar cada fila."
                      onClick={() => fillAllCnc('NC')}
                      className="w-full font-bold uppercase hover:underline disabled:opacity-50"
                    >
                      NC
                    </button>
                  </th>
                  <th className={`${HEADER} text-left min-w-[120px]`} rowSpan={2}>
                    Observaciones
                  </th>
                </tr>
                <tr className="border-b-2 border-gray-800">
                  <th className={SUB_HEADER}>Turno monitoreo</th>
                  <th className={SUB_HEADER}>{valorLabel}</th>
                </tr>
              </>
            ) : (
              <tr className="border-b-2 border-gray-800">
                <th className={`${HEADER} text-left w-[140px]`}>Aspecto a verificar</th>
                <th className={SUB_HEADER}>Turno monitoreo</th>
                <CncColumnHeader
                  choice="C"
                  disabled={disabled}
                  onFillAll={fillAllCnc}
                  className={`${HEADER} w-11 ${cncHeaderClass('C')}`}
                />
                <CncColumnHeader
                  choice="NC"
                  disabled={disabled}
                  onFillAll={fillAllCnc}
                  className={`${HEADER} w-11 ${cncHeaderClass('NC')}`}
                />
                <th className={`${HEADER} text-left min-w-[120px]`}>Observaciones</th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item) => {
              const minSlots = item.slotCount ?? 4;
              const entries = normalizeEntries(value[item.key], minSlots);
              return (
                <Fragment key={item.key}>
                  {entries.map((row, idx) =>
                    renderDataRow(item.key, minSlots, idx, row, idx === 0, entries.length, item.label)
                  )}
                  <tr className="bg-gray-50">
                    <td colSpan={hasValor ? 5 : 4} className="px-2 py-1 border-b border-gray-400 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => addRow(item.key, minSlots)}
                        className="text-[10px] py-0.5 h-7"
                      >
                        <Plus size={12} /> Agregar casilla
                        {entries.length > minSlots ? ` (${entries.length} filas)` : ''}
                      </Button>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
