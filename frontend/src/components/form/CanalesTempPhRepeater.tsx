import { useEffect, useMemo, useRef } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

export type CanalesTempPhRow = {
  id?: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
  codigo?: string;
  temp_c1?: string;
  temp_c2?: string;
  temp_c3?: string;
  temp_c4?: string;
  temp_liberacion?: string;
  ph?: string;
};

const ROW_FIELDS: { key: keyof CanalesTempPhRow; label: string; minW?: string }[] = [
  { key: 'codigo', label: 'Código', minW: 'min-w-[120px]' },
  { key: 'temp_c1', label: 'Ctrl 1', minW: 'min-w-[72px]' },
  { key: 'temp_c2', label: 'Ctrl 2', minW: 'min-w-[72px]' },
  { key: 'temp_c3', label: 'Ctrl 3', minW: 'min-w-[72px]' },
  { key: 'temp_c4', label: 'Ctrl 4', minW: 'min-w-[72px]' },
  { key: 'temp_liberacion', label: 'T° despacho', minW: 'min-w-[90px]' },
  { key: 'ph', label: 'pH', minW: 'min-w-[64px]' },
];

interface Props {
  options: FieldOptions;
  value: CanalesTempPhRow[];
  onChange: (v: CanalesTempPhRow[]) => void;
  disabled?: boolean;
  currentUserId?: string;
  currentUserName?: string;
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

function newEmptyRow(): CanalesTempPhRow {
  return {
    id: newRowId(),
    ownerUserId: null,
    ownerName: null,
    codigo: '',
    temp_c1: '',
    temp_c2: '',
    temp_c3: '',
    temp_c4: '',
    temp_liberacion: '',
    ph: '',
  };
}

function rowHasContent(row: CanalesTempPhRow): boolean {
  return ROW_FIELDS.some((f) => String(row[f.key] ?? '').trim() !== '');
}

function canEditRow(row: CanalesTempPhRow, userId?: string, disabled?: boolean): boolean {
  if (disabled || !userId) return false;
  if (!row.ownerUserId) return true;
  return row.ownerUserId === userId;
}

export default function CanalesTempPhRepeater({
  options,
  value,
  onChange,
  disabled,
  currentUserId,
  currentUserName,
}: Props) {
  const minRows = options.minRows ?? 5;
  const maxRows = options.maxRows ?? 48;
  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const hasPaddedOnceRef = useRef(false);

  useEffect(() => {
    if (disabled) return;
    // Solo inicializamos filas vacías cuando el repetidor viene vacío.
    // Así el usuario puede eliminar filas vacías sin que el sistema las vuelva a crear.
    if (hasPaddedOnceRef.current) return;
    if (rows.length !== 0) return;

    const padded = [...rows];
    while (padded.length < minRows) padded.push(newEmptyRow());
    hasPaddedOnceRef.current = true;
    onChange(padded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRows, disabled, rows.length]);

  const updateRow = (index: number, patch: Partial<CanalesTempPhRow>) => {
    const row = rows[index];
    if (!canEditRow(row, currentUserId, disabled)) return;

    const next = rows.map((r, i) => {
      if (i !== index) return r;
      const merged: CanalesTempPhRow = { ...r, ...patch, id: r.id || newRowId() };
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
    // Puedes eliminar filas vacías siempre.
    // Si la fila tiene contenido, solo se elimina si hay más de minRows.
    if (rowHasContent(row) && rows.length <= minRows) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {options.note && (
        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">
          {options.note}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Solo puede editar filas vacías o las que usted llenó. Numeración automática por fila.
      </p>

      <div className="overflow-x-auto border border-gray-800 rounded-sm">
        <table className="w-full text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-emerald-100/80">
              <th className="border border-gray-400 px-2 py-1.5 text-left font-bold w-10">N°</th>
              {ROW_FIELDS.map((f) => (
                <th key={f.key} className={`border border-gray-400 px-2 py-1.5 text-left font-bold ${f.minW}`}>
                  {f.label}
                </th>
              ))}
              <th className="border border-gray-400 px-1 py-1.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const editable = canEditRow(row, currentUserId, disabled);
              const locked = Boolean(row.ownerUserId && row.ownerUserId !== currentUserId);

              return (
                <tr key={row.id || index} className={locked ? 'bg-amber-50/60' : 'bg-white'}>
                  <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <span>{index + 1}</span>
                      {locked && (
                        <span title={row.ownerName || 'Otro usuario'} className="inline-flex">
                          <Lock className="w-3 h-3 text-amber-800" />
                        </span>
                      )}
                    </div>
                  </td>
                  {ROW_FIELDS.map((f) => (
                    <td key={f.key} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        className={`${INPUT_CLASS} text-xs py-1`}
                        disabled={!editable}
                        value={String(row[f.key] ?? '')}
                        onChange={(e) => updateRow(index, { [f.key]: e.target.value })}
                        placeholder={f.label}
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 p-1 text-center">
                    {editable && (!rowHasContent(row) || rows.length > minRows) && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Quitar fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!disabled && rows.length < maxRows && (
        <Button type="button" variant="secondary" onClick={addRow} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" />
          {options.addButtonLabel || 'Añadir fila'}
        </Button>
      )}
    </div>
  );
}
