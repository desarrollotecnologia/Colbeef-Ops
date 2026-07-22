import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS, SECTION_HEADER_CLASS, showRequiredIndicator } from '@/lib/formUtils';
import Button from '@/components/Button';
import { CardCell, getCardRepeaterColumns } from './CardRepeater';

export type LoteBlock = {
  lote?: string;
  registros?: Record<string, unknown>[];
};

interface Props {
  options: FieldOptions;
  value: LoteBlock[];
  onChange: (v: LoteBlock[]) => void;
  disabled?: boolean;
}

function emptyLote(): LoteBlock {
  return { lote: '', registros: [{}] };
}

function normalizeLotes(value: LoteBlock[], minLotes: number): LoteBlock[] {
  const rows: LoteBlock[] = Array.isArray(value)
    ? value.map((l) => ({
        lote: String(l?.lote ?? ''),
        registros:
          Array.isArray(l?.registros) && l.registros.length > 0
            ? l.registros.map((r) => ({ ...r }))
            : [{}],
      }))
    : [];
  while (rows.length < minLotes) rows.push(emptyLote());
  return rows;
}

export default function ProductoTerminadoLotesRepeater({ options, value, onChange, disabled }: Props) {
  const columns = getCardRepeaterColumns(options);
  const minLotes = options.minLotes ?? 4;
  const maxLotes = options.maxLotes ?? 4;
  const minRegistros = options.minRegistros ?? 1;
  const maxRegistros = options.maxRegistros ?? 20;
  const lotes = normalizeLotes(value, minLotes);

  const commit = (next: LoteBlock[]) => onChange(next);

  const updateLoteField = (loteIdx: number, lote: string) => {
    const next = [...lotes];
    next[loteIdx] = { ...next[loteIdx], lote };
    commit(next);
  };

  const updateRegistro = (loteIdx: number, regIdx: number, key: string, val: unknown) => {
    const next = [...lotes];
    const regs = [...(next[loteIdx].registros ?? [{}])];
    regs[regIdx] = { ...regs[regIdx], [key]: val };
    next[loteIdx] = { ...next[loteIdx], registros: regs };
    commit(next);
  };

  const addRegistro = (loteIdx: number) => {
    const regs = lotes[loteIdx].registros ?? [{}];
    if (regs.length >= maxRegistros) return;
    const next = [...lotes];
    next[loteIdx] = { ...next[loteIdx], registros: [...regs, {}] };
    commit(next);
  };

  const removeRegistro = (loteIdx: number, regIdx: number) => {
    const regs = lotes[loteIdx].registros ?? [{}];
    if (regs.length <= minRegistros) return;
    const next = [...lotes];
    next[loteIdx] = { ...next[loteIdx], registros: regs.filter((_, i) => i !== regIdx) };
    commit(next);
  };

  return (
    <div className="space-y-0">
      {lotes.map((lote, loteIdx) => {
        const registros = lote.registros ?? [{}];
        return (
          <div key={loteIdx} className="border-b border-gray-800">
            <div className={SECTION_HEADER_CLASS}>
              <h3 className="text-xs font-bold uppercase text-gray-900">Registro de lote {loteIdx + 1}</h3>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Dentro de este lote puede agregar más registros con la misma estructura
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="max-w-sm">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lote
                  {showRequiredIndicator(true) && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={String(lote.lote ?? '')}
                  onChange={(e) => updateLoteField(loteIdx, e.target.value)}
                  disabled={disabled}
                  className={INPUT_CLASS}
                  placeholder="Número de lote"
                />
              </div>

              {registros.map((row, regIdx) => (
                <div key={regIdx} className="border border-gray-300 rounded-md overflow-hidden bg-white">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs font-bold uppercase text-gray-700">Registro {regIdx + 1}</span>
                    {!disabled && registros.length > minRegistros && (
                      <button
                        type="button"
                        onClick={() => removeRegistro(loteIdx, regIdx)}
                        className="text-red-500 p-1 hover:bg-red-50 rounded"
                        title="Eliminar registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {columns.map((col) => {
                      const isWide = col.type === 'TEXTAREA' || col.type === 'MULTI_SELECT';
                      return (
                        <div key={col.key} className={isWide ? 'sm:col-span-2 lg:col-span-3' : ''}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {col.label}
                            {showRequiredIndicator(col.required) && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </label>
                          <CardCell
                            col={col}
                            value={row[col.key]}
                            onChange={(v) => updateRegistro(loteIdx, regIdx, col.key, v)}
                            disabled={disabled}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!disabled && registros.length < maxRegistros && (
                <Button type="button" variant="outline" size="sm" onClick={() => addRegistro(loteIdx)}>
                  <Plus size={14} /> Agregar registro
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {maxLotes > minLotes && !disabled && lotes.length < maxLotes && (
        <div className="px-3 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => commit([...lotes, emptyLote()])}
          >
            <Plus size={14} /> Agregar lote
          </Button>
        </div>
      )}
    </div>
  );
}
