import { Plus, Trash2 } from 'lucide-react';
import type { FieldOptions } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import Button from '@/components/Button';

type MatrixValue = Record<string, { hora: string; temperatura: string; observaciones: string }[]>;

interface Props {
  options: FieldOptions;
  value: MatrixValue;
  onChange: (v: MatrixValue) => void;
  disabled?: boolean;
}

function calcProm(readings: MatrixValue[string]): string {
  const nums = (readings ?? [])
    .map((r) => parseFloat(r.temperatura))
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return '—';
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

export default function MatrixField({ options, value, onChange, disabled }: Props) {
  const rows = options.rows ?? [];
  const showProm = options.showProm ?? false;

  const updateRow = (area: string, idx: number, key: string, val: string) => {
    const readings = [...(value[area] ?? [])];
    readings[idx] = { ...readings[idx], [key]: val } as MatrixValue[string][0];
    onChange({ ...value, [area]: readings });
  };

  const addReading = (area: string) => {
    const readings = [...(value[area] ?? []), { hora: '', temperatura: '', observaciones: '' }];
    onChange({ ...value, [area]: readings });
  };

  const removeReading = (area: string, idx: number) => {
    const readings = (value[area] ?? []).filter((_, i) => i !== idx);
    onChange({ ...value, [area]: readings });
  };

  return (
    <div className="space-y-6">
      {options.note && (
        <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          {options.note}
        </p>
      )}
      {rows.map((area) => {
        const readings = value[area] ?? [{ hora: '', temperatura: '', observaciones: '' }];
        return (
          <div key={area} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-primary-50 px-4 py-2 flex items-center justify-between">
              <span className="font-medium text-sm text-primary-900">{area}</span>
              {showProm && (
                <span className="text-xs text-primary-700 font-semibold">
                  PROM: {calcProm(readings)} °C
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {readings.map((reading, idx) => (
                <div key={idx} className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[100px]">
                    <label className="text-xs text-gray-500">Hora</label>
                    <input
                      type="time"
                      value={reading.hora}
                      onChange={(e) => updateRow(area, idx, 'hora', e.target.value)}
                      disabled={disabled}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <label className="text-xs text-gray-500">Temp °C</label>
                    <input
                      type="number"
                      step="0.1"
                      value={reading.temperatura}
                      onChange={(e) => updateRow(area, idx, 'temperatura', e.target.value)}
                      disabled={disabled}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="flex-[2] min-w-[140px]">
                    <label className="text-xs text-gray-500">Observaciones</label>
                    <input
                      type="text"
                      value={reading.observaciones}
                      onChange={(e) => updateRow(area, idx, 'observaciones', e.target.value)}
                      disabled={disabled}
                      className={INPUT_CLASS}
                    />
                  </div>
                  {!disabled && readings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReading(area, idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {!disabled && (
                <Button type="button" variant="outline" size="sm" onClick={() => addReading(area)}>
                  <Plus size={14} /> Agregar lectura
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
