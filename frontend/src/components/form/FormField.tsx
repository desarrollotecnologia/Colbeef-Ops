import { Camera } from 'lucide-react';
import type { ChecklistItemData, FormatField, RepeaterColumn } from '@/types';
import { INPUT_CLASS } from '@/lib/formUtils';
import { isAutoField } from '@/lib/autoFill';
import ChoiceButtons from './ChoiceButtons';
import ItemChecklist from './ItemChecklist';
import MatrixField from './MatrixField';
import RepeaterField from './RepeaterField';
import AutoValue from './AutoValue';

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
      {field.required && <span className="text-red-500 ml-1">*</span>}
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
    const selected = Array.isArray(value) ? (value as string[]) : [];
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
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        {field.helpText && <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>}
        <RepeaterField
          options={{
            ...opts,
            columns_def: Array.isArray(opts.columns) && opts.columns[0] && typeof opts.columns[0] === 'object'
              ? (opts.columns as RepeaterColumn[])
              : [],
          }}
          value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.fieldType === 'PHOTO') {
    const src = typeof value === 'string' ? value : '';
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        {src && (
          <img src={src} alt={field.label} className="mb-2 max-h-40 rounded-lg border border-gray-200" />
        )}
        {!disabled && (
          <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
            <Camera size={20} className="text-gray-400" />
            <span className="text-sm text-gray-600">{src ? 'Cambiar foto' : 'Tomar / subir foto'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
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
    return (
      <div>
        <FieldLabel field={field} show={showLabel} />
        <input
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={field.config?.min}
          max={field.config?.max}
          placeholder={field.placeholder}
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
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
    );
  }

  return (
    <div>
      <FieldLabel field={field} />
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
