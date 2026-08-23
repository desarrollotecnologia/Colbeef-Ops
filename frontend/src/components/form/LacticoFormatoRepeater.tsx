import { useEffect, useMemo } from 'react';
import { Check, Plus, Trash2, Lock, X } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

const LACTICO_MAP: Record<string, string> = { '2.2': '1.98', '2.3': '2.07' };

export type LacticoRow = {
  id?: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
  fecha?: string;
  hora?: string;
  volumen_naoh?: string;
  concentracion?: string;
  cumple?: string;
  no_cumple?: string;
  correccion?: string;
  actividad?: string;
  monitoreo_pcc?: string;
  responsable?: string;
  verifico_mark?: string;
  verifico_nombre?: string;
};

interface Props {
  options: FieldOptions;
  value: LacticoRow[];
  onChange: (v: LacticoRow[]) => void;
  disabled?: boolean;
  variant: 'titulacion' | 'monitoreo';
  currentUserId?: string;
  currentUserName?: string;
  /** Dueño del envío (quien verifica filas y entrega). */
  isSubmissionOwner?: boolean;
  ownerName?: string;
}

function newRowId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function newEmptyRow(): LacticoRow {
  return {
    id: newRowId(),
    ownerUserId: null,
    ownerName: null,
    fecha: '',
    hora: '',
    volumen_naoh: '',
    concentracion: '',
    cumple: '',
    no_cumple: '',
    correccion: '',
    actividad: '',
    monitoreo_pcc: '',
    responsable: '',
    verifico_mark: '',
    verifico_nombre: '',
  };
}

function rowHasContent(row: LacticoRow): boolean {
  return Boolean(
    String(row.fecha ?? '').trim() ||
      String(row.hora ?? '').trim() ||
      String(row.volumen_naoh ?? '').trim() ||
      String(row.cumple ?? '').trim() ||
      String(row.no_cumple ?? '').trim() ||
      String(row.correccion ?? '').trim() ||
      String(row.actividad ?? '').trim() ||
      String(row.monitoreo_pcc ?? '').trim()
  );
}

function canEditData(row: LacticoRow, userId?: string, disabled?: boolean): boolean {
  if (disabled || !userId) return false;
  if (!row.ownerUserId) return true;
  return row.ownerUserId === userId;
}

function MarkCell({
  active,
  label,
  disabled,
  onClick,
  tone = 'green',
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: 'green' | 'red' | 'slate';
}) {
  const activeClass =
    tone === 'red'
      ? 'bg-red-600 text-white border-red-600'
      : tone === 'slate'
        ? 'bg-slate-700 text-white border-slate-700'
        : 'bg-emerald-600 text-white border-emerald-600';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={active ? `Quitar ${label}` : `Marcar ${label}`}
      className={`w-full min-h-[28px] py-1 text-xs font-bold rounded border-2 ${
        active ? activeClass : 'bg-white border-gray-300 text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

export default function LacticoFormatoRepeater({
  options,
  value,
  onChange,
  disabled,
  variant,
  currentUserId,
  currentUserName,
  isSubmissionOwner,
  ownerName,
}: Props) {
  const minRows = options.minRows ?? 5;
  const maxRows = options.maxRows ?? 40;
  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const formula =
    options.formulaFooter ||
    'Fórmula: % Ácido láctico = V × N × #eq × 100. Constantes: N = 0,1 y #eq = 0,09.';

  useEffect(() => {
    if (disabled) return;
    if (rows.length >= minRows) return;
    const padded = [...rows];
    while (padded.length < minRows) padded.push(newEmptyRow());
    onChange(padded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRows, disabled]);

  const updateRow = (index: number, patch: Partial<LacticoRow>, opts?: { verificoOnly?: boolean }) => {
    const row = rows[index];
    if (opts?.verificoOnly) {
      if (disabled || !isSubmissionOwner) return;
    } else if (!canEditData(row, currentUserId, disabled)) {
      return;
    }

    const next = rows.map((r, i) => {
      if (i !== index) return r;
      let merged: LacticoRow = {
        ...r,
        ...patch,
        id: r.id || newRowId(),
      };

      if (patch.volumen_naoh !== undefined) {
        const mapped = LACTICO_MAP[String(patch.volumen_naoh)] ?? '';
        merged.concentracion = mapped ? `${mapped}%` : '';
      }

      // Cumple / No cumple excluyentes
      if (patch.cumple === 'C') merged.no_cumple = '';
      if (patch.no_cumple === 'NC') merged.cumple = '';

      if (opts?.verificoOnly || patch.verifico_mark !== undefined) {
        const mark = String(merged.verifico_mark ?? '');
        if (mark === 'OK') {
          merged.verifico_nombre = ownerName || currentUserName || '';
        } else {
          merged.verifico_nombre = '';
        }
      }

      if (!opts?.verificoOnly) {
        if (rowHasContent(merged) && currentUserId) {
          merged.ownerUserId = currentUserId;
          merged.ownerName = currentUserName ?? '';
          merged.responsable = currentUserName ?? '';
        } else if (!rowHasContent(merged)) {
          merged.ownerUserId = null;
          merged.ownerName = null;
          merged.responsable = '';
          merged.verifico_mark = '';
          merged.verifico_nombre = '';
        }
      }
      return merged;
    });
    onChange(next);
  };

  const addRow = () => {
    if (disabled || rows.length >= maxRows) return;
    onChange([...rows, newEmptyRow()]);
  };

  const removeRow = (index: number) => {
    const row = rows[index];
    if (!canEditData(row, currentUserId, disabled)) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Cumple y No cumple son columnas separadas (excluyentes). Concentración se calcula con la fórmula.
        Solo edita sus filas
        {variant === 'monitoreo'
          ? '; quien inició verifica cada fila (✓ nombre automático / ✗ sin nombre) y es quien entrega.'
          : '.'}
      </p>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full text-xs min-w-[980px]">
          <thead>
            <tr className="bg-emerald-50 text-left">
              <th className="px-2 py-2 font-semibold border-b">Fecha</th>
              <th className="px-2 py-2 font-semibold border-b">Hora</th>
              <th className="px-2 py-2 font-semibold border-b">Vol. NaOH (ml)</th>
              <th className="px-2 py-2 font-semibold border-b">Concentración</th>
              <th className="px-2 py-2 font-semibold border-b w-16">Cumple</th>
              <th className="px-2 py-2 font-semibold border-b w-16">No cumple</th>
              <th className="px-2 py-2 font-semibold border-b">Corrección</th>
              {variant === 'titulacion' ? (
                <th className="px-2 py-2 font-semibold border-b">Actividad</th>
              ) : (
                <th className="px-2 py-2 font-semibold border-b w-20">Monitoreo PCC</th>
              )}
              <th className="px-2 py-2 font-semibold border-b">Responsable</th>
              {variant === 'monitoreo' && (
                <th className="px-2 py-2 font-semibold border-b min-w-[140px]">Verificó</th>
              )}
              <th className="px-2 py-2 font-semibold border-b w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const editable = canEditData(row, currentUserId, disabled);
              const locked = Boolean(row.ownerUserId && row.ownerUserId !== currentUserId);
              const canVerify = Boolean(isSubmissionOwner && !disabled && rowHasContent(row));
              return (
                <tr
                  key={row.id ?? index}
                  className={`border-b border-gray-100 ${locked ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <td className="px-1.5 py-1">
                    <input
                      type="date"
                      className={`${INPUT_CLASS} text-xs py-1`}
                      value={String(row.fecha ?? '')}
                      disabled={!editable}
                      onChange={(e) => updateRow(index, { fecha: e.target.value })}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="time"
                      className={`${INPUT_CLASS} text-xs py-1`}
                      value={String(row.hora ?? '')}
                      disabled={!editable}
                      onChange={(e) => updateRow(index, { hora: e.target.value })}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <select
                      className={`${INPUT_CLASS} text-xs py-1`}
                      value={String(row.volumen_naoh ?? '')}
                      disabled={!editable}
                      onChange={(e) => updateRow(index, { volumen_naoh: e.target.value })}
                    >
                      <option value="">—</option>
                      <option value="2.2">2.2</option>
                      <option value="2.3">2.3</option>
                    </select>
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="text"
                      className={`${INPUT_CLASS} text-xs py-1 bg-slate-100 text-center`}
                      value={String(row.concentracion ?? '')}
                      readOnly
                      disabled
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <MarkCell
                      label="C"
                      active={row.cumple === 'C'}
                      disabled={!editable}
                      onClick={() =>
                        updateRow(index, { cumple: row.cumple === 'C' ? '' : 'C', no_cumple: '' })
                      }
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <MarkCell
                      label="NC"
                      tone="red"
                      active={row.no_cumple === 'NC'}
                      disabled={!editable}
                      onClick={() =>
                        updateRow(index, {
                          no_cumple: row.no_cumple === 'NC' ? '' : 'NC',
                          cumple: '',
                        })
                      }
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="text"
                      className={`${INPUT_CLASS} text-xs py-1`}
                      value={String(row.correccion ?? '')}
                      disabled={!editable}
                      placeholder={row.no_cumple === 'NC' ? 'Obligatoria si NC' : '—'}
                      onChange={(e) => updateRow(index, { correccion: e.target.value })}
                    />
                  </td>
                  {variant === 'titulacion' ? (
                    <td className="px-1.5 py-1">
                      <select
                        className={`${INPUT_CLASS} text-xs py-1`}
                        value={String(row.actividad ?? '')}
                        disabled={!editable}
                        onChange={(e) => updateRow(index, { actividad: e.target.value })}
                      >
                        <option value="">—</option>
                        <option value="Operativo">Operativo</option>
                        <option value="Preoperativo">Preoperativo</option>
                      </select>
                    </td>
                  ) : (
                    <td className="px-1.5 py-1">
                      <MarkCell
                        label="X"
                        tone="slate"
                        active={row.monitoreo_pcc === 'X'}
                        disabled={!editable}
                        onClick={() =>
                          updateRow(index, {
                            monitoreo_pcc: row.monitoreo_pcc === 'X' ? '' : 'X',
                          })
                        }
                      />
                    </td>
                  )}
                  <td className="px-1.5 py-1">
                    <div className="flex items-center gap-1">
                      {locked && <Lock size={12} className="text-slate-400 shrink-0" />}
                      <input
                        type="text"
                        className={`${INPUT_CLASS} text-xs py-1 bg-slate-100`}
                        value={String(row.responsable || row.ownerName || '')}
                        readOnly
                        disabled
                      />
                    </div>
                  </td>
                  {variant === 'monitoreo' && (
                    <td className="px-1.5 py-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={!canVerify}
                            title="Conforme — pone el nombre de quien inició"
                            onClick={() =>
                              updateRow(
                                index,
                                { verifico_mark: row.verifico_mark === 'OK' ? '' : 'OK' },
                                { verificoOnly: true }
                              )
                            }
                            className={`flex-1 min-h-[28px] rounded border-2 flex items-center justify-center ${
                              row.verifico_mark === 'OK'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={!canVerify}
                            title="No conforme"
                            onClick={() =>
                              updateRow(
                                index,
                                { verifico_mark: row.verifico_mark === 'X' ? '' : 'X' },
                                { verificoOnly: true }
                              )
                            }
                            className={`flex-1 min-h-[28px] rounded border-2 flex items-center justify-center ${
                              row.verifico_mark === 'X'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          className={`${INPUT_CLASS} text-[10px] py-0.5 bg-slate-100`}
                          value={String(row.verifico_nombre ?? '')}
                          readOnly
                          disabled
                          placeholder={isSubmissionOwner ? '✓ = su nombre' : 'Solo el dueño'}
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-1 py-1 text-center">
                    {editable && !disabled && (
                      <button
                        type="button"
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        onClick={() => removeRow(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <Button variant="outline" size="sm" onClick={addRow} disabled={rows.length >= maxRows}>
          <Plus size={16} /> {options.addButtonLabel ?? 'Añadir fila'}
        </Button>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 space-y-1">
        <p>
          <strong>C:</strong> Cumple &nbsp; <strong>NC:</strong> No cumple
        </p>
        <p>{formula}</p>
        {variant === 'monitoreo' && (
          <p>Rango aceptable de concentración: 1,9% a 2,1%.</p>
        )}
      </div>
    </div>
  );
}
