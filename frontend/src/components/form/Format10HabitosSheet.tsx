import type { FormatField, FieldOptions, RepeaterColumn } from '@/types';
import { SECTION_HEADER_CLASS, INPUT_CLASS, showRequiredIndicator } from '@/lib/formUtils';
import FormField from './FormField';

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const EXTERNOS_OPL = 'Externos OPL';

function personasHasAreaColumn(personas: FormatField | undefined): boolean {
  const opts = (personas?.options ?? {}) as FieldOptions;
  const cols = (opts.columns_def ?? opts.columns ?? []) as RepeaterColumn[];
  return cols.some((c) => typeof c === 'object' && c?.key === 'area');
}

function areaEvaluadaLabel(area: string, opl: string): string {
  if (!area) return '';
  if (area === EXTERNOS_OPL && opl) {
    return `Área evaluada: ${area} · OPL externo: ${opl}`;
  }
  return `Área evaluada: ${area}`;
}

export default function Format10HabitosSheet({ fields, sheetData, onUpdate, disabled }: Props) {
  const areaEvaluada = fields.find((f) => f.fieldKey === 'area_evaluada');
  const oplExterno = fields.find((f) => f.fieldKey === 'opl_externo');
  /** Snapshot antiguo: campo área global suelto. */
  const areaGlobalLegacy = fields.find((f) => f.fieldKey === 'area');
  const personas = fields.find((f) => f.fieldKey === 'personas');
  const rowAreaMode = !areaEvaluada && personasHasAreaColumn(personas);

  const areaValue = String(sheetData.area_evaluada ?? '');
  const oplValue = String(sheetData.opl_externo ?? '');
  const showOpl = Boolean(areaEvaluada && areaValue === EXTERNOS_OPL);
  const summary = areaEvaluada ? areaEvaluadaLabel(areaValue, oplValue) : '';

  const areaChoices = ((areaEvaluada?.options as FieldOptions | undefined)?.choices ?? []) as string[];
  const oplChoices = ((oplExterno?.options as FieldOptions | undefined)?.choices ?? []) as string[];

  const setArea = (next: string) => {
    onUpdate('area_evaluada', next);
    if (next !== EXTERNOS_OPL && sheetData.opl_externo) {
      onUpdate('opl_externo', '');
    }
  };

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden space-y-0">
      {areaEvaluada && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2] space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {areaEvaluada.label}
              {showRequiredIndicator(areaEvaluada.required) && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select
              value={areaValue}
              onChange={(e) => setArea(e.target.value)}
              disabled={disabled}
              className={INPUT_CLASS}
            >
              <option value="">Seleccione área…</option>
              {areaChoices.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {showOpl && oplExterno && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {oplExterno.label}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={oplValue}
                onChange={(e) => onUpdate('opl_externo', e.target.value)}
                disabled={disabled}
                className={INPUT_CLASS}
              >
                <option value="">Seleccione OPL externo…</option>
                {oplChoices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {summary && (
            <p className="text-sm font-semibold text-primary-900 border border-primary-200 bg-white rounded px-3 py-2">
              {summary}
            </p>
          )}
        </div>
      )}

      {!areaEvaluada && areaGlobalLegacy && (
        <div className="px-4 py-3 border-b border-gray-800 bg-[#e8edf2]">
          <FormField
            field={areaGlobalLegacy}
            value={sheetData[areaGlobalLegacy.fieldKey]}
            onChange={(v) => onUpdate(areaGlobalLegacy.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}

      {personas && (
        <div>
          <div className={SECTION_HEADER_CLASS}>
            <h3 className="text-xs font-bold uppercase text-gray-900">Personal inspeccionado</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {areaEvaluada
                ? 'Nombre · C / NC / NA — el área aplica a todo el registro'
                : areaGlobalLegacy
                  ? 'C · NC · NA — Agregar filas según personal del área'
                  : rowAreaMode
                    ? 'Nombre · Área por persona · C / NC / NA'
                    : 'Nombre · C / NC / NA'}
            </p>
          </div>
          <FormField
            field={{ ...personas, label: '' }}
            value={sheetData[personas.fieldKey]}
            onChange={(v) => onUpdate(personas.fieldKey, v)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
