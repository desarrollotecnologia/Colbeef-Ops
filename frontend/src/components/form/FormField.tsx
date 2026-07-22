import type { ChecklistItemData, FormatField, RepeaterColumn } from '@/types';
import { INPUT_CLASS, isTemperatureInput, showRequiredIndicator } from '@/lib/formUtils';
import { isAutoField } from '@/lib/autoFill';
import ChoiceButtons from './ChoiceButtons';
import ItemChecklist from './ItemChecklist';
import MatrixField from './MatrixField';
import RepeaterField from './RepeaterField';
import FormalRepeaterTable from './FormalRepeaterTable';
import CloroResidualRepeater from './CloroResidualRepeater';
import LacticoTitrationRepeater from './LacticoTitrationRepeater';
import CardRepeater from './CardRepeater';
import AutoValue from './AutoValue';
import PhotoInput from './PhotoInput';
import PcInocuidadRepeater from './PcInocuidadRepeater';

interface Props {
  field: FormatField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  compact?: boolean;
}

function FieldLabel({ field, show }: { field: FormatField; show: boolean }) {
  if (!show || !field.label) return null;
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {showRequiredIndicator(field.required) && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export default function FormField({ field, value, onChange, disabled, compact }: Props) {
  const opts = field.options ?? {};
  const isReadonly = disabled || field.fieldType === 'READONLY' || field.fieldType === 'AUTO';
  const showLabel = !compact;

  if (isAutoField(field)) {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <AutoValue field={field} value={value} />
      </div>
    );
  }

  if (field.fieldType === 'CHECKLIST' && opts.items) {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        {field.helpText && <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>}
        <ItemChecklist
          options={opts}
          value={(value as Record<string, ChecklistItemData>) ?? {}}
          onChange={onChange}
          disabled={disabled}
          tableMode
        />
      </div>
    );
  }

  if (field.fieldType === 'CHECKLIST') {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <ChoiceButtons
          choices={opts.choices ?? ['C', 'NC']}
          value={String(value ?? '')}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.fieldType === 'RADIO') {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <ChoiceButtons
          choices={opts.choices ?? []}
          value={String(value ?? '')}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.fieldType === 'SELECT') {
    const choices = opts.choices ?? [];
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={INPUT_CLASS}
        >
          <option value="">Seleccione...</option>
          {choices.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.fieldType === 'MULTI_SELECT') {
    const choices = opts.choices ?? [];
    const selected = Array.isArray(value)
      ? (value as string[])
      : typeof value === 'string' && value
        ? [value]
        : [];
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <div className="flex flex-wrap gap-2">
          {choices.map((c) => {
            const active = selected.includes(c);
            return (
              <button
                key={c}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = active ? selected.filter((s) => s !== c) : [...selected, c];
                  onChange(next);
                }}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.fieldType === 'REPEATER' && opts.matrix) {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        {field.helpText && <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>}
        <MatrixField
          options={{ ...opts, note: field.helpText }}
          value={(value as Record<string, { hora: string; temperatura: string; observaciones: string }[]>) ?? {}}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.fieldType === 'REPEATER') {
    const columnsDef = Array.isArray(opts.columns) && opts.columns[0] && typeof opts.columns[0] === 'object'
      ? (opts.columns as RepeaterColumn[])
      : [];
    const repeaterOpts = { ...opts, columns_def: columnsDef };
    const repeaterValue = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        {field.helpText && <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>}
        {opts.layout === 'cloro_residual_repeater' ? (
          <CloroResidualRepeater
            options={repeaterOpts}
            value={repeaterValue}
            onChange={onChange}
            disabled={disabled}
          />
        ) : opts.layout === 'lactico_titration_repeater' ? (
          <LacticoTitrationRepeater
            options={repeaterOpts}
            value={repeaterValue}
            onChange={onChange}
            disabled={disabled}
          />
        ) : opts.layout === 'card_repeater' ? (
          <CardRepeater
            options={repeaterOpts}
            value={repeaterValue}
            onChange={onChange}
            disabled={disabled}
          />
        ) : opts.layout === 'pc_inocuidad_repeater' ? (
          <PcInocuidadRepeater
            options={repeaterOpts}
            value={repeaterValue as import('./PcInocuidadRepeater').PcInocuidadRow[]}
            onChange={onChange}
            disabled={disabled}
          />
        ) : opts.layout === 'formal_repeater_table' ? (
          <FormalRepeaterTable
            options={repeaterOpts}
            value={repeaterValue}
            onChange={onChange}
            disabled={disabled}
          />
        ) : (
          <RepeaterField
            options={repeaterOpts}
            value={repeaterValue}
            onChange={onChange}
            disabled={disabled}
          />
        )}
      </div>
    );
  }

  if (field.fieldType === 'PHOTO') {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <PhotoInput
          label={field.label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          multiple={opts.multiple}
          maxPhotos={opts.maxPhotos}
        />
      </div>
    );
  }

  if (field.fieldType === 'TEXTAREA') {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={compact ? 2 : 3}
          placeholder={field.placeholder}
          className={`${INPUT_CLASS} resize-y`}
        />
      </div>
    );
  }

  if (field.fieldType === 'NUMBER') {
    const textInput = isTemperatureInput(field.fieldKey, field.label);
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <input
        type={textInput ? 'text' : 'number'}
        inputMode={textInput ? 'decimal' : undefined}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={textInput ? undefined : field.config?.min}
        max={textInput ? undefined : field.config?.max}
        placeholder={textInput ? 'Ej: 2,5' : field.placeholder}
        className={INPUT_CLASS}
        />
      </div>
    );
  }

  if (field.fieldType === 'TIME') {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <input
          type="time"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={INPUT_CLASS}
        />
      </div>
    );
  }

  if (field.fieldType === 'DATE') {
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <input
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={INPUT_CLASS}
        />
      </div>
    );
  }

  if (field.fieldType === 'CHECKBOX') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {showRequiredIndicator(field.required) && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
    );
  }

  return (
    <div>
      <FieldLabel field={field} show={showLabel} />
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={isReadonly}
        placeholder={field.placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}
