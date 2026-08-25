import { useEffect, useMemo } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS, SECTION_HEADER_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

export type VisceraCavaRow = {
  id?: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
  codigo?: string;
  c1_fecha?: string;
  c1_hora_inicio?: string;
  c1_hora_final?: string;
  c1_temp?: string | number;
  c2_fecha?: string;
  c2_hora_inicio?: string;
  c2_hora_final?: string;
  c2_temp?: string | number;
  c3_fecha?: string;
  c3_hora_inicio?: string;
  c3_hora_final?: string;
  c3_temp?: string | number;
  observaciones?: string;
};

interface Props {
  options: FieldOptions;
  value: VisceraCavaRow[];
  onChange: (v: VisceraCavaRow[]) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  codigoLabel?: string;
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

function newEmptyRow(): VisceraCavaRow {
  return {
    id: newRowId(),
    ownerUserId: null,
    ownerName: null,
    codigo: '',
    c1_fecha: '',
    c1_hora_inicio: '',
    c1_hora_final: '',
    c1_temp: '',
    c2_fecha: '',
    c2_hora_inicio: '',
    c2_hora_final: '',
    c2_temp: '',
    c3_fecha: '',
    c3_hora_inicio: '',
    c3_hora_final: '',
    c3_temp: '',
    observaciones: '',
  };
}

const CONTENT_KEYS: (keyof VisceraCavaRow)[] = [
  'codigo',
  'c1_fecha',
  'c1_hora_inicio',
  'c1_hora_final',
  'c1_temp',
  'c2_fecha',
  'c2_hora_inicio',
  'c2_hora_final',
  'c2_temp',
  'c3_fecha',
  'c3_hora_inicio',
  'c3_hora_final',
  'c3_temp',
  'observaciones',
];

function rowHasContent(row: VisceraCavaRow): boolean {
  return CONTENT_KEYS.some((k) => String(row[k] ?? '').trim() !== '');
}

function canEditRow(row: VisceraCavaRow, userId?: string, disabled?: boolean): boolean {
  if (disabled || !userId) return false;
  if (!row.ownerUserId) return true;
  return row.ownerUserId === userId;
}

function ControlBlock({
  title,
  row,
  n,
  editable,
  onPatch,
}: {
  title: string;
  row: VisceraCavaRow;
  n: 1 | 2 | 3;
  editable: boolean;
  onPatch: (patch: Partial<VisceraCavaRow>) => void;
}) {
  const fechaKey = `c${n}_fecha` as keyof VisceraCavaRow;
  const hiKey = `c${n}_hora_inicio` as keyof VisceraCavaRow;
  const hfKey = `c${n}_hora_final` as keyof VisceraCavaRow;
  const tempKey = `c${n}_temp` as keyof VisceraCavaRow;

  return (
    <div className="rounded border border-gray-300 bg-white p-2 space-y-2">
      <p className="text-[11px] font-bold uppercase text-gray-800">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-gray-600 space-y-0.5">
          <span>Fecha</span>
          <input
            type="date"
            className={INPUT_CLASS}
            disabled={!editable}
            value={String(row[fechaKey] ?? '')}
            onChange={(e) => onPatch({ [fechaKey]: e.target.value })}
          />
        </label>
        <label className="text-[10px] text-gray-600 space-y-0.5">
          <span>T°</span>
          <input
            type="number"
            step="0.1"
            className={INPUT_CLASS}
            disabled={!editable}
            value={row[tempKey] === undefined || row[tempKey] === null ? '' : String(row[tempKey])}
            onChange={(e) => onPatch({ [tempKey]: e.target.value })}
          />
        </label>
        <label className="text-[10px] text-gray-600 space-y-0.5">
          <span>H. inicio</span>
          <input
            type="time"
            className={INPUT_CLASS}
            disabled={!editable}
            value={String(row[hiKey] ?? '')}
            onChange={(e) => onPatch({ [hiKey]: e.target.value })}
          />
        </label>
        <label className="text-[10px] text-gray-600 space-y-0.5">
          <span>H. final</span>
          <input
            type="time"
            className={INPUT_CLASS}
            disabled={!editable}
            value={String(row[hfKey] ?? '')}
            onChange={(e) => onPatch({ [hfKey]: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

export default function ViscerasCavaRepeater({
  options,
  value,
  onChange,
  disabled,
  currentUserId,
  currentUserName,
  codigoLabel = 'Código víscera',
}: Props) {
  const minRows = options.minRows ?? 5;
  const maxRows = options.maxRows ?? 40;
  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  useEffect(() => {
    if (disabled) return;
    if (rows.length >= minRows) return;
    const padded = [...rows];
    while (padded.length < minRows) padded.push(newEmptyRow());
    onChange(padded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRows, disabled]);

  const updateRow = (index: number, patch: Partial<VisceraCavaRow>) => {
    const row = rows[index];
    if (!canEditRow(row, currentUserId, disabled)) return;

    const next = rows.map((r, i) => {
      if (i !== index) return r;
      const merged: VisceraCavaRow = {
        ...r,
        ...patch,
        id: r.id || newRowId(),
      };
      if (rowHasContent(merged) && currentUserId) {
        merged.ownerUserId = currentUserId;
        merged.ownerName = currentUserName ?? '';
      } else if (!rowHasContent(merged)) {
        merged.ownerUserId = null;
        merged.ownerName = null;
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
        Solo puede editar filas vacías o las que usted llenó. Las de otros colaboradores quedan bloqueadas.
      </p>

      {rows.map((row, index) => {
        const editable = canEditRow(row, currentUserId, disabled);
        const locked = Boolean(row.ownerUserId && row.ownerUserId !== currentUserId);

        return (
          <div
            key={row.id || index}
            className={`border rounded-sm overflow-hidden ${
              locked ? 'border-amber-300 bg-amber-50/40' : 'border-gray-800 bg-white'
            }`}
          >
            <div className={`${SECTION_HEADER_CLASS} flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-gray-900">Item {index + 1}</span>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 truncate">
                    <Lock className="w-3 h-3 shrink-0" />
                    {row.ownerName || 'Otro usuario'}
                  </span>
                )}
                {!locked && row.ownerName && (
                  <span className="text-[11px] text-emerald-700 truncate">Su fila · {row.ownerName}</span>
                )}
              </div>
              {editable && rowHasContent(row) && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Vaciar / quitar fila"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-3 space-y-3">
              <label className="block text-[11px] text-gray-600 space-y-0.5">
                <span>{codigoLabel}</span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  disabled={!editable}
                  value={row.codigo ?? ''}
                  onChange={(e) => updateRow(index, { codigo: e.target.value })}
                  placeholder="Ej. 2605-00457"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <ControlBlock
                  title="T° Control 1"
                  row={row}
                  n={1}
                  editable={editable}
                  onPatch={(p) => updateRow(index, p)}
                />
                <ControlBlock
                  title="T° Control 2"
                  row={row}
                  n={2}
                  editable={editable}
                  onPatch={(p) => updateRow(index, p)}
                />
                <ControlBlock
                  title="T° Control 3"
                  row={row}
                  n={3}
                  editable={editable}
                  onPatch={(p) => updateRow(index, p)}
                />
              </div>

              <label className="block text-[11px] text-gray-600 space-y-0.5">
                <span>Observaciones</span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  disabled={!editable}
                  value={row.observaciones ?? ''}
                  onChange={(e) => updateRow(index, { observaciones: e.target.value })}
                />
              </label>
            </div>
          </div>
        );
      })}

      {!disabled && rows.length < maxRows && (
        <Button type="button" variant="secondary" onClick={addRow} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" />
          {options.addButtonLabel || 'Añadir fila'}
        </Button>
      )}
    </div>
  );
}
