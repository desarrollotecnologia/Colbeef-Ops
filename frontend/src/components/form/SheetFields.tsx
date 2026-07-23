import type { FormatField } from '@/types';
import { groupFields, SECTION_HEADER_CLASS } from '@/lib/formUtils';
import FormField from './FormField';
import ItemChecklist from './ItemChecklist';
import DayScheduleTable from './DayScheduleTable';
import FormalMeasureTable from './FormalMeasureTable';
import Format2Hoja1 from './Format2Hoja1';
import Format2SanitarySheet from './Format2SanitarySheet';
import Format1Hoja7 from './Format1Hoja7';
import Format1Hoja8 from './Format1Hoja8';
import Format3Sheet from './Format3Sheet';
import Format4Diario1 from './Format4Diario1';
import Format4Diario2 from './Format4Diario2';
import Format4Diario3 from './Format4Diario3';
import Format4Diario4 from './Format4Diario4';
import Format4Diario5 from './Format4Diario5';
import Format5Sheet from './Format5Sheet';
import Format6Sheet from './Format6Sheet';
import Format7Sheet from './Format7Sheet';
import Format8VehiculosSheet from './Format8VehiculosSheet';
import Format9PhSheet from './Format9PhSheet';
import Format10HabitosSheet from './Format10HabitosSheet';
import Format11DevolucionesSheet from './Format11DevolucionesSheet';
import Format12DecomisosSheet from './Format12DecomisosSheet';
import Format15PoesSheet from './Format15PoesSheet';
import GroupedFormalSheet from './GroupedFormalSheet';
import Format14PcOperativoSheet from './Format14PcOperativoSheet';
import Format16InocuidadSheet from './Format16InocuidadSheet';
import type { ChecklistItemData, MeasureRowData } from '@/types';

const LEGEND_FOOTER = (
  <div className="text-xs text-gray-500 border-t pt-3">
    <p>
      <strong>C:</strong> Cumple &nbsp; <strong>NC:</strong> No cumple &nbsp; <strong>NA:</strong> No aplica &nbsp; <strong>PLAT:</strong> Plataforma &nbsp; <strong>AC:</strong> Acción correctiva (obligatoria si hay NC u observación)
    </p>
  </div>
);

const HEADER_ONLY_KEYS = new Set(['empresa']);

interface Props {
  fields: FormatField[];
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  workDate: string;
  disabled?: boolean;
}

export default function SheetFields({ fields, sheetData, onUpdate, workDate, disabled }: Props) {
  const visible = fields.filter((f) => !HEADER_ONLY_KEYS.has(f.fieldKey));
  const has = (key: string) => fields.some((f) => f.fieldKey === key);

  if (has('pc_comestibles') && has('area_refri')) {
    return (
      <div className="space-y-6">
        <Format1Hoja7 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            <strong>C:</strong> Cumple &nbsp; <strong>NC:</strong> No cumple &nbsp; <strong>NA:</strong> No aplica &nbsp; <strong>C#:</strong> Cava &nbsp; <strong>M#:</strong> Máquina &nbsp; <strong>PRE:</strong> Pre-refrigeración &nbsp; <strong>PVC:</strong> Pasillo cavas
          </p>
        </div>
      </div>
    );
  }

  if (has('condensacion') && fields.some((f) => f.options?.columnDefs?.length)) {
    return (
      <div className="space-y-6">
        <Format1Hoja8 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            <strong>C:</strong> Cumple &nbsp; <strong>NC:</strong> No cumple &nbsp; <strong>NA:</strong> No aplica &nbsp; <strong>C#:</strong> Cava &nbsp; <strong>M#:</strong> Máquina
          </p>
        </div>
      </div>
    );
  }

  if (has('productos') && has('destino')) {
    return (
      <div className="space-y-6">
        <Format3Sheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('temperaturas_areas')) {
    return (
      <div className="space-y-6">
        <Format4Diario1 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('inspeccion_cortes') && has('proceso_despostado')) {
    return (
      <div className="space-y-6">
        <Format4Diario2 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('condiciones_empaque')) {
    return (
      <div className="space-y-6">
        <Format4Diario3 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('poes_manipulador')) {
    return (
      <div className="space-y-6">
        <Format4Diario4 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('refri_sin_hueso_empaque')) {
    return (
      <div className="space-y-6">
        <Format4Diario5 fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('desinfeccion_canales') && has('inspeccion_canales')) {
    return (
      <div className="space-y-6">
        <Format5Sheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('temp_cava_cnc') && has('inspeccion_canales')) {
    return (
      <div className="space-y-6">
        <Format6Sheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('lotes') || has('bloque_1_lote')) {
    return (
      <div className="space-y-6">
        <Format7Sheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('inspeccion_items')) {
    return (
      <div className="space-y-6">
        <Format8VehiculosSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('calibraciones')) {
    return (
      <div className="space-y-6">
        <Format9PhSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('personas')) {
    return (
      <div className="space-y-6">
        <Format10HabitosSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('motivo') && has('registros')) {
    return (
      <div className="space-y-6">
        <Format11DevolucionesSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('decomisos') && has('observaciones_fijas')) {
    return (
      <div className="space-y-6">
        <Format12DecomisosSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('poes_equipos') && has('poes_hora_1')) {
    return (
      <div className="space-y-6">
        <Format15PoesSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} workDate={workDate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('linea_cloro_registros') && has('linea_tiempos_proceso')) {
    return (
      <div className="space-y-6">
        <GroupedFormalSheet
          fields={visible}
          sheetData={sheetData}
          onUpdate={onUpdate}
          workDate={workDate}
          disabled={disabled}
          observacionesFieldKey="linea_observaciones"
        />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('pc_op_proceso')) {
    return (
      <div className="space-y-6">
        <Format14PcOperativoSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  if (has('pc_inocuidad_registros') && has('total_animales')) {
    return (
      <div className="space-y-6">
        <Format16InocuidadSheet fields={visible} sheetData={sheetData} onUpdate={onUpdate} workDate={workDate} disabled={disabled} />
        {LEGEND_FOOTER}
      </div>
    );
  }

  const groups = groupFields(fields);

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => {
        const visibleFields = group.fields.filter((f) => !HEADER_ONLY_KEYS.has(f.fieldKey));
        if (visibleFields.length === 0) return null;

        const isFormat2Hoja1 =
          visibleFields.some((f) => f.fieldKey === 'especie') &&
          visibleFields.some((f) => f.options?.layout === 'formal_measure_table');

        if (isFormat2Hoja1) {
          return (
            <Format2Hoja1
              key={gi}
              fields={visibleFields}
              sheetData={sheetData}
              onUpdate={onUpdate}
              disabled={disabled}
            />
          );
        }

        const sanitaryChecklist = visibleFields.find((f) => f.fieldKey === 'operacion_sanitaria');
        if (sanitaryChecklist) {
          return (
            <Format2SanitarySheet
              key={gi}
              fields={visibleFields}
              sheetData={sheetData}
              onUpdate={onUpdate}
              disabled={disabled}
            />
          );
        }

        const measureTableField = visibleFields.find(
          (f) => f.fieldType === 'CHECKLIST' && f.options?.layout === 'formal_measure_table'
        );

        if (measureTableField && visibleFields.length === 1) {
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">
                  {group.name ?? measureTableField.label}
                </h3>
                {measureTableField.helpText && (
                  <p className="text-[11px] text-gray-600 mt-0.5">{measureTableField.helpText}</p>
                )}
              </div>
              <div className="p-0">
                <FormalMeasureTable
                  options={measureTableField.options ?? {}}
                  value={(sheetData[measureTableField.fieldKey] as Record<string, MeasureRowData>) ?? {}}
                  onChange={(v) => onUpdate(measureTableField.fieldKey, v)}
                  disabled={disabled}
                />
              </div>
            </div>
          );
        }

        const readonlyFields = visibleFields.filter((f) => f.fieldType === 'READONLY');
        const readonlyPair =
          readonlyFields.length >= 2 && readonlyFields.length === visibleFields.length;

        if (readonlyPair) {
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">{group.name}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                {readonlyFields.map((field) => (
                  <div key={field.fieldKey} className="px-4 py-3">
                    <p className="text-[11px] font-bold uppercase text-gray-600">{field.label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{field.defaultValue ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        const dayTableField = visibleFields.find(
          (f) => f.fieldType === 'CHECKLIST' && f.options?.layout === 'day_schedule_table'
        );

        if (dayTableField) {
          const tableType = dayTableField.options?.tableType ?? 'cloro';
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">
                  {group.name ?? dayTableField.label}
                </h3>
                {tableType === 'cloro' && (
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Cloro residual libre (0.3 – 2 ppm) y pH — un registro por cada punto del día
                  </p>
                )}
              </div>
              <div className="p-0">
                <DayScheduleTable
                  options={dayTableField.options ?? {}}
                  value={(sheetData[dayTableField.fieldKey] as Record<string, import('./DayScheduleTable').DayPointRow>) ?? {}}
                  onChange={(v) => onUpdate(dayTableField.fieldKey, v)}
                  workDate={workDate}
                  disabled={disabled}
                />
              </div>
            </div>
          );
        }

        const checklistFields = visibleFields.filter(
          (f) => f.fieldType === 'CHECKLIST' && f.options?.items
        );

        if (checklistFields.length > 0 && checklistFields.length === visibleFields.length) {
          return (
            <div key={gi} className="space-y-4">
              {checklistFields.map((checklistField) => (
                <div key={checklistField.fieldKey} className="border border-gray-800 rounded-sm overflow-hidden">
                  <div className={SECTION_HEADER_CLASS}>
                    <h3 className="text-xs font-bold uppercase text-gray-900">
                      {checklistField.label}
                    </h3>
                    {checklistField.options?.platformCount && (
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        PLAT 1 – {checklistField.options.platformCount} · C / NC por plataforma
                      </p>
                    )}
                    {checklistField.options?.columnDefs && checklistField.options.columnDefs.length > 0 && (
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {checklistField.helpText ?? `${checklistField.options.columnDefs.length} ubicaciones — C / NC / NA según aplique`}
                      </p>
                    )}
                    {!checklistField.options?.columnDefs?.length &&
                      checklistField.options?.cavaColumns &&
                      checklistField.options.cavaColumns.length > 0 && (
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {checklistField.options.cavaColumns.join(' · ')} — C / NC / NA por cava
                      </p>
                    )}
                  </div>
                  <div className="p-0">
                    <ItemChecklist
                      options={checklistField.options ?? {}}
                      value={(sheetData[checklistField.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
                      onChange={(v) => onUpdate(checklistField.fieldKey, v)}
                      disabled={disabled}
                      tableMode
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        }

        const textareaFields = visibleFields.filter((f) => f.fieldType === 'TEXTAREA');
        const textareaPair =
          textareaFields.length === 2 && textareaFields.length === visibleFields.length;

        if (textareaPair) {
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">{group.name}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                {textareaFields.map((field) => (
                  <div key={field.fieldKey} className="p-4">
                    <FormField
                      field={field}
                      value={sheetData[field.fieldKey]}
                      onChange={(v) => onUpdate(field.fieldKey, v)}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        const textareaOnly =
          visibleFields.length === 1 && visibleFields[0].fieldType === 'TEXTAREA';

        if (textareaOnly) {
          const field = visibleFields[0];
          return (
            <div key={gi} className="border border-gray-800 rounded-sm overflow-hidden">
              <div className={SECTION_HEADER_CLASS}>
                <h3 className="text-xs font-bold uppercase text-gray-900">{group.name ?? field.label}</h3>
              </div>
              <div className="p-4">
                <FormField
                  field={field}
                  value={sheetData[field.fieldKey]}
                  onChange={(v) => onUpdate(field.fieldKey, v)}
                  disabled={disabled}
                />
              </div>
            </div>
          );
        }

        return (
          <div key={gi}>
            {group.name && (
              <h3 className="text-xs font-bold uppercase text-gray-800 mb-3 pb-1 border-b border-gray-300">
                {group.name}
              </h3>
            )}
            <div className="space-y-4">
              {visibleFields.map((field) => {
                if (field.fieldType === 'CHECKLIST' && field.options?.items) {
                  return (
                    <div key={field.fieldKey} className="border border-gray-800 rounded-sm overflow-hidden">
                      <div className={SECTION_HEADER_CLASS}>
                        <h3 className="text-xs font-bold uppercase text-gray-900">{field.label}</h3>
                        {field.helpText && (
                          <p className="text-[11px] text-gray-600 mt-0.5">{field.helpText}</p>
                        )}
                      </div>
                      <div className="p-0">
                        <ItemChecklist
                          options={field.options ?? {}}
                          value={(sheetData[field.fieldKey] as Record<string, ChecklistItemData>) ?? {}}
                          onChange={(v) => onUpdate(field.fieldKey, v)}
                          disabled={disabled}
                          tableMode
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <FormField
                    key={field.id}
                    field={field}
                    value={sheetData[field.fieldKey]}
                    onChange={(v) => onUpdate(field.fieldKey, v)}
                    disabled={disabled}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {LEGEND_FOOTER}
    </div>
  );
}
