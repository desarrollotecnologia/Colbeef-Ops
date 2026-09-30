import { Plus, Trash2 } from 'lucide-react';
import { INPUT_CLASS } from '@/lib/formUtils';
import {
  ANIMAL_CRITERIA,
  CORRAL_ITEMS,
  CORRALES_DEFAULT_ROWS,
  CORRALES_KEY,
  buildBienestarSummary,
  emptyCorralRow,
  formatPercent,
  parseCorralRows,
  parseMarks,
  percentFromMarks,
  cumplePct,
  type CorralItemKey,
  type CorralMark,
  type CorralRow,
} from '@/lib/bienestarAnimal';

interface Props {
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

function cycleMark(current: string, marks: string[]): string {
  const i = marks.indexOf(current);
  return marks[(i + 1) % marks.length] ?? '';
}

function AnimalGrid({
  value,
  sampleSize,
  marks,
  disabled,
  onChange,
}: {
  value: unknown;
  sampleSize: number;
  marks: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const arr = parseMarks(value, sampleSize);
  return (
    <div className="grid grid-cols-10 sm:grid-cols-10 gap-1">
      {arr.map((m, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          title={`Animal ${i + 1}`}
          onClick={() => {
            const next = [...arr];
            next[i] = cycleMark(m, marks);
            onChange(next);
          }}
          className={`h-8 text-[11px] font-bold border rounded ${
            m === 'X'
              ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
              : m
                ? 'bg-amber-50 border-amber-400 text-amber-900'
                : 'bg-white border-gray-300 text-gray-400'
          }`}
        >
          <span className="text-[9px] text-gray-500 block leading-none">{i + 1}</span>
          {m || '·'}
        </button>
      ))}
    </div>
  );
}

function SiNo({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {(['SI', 'NO'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 text-xs font-semibold rounded border ${
            value === opt
              ? opt === 'SI'
                ? 'bg-sky-600 text-white border-sky-700'
                : 'bg-slate-700 text-white border-slate-800'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CumpleNc({
  value,
  onChange,
  disabled,
}: {
  value: CorralMark;
  onChange: (v: CorralMark) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1 justify-center">
      {(['C', 'NC'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === opt ? '' : opt)}
          className={`min-w-[34px] px-1.5 py-1 text-[10px] font-bold rounded border ${
            value === opt
              ? opt === 'C'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-red-600 text-white border-red-700'
              : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CorralesTable({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (next: CorralRow[]) => void;
  disabled?: boolean;
}) {
  const rows = parseCorralRows(value);

  const updateRow = (index: number, patch: Partial<CorralRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border border-gray-400">
        <table className="w-full text-[11px] border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-emerald-100">
              <th className="border border-gray-400 px-1 py-1 w-10">N°</th>
              <th className="border border-gray-400 px-1 py-1 w-24">Corrales</th>
              {CORRAL_ITEMS.map((it) => (
                <th key={it.key} className="border border-gray-400 px-1 py-1" title={it.text}>
                  {it.num}
                  <span className="block text-[9px] font-normal text-gray-600">C/NC</span>
                </th>
              ))}
              <th className="border border-gray-400 px-1 py-1">Observaciones</th>
              <th className="border border-gray-400 px-1 py-1 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="border border-gray-300 px-1 py-1 text-center font-semibold">{i + 1}</td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    className={`${INPUT_CLASS} text-xs`}
                    disabled={disabled}
                    placeholder="Corral #"
                    value={row.corral}
                    onChange={(e) => updateRow(i, { corral: e.target.value })}
                  />
                </td>
                {CORRAL_ITEMS.map((it) => (
                  <td key={it.key} className="border border-gray-300 px-1 py-1">
                    <CumpleNc
                      value={row[it.key as CorralItemKey]}
                      disabled={disabled}
                      onChange={(v) => updateRow(i, { [it.key]: v } as Partial<CorralRow>)}
                    />
                  </td>
                ))}
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    className={`${INPUT_CLASS} text-xs`}
                    disabled={disabled}
                    value={row.obs}
                    onChange={(e) => updateRow(i, { obs: e.target.value })}
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center">
                  {rows.length > CORRALES_DEFAULT_ROWS && (
                    <button
                      type="button"
                      disabled={disabled}
                      title="Quitar fila"
                      onClick={() => onChange(rows.filter((_, j) => j !== i))}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, emptyCorralRow()])}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        <Plus size={14} /> Añadir corral
      </button>
    </div>
  );
}

export default function Format22BienestarSheet({ sheetData, onUpdate, disabled }: Props) {
  const summary = buildBienestarSummary(sheetData);
  const str = (k: string) => String(sheetData[k] ?? '');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden bg-white space-y-0">
      <div className="bg-emerald-50 border-b border-gray-800 px-3 py-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        <label className="text-[11px] font-semibold text-gray-800">
          Inspector(es)
          <input
            className={`${INPUT_CLASS} mt-0.5 text-sm`}
            disabled={disabled}
            value={str('inspectores')}
            onChange={(e) => onUpdate('inspectores', e.target.value)}
          />
        </label>
        <label className="text-[11px] font-semibold text-gray-800">
          Método de aturdimiento
          <input
            className={`${INPUT_CLASS} mt-0.5 text-sm`}
            disabled={disabled}
            value={str('metodo_aturdimiento') || 'PISTOLA DE PERNO CAUTIVO PENETRANTE'}
            onChange={(e) => onUpdate('metodo_aturdimiento', e.target.value)}
          />
        </label>
        <label className="text-[11px] font-semibold text-gray-800">
          Auxiliar línea (insensibilizado)
          <input
            className={`${INPUT_CLASS} mt-0.5 text-sm`}
            disabled={disabled}
            value={str('auxiliar_insensibilizado')}
            onChange={(e) => onUpdate('auxiliar_insensibilizado', e.target.value)}
          />
        </label>
        <label className="text-[11px] font-semibold text-gray-800">
          Auxiliar corrales (enmangado)
          <input
            className={`${INPUT_CLASS} mt-0.5 text-sm`}
            disabled={disabled}
            value={str('auxiliar_enmangado')}
            onChange={(e) => onUpdate('auxiliar_enmangado', e.target.value)}
          />
        </label>
      </div>

      {ANIMAL_CRITERIA.map((c) => {
        const marks = parseMarks(sheetData[c.marksKey], c.sampleSize);
        const pct = percentFromMarks(marks, c.sampleSize);
        const ok = cumplePct(pct, c.threshold);
        return (
          <div key={c.id} className="border-b border-gray-800 p-3 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-gray-900">{c.title}</h3>
                <p className="text-[10px] text-gray-600 mt-0.5">{c.legend}</p>
                <p className="text-[10px] text-gray-500">{c.note}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-600">Porcentaje de cumplimiento</div>
                <div className="text-sm font-bold">{formatPercent(pct)}</div>
                <div className="text-[10px] text-gray-500">
                  {marks.filter((m) => m === 'X').length} X ÷ {c.sampleSize} (CONTAR.SI "X" / {c.sampleSize})
                </div>
                <div
                  className={`text-[11px] font-semibold ${ok ? 'text-emerald-700' : 'text-red-700'}`}
                >
                  {ok ? 'APROBADO / CUMPLE' : 'DESAPROBADO / NO CUMPLE'}
                </div>
              </div>
            </div>
            <AnimalGrid
              value={sheetData[c.marksKey]}
              sampleSize={c.sampleSize}
              marks={c.marks}
              disabled={disabled}
              onChange={(next) => onUpdate(c.marksKey, next)}
            />
            <label className="block text-[11px] font-semibold text-gray-700">
              Observaciones
              <textarea
                className={`${INPUT_CLASS} mt-0.5 text-xs min-h-[48px]`}
                disabled={disabled}
                value={str(c.obsKey)}
                onChange={(e) => onUpdate(c.obsKey, e.target.value)}
              />
            </label>
          </div>
        );
      })}

      {/* 9 */}
      <div className="border-b border-gray-800 p-3 space-y-2">
        <h3 className="text-xs font-bold">9. Actos de abuso</h3>
        <p className="text-[10px] text-gray-600">Tolerancia cero. Aprobado si respuesta es NO.</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold">¿Se presentaron actos de abuso?</span>
          <SiNo
            value={str('c9_actos_abuso')}
            disabled={disabled}
            onChange={(v) => onUpdate('c9_actos_abuso', v)}
          />
        </div>
        <textarea
          className={`${INPUT_CLASS} text-xs min-h-[48px]`}
          disabled={disabled}
          placeholder="Observaciones"
          value={str('c9_obs')}
          onChange={(e) => onUpdate('c9_obs', e.target.value)}
        />
      </div>

      {/* 10 */}
      <div className="border-b border-gray-800 p-3 space-y-3">
        <h3 className="text-xs font-bold">10. Estado de corrales</h3>
        <ul className="space-y-1">
          {CORRAL_ITEMS.map((it) => (
            <li key={it.key} className="text-[11px] text-gray-800">
              <span className="font-bold">{it.num}</span> {it.text}
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-gray-600">
          Ingrese el número del corral inspeccionado y en cada criterio marque{' '}
          <strong>C: Cumple</strong> o <strong>NC: No cumple</strong>.
        </p>
        <p className="text-[10px] text-gray-500">
          Nota: Durante las inspecciones realizadas en el mes, se debe cubrir la revisión total de los
          corrales, más el corral de observación.
        </p>
        <CorralesTable
          value={sheetData[CORRALES_KEY]}
          disabled={disabled}
          onChange={(next) => onUpdate(CORRALES_KEY, next)}
        />
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold">¿Se presentaron desviaciones?</span>
          <SiNo
            value={str('c10_desviaciones')}
            disabled={disabled}
            onChange={(v) => onUpdate('c10_desviaciones', v)}
          />
        </div>
        <p className="text-[10px] text-gray-600">
          Para obtener un resultado APROBADO la tolerancia es de cero desviaciones.
        </p>
        <textarea
          className={`${INPUT_CLASS} text-xs min-h-[48px]`}
          disabled={disabled}
          placeholder="Observaciones"
          value={str('c10_obs')}
          onChange={(e) => onUpdate('c10_obs', e.target.value)}
        />
      </div>

      {/* 11 */}
      <div className="border-b border-gray-800 p-3 space-y-2">
        <h3 className="text-xs font-bold">11. Estado de instalaciones de acceso a corrales</h3>
        {(
          [
            ['c11_vias', 'Vías de acceso en buen estado (sin baches)'],
            ['c11_acoples', 'Desembarcaderos con acoples correctos'],
            ['c11_antideslizante', 'Desembarcaderos con piso antideslizante'],
            ['c11_aristas', 'Pisos/barandas presentan aristas (CUMPLE si NO)'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold">{label}</span>
            <SiNo value={str(key)} disabled={disabled} onChange={(v) => onUpdate(key, v)} />
          </div>
        ))}
        <textarea
          className={`${INPUT_CLASS} text-xs min-h-[48px]`}
          disabled={disabled}
          placeholder="Observaciones"
          value={str('c11_obs')}
          onChange={(e) => onUpdate('c11_obs', e.target.value)}
        />
      </div>

      {/* 12–13 */}
      {(
        [
          ['c12_desviaciones', 'c12_obs', '12. ¿Desviaciones de bienestar por transporte?'],
          ['c13_desviaciones', 'c13_obs', '13. ¿Desviaciones por tiempos de reposo y alimentación?'],
        ] as const
      ).map(([key, obs, label]) => (
        <div key={key} className="border-b border-gray-800 p-3 space-y-2">
          <h3 className="text-xs font-bold">{label}</h3>
          <p className="text-[10px] text-gray-600">Aprobado (CUMPLE) si la respuesta es NO.</p>
          <SiNo value={str(key)} disabled={disabled} onChange={(v) => onUpdate(key, v)} />
          <textarea
            className={`${INPUT_CLASS} text-xs min-h-[48px]`}
            disabled={disabled}
            placeholder="Observaciones"
            value={str(obs)}
            onChange={(e) => onUpdate(obs, e.target.value)}
          />
        </div>
      ))}

      {/* Resumen fórmulas */}
      <div className="p-3">
        <h3 className="text-xs font-bold uppercase mb-2">Criterios auditados (cálculo automático)</h3>
        <div className="overflow-x-auto border border-gray-400">
          <table className="w-full text-[11px] border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-emerald-100">
                <th className="border border-gray-400 px-2 py-1 text-left">Criterio</th>
                <th className="border border-gray-400 px-2 py-1">% / valor</th>
                <th className="border border-gray-400 px-2 py-1">Calificación</th>
                <th className="border border-gray-400 px-2 py-1">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((r) => (
                <tr key={r.id}>
                  <td className="border border-gray-300 px-2 py-1">{r.label}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center font-semibold">
                    {r.pctLabel}
                  </td>
                  <td
                    className={`border border-gray-300 px-2 py-1 text-center font-semibold ${
                      r.calificacion === 'CUMPLE'
                        ? 'text-emerald-700'
                        : r.calificacion === 'NO CUMPLE'
                          ? 'text-red-700'
                          : ''
                    }`}
                  >
                    {r.calificacion}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{r.puntos}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-400 px-2 py-1" colSpan={3}>
                  PUNTAJE TOTAL OBTENIDO (suma cumplimientos / 18)
                </td>
                <td className="border border-gray-400 px-2 py-1 text-center">{summary.totalLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <label className="block text-[11px] font-semibold text-gray-700 mt-3">
          Observaciones adicionales
          <textarea
            className={`${INPUT_CLASS} mt-0.5 text-xs min-h-[56px]`}
            disabled={disabled}
            value={str('observaciones_adicionales')}
            onChange={(e) => onUpdate('observaciones_adicionales', e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
