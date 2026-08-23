import { useEffect, useMemo } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

export type PediluvioCambioRow = {
  id?: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
  fecha?: string;
  hora?: string;
  desinfectante?: string;
  concentracion_ppm?: string | number;
  num_pediluvios?: string | number;
  responsable?: string;
  observaciones?: string;
};

interface Props {
  options: FieldOptions;
  value: PediluvioCambioRow[];
  onChange: (v: PediluvioCambioRow[]) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
}

function newEmptyRow(): PediluvioCambioRow {
  return {
    id: crypto.randomUUID(),
    ownerUserId: null,
    ownerName: null,
    fecha: '',
    hora: '',
    desinfectante: '',
    concentracion_ppm: '',
    num_pediluvios: 2,
    responsable: '',
    observaciones: '',
  };
}

function rowHasContent(row: PediluvioCambioRow): boolean {
  return Boolean(
    String(row.fecha ?? '').trim() ||
      String(row.hora ?? '').trim() ||
      String(row.desinfectante ?? '').trim() ||
      String(row.concentracion_ppm ?? '').trim() ||
      String(row.observaciones ?? '').trim()
  );
}

function canEditRow(row: PediluvioCambioRow, userId?: string, disabled?: boolean): boolean {
  if (disabled || !userId) return false;
  if (!row.ownerUserId) return true;
  return row.ownerUserId === userId;
}

export default function PediluviosCambiosRepeater({
  options,
  value,
  onChange,
  disabled,
  currentUserId,
  currentUserName,
}: Props) {
  const minRows = options.minRows ?? 5;
  const maxRows = options.maxRows ?? 60;

  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  useEffect(() => {
    if (disabled) return;
    if (rows.length >= minRows) return;
    const padded = [...rows];
    while (padded.length < minRows) padded.push(newEmptyRow());
    onChange(padded);
    // Solo al montar / si faltan filas iniciales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRows, disabled]);

  const updateRow = (index: number, patch: Partial<PediluvioCambioRow>) => {
    const row = rows[index];
    if (!canEditRow(row, currentUserId, disabled)) return;

    const next = rows.map((r, i) => {
      if (i !== index) return r;
      const merged: PediluvioCambioRow = {
        ...r,
        ...patch,
        id: r.id || crypto.randomUUID(),
        num_pediluvios: 2,
      };
      if (rowHasContent(merged) && currentUserId) {
        merged.ownerUserId = currentUserId;
        merged.ownerName = currentUserName ?? '';
        merged.responsable = currentUserName ?? '';
      } else if (!rowHasContent(merged)) {
        merged.ownerUserId = null;
        merged.ownerName = null;
        merged.responsable = '';
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
    if (!canEditRow(row, currentUserId, disabled)) return;
    if (rows.length <= minRows && !rowHasContent(row)) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Solo puede editar las filas que usted llene. Las de otros colaboradores quedan bloqueadas.
        N° pediluvios = 2 (automático). Observaciones: Operativo o Preoperativo.
      </p>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-emerald-50 text-left">
              <th className="px-2 py-2 font-semibold border-b">Fecha</th>
              <th className="px-2 py-2 font-semibold border-b">Hora</th>
              <th className="px-2 py-2 font-semibold border-b">Desinfectante</th>
              <th className="px-2 py-2 font-semibold border-b w-24">Conc. (ppm)</th>
              <th className="px-2 py-2 font-semibold border-b w-16">N°</th>
              <th className="px-2 py-2 font-semibold border-b">Responsable</th>
              <th className="px-2 py-2 font-semibold border-b">Observaciones</th>
              <th className="px-2 py-2 font-semibold border-b w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const editable = canEditRow(row, currentUserId, disabled);
              const locked = Boolean(row.ownerUserId && row.ownerUserId !== currentUserId);
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
                    <input
                      type="text"
                      className={`${INPUT_CLASS} text-xs py-1`}
                      placeholder="Desinfectante"
                      value={String(row.desinfectante ?? '')}
                      disabled={!editable}
                      onChange={(e) => updateRow(index, { desinfectante: e.target.value })}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={`${INPUT_CLASS} text-xs py-1 text-center`}
                      value={
                        row.concentracion_ppm !== undefined && row.concentracion_ppm !== null
                          ? String(row.concentracion_ppm)
                          : ''
                      }
                      disabled={!editable}
                      onChange={(e) => updateRow(index, { concentracion_ppm: e.target.value })}
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <input
                      type="text"
                      className={`${INPUT_CLASS} text-xs py-1 text-center bg-slate-100`}
                      value="2"
                      readOnly
                      disabled
                      title="Automático"
                    />
                  </td>
                  <td className="px-1.5 py-1">
                    <div className="flex items-center gap-1">
                      {locked && <Lock size={12} className="text-slate-400 shrink-0" />}
                      <input
                        type="text"
                        className={`${INPUT_CLASS} text-xs py-1 bg-slate-100`}
                        value={String(row.responsable || row.ownerName || '')}
                        readOnly
                        disabled
                        placeholder={editable ? 'Se asigna al guardar' : '—'}
                      />
                    </div>
                  </td>
                  <td className="px-1.5 py-1">
                    <select
                      className={`${INPUT_CLASS} text-xs py-1`}
                      value={String(row.observaciones ?? '')}
                      disabled={!editable}
                      onChange={(e) => updateRow(index, { observaciones: e.target.value })}
                    >
                      <option value="">—</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Preoperativo">Preoperativo</option>
                    </select>
                  </td>
                  <td className="px-1 py-1 text-center">
                    {editable && !disabled && (
                      <button
                        type="button"
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Quitar fila"
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
    </div>
  );
}
