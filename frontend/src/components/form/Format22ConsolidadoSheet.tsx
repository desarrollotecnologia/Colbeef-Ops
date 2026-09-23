import { INPUT_CLASS } from '@/lib/formUtils';

interface Props {
  sheetData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const ROWS: { key: string; label: string }[] = [
  { key: 'c1', label: '1. Eficacia de aturdimiento al primer disparo' },
  { key: 'c2', label: '2. Intervalo aturdimiento–sangrado' },
  { key: 'c3', label: '3. Insensibles en riel de sangrado' },
  { key: 'c4', label: '4. Tiempo de sangría' },
  { key: 'c5', label: '5. Resbalones/caídas manejo' },
  { key: 'c6', label: '6. Uso de tábanos eléctricos' },
  { key: 'c7', label: '7. Vocalización' },
  { key: 'c8', label: '8. Resbalones/caídas desembarco' },
  { key: 'c9', label: '9. Actos de abuso' },
  { key: 'c10_1', label: '10.1 Aristas/salientes en corrales' },
  { key: 'c10_2', label: '10.2 Densidad animal adecuada' },
  { key: 'c10_3', label: '10.3 Bebederos en funcionamiento' },
  { key: 'c10_4', label: '10.4 Sombra en buen estado' },
  { key: 'c10_5', label: '10.5 Áreas adyacentes' },
  { key: 'c10_6', label: '10.6 Acceso a agua limpia' },
  { key: 'c11', label: '11. Estado instalaciones acceso' },
  { key: 'c12', label: '12. Desviaciones transporte' },
  { key: 'c13', label: '13. Tiempos reposo y alimentación' },
];

const WEEKS = [
  { key: 's1', label: 'Semana 1' },
  { key: 's2', label: 'Semana 2' },
  { key: 's3', label: 'Semana 3' },
  { key: 's4', label: 'Semana 4' },
  { key: 'acum', label: 'Acumulado mes' },
] as const;

export default function Format22ConsolidadoSheet({ sheetData, onUpdate, disabled }: Props) {
  const cell = (k: string) => String(sheetData[k] ?? '');

  return (
    <div className="border border-gray-800 rounded-sm overflow-hidden bg-white">
      <div className="bg-emerald-50 border-b border-gray-800 px-3 py-2 flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase">Mes en curso</span>
        <input
          className={`${INPUT_CLASS} text-sm max-w-xs`}
          disabled={disabled}
          placeholder="Ej. Septiembre 2026"
          value={cell('mes_en_curso')}
          onChange={(e) => onUpdate('mes_en_curso', e.target.value)}
        />
      </div>
      <div className="overflow-x-auto p-2">
        <table className="w-full text-[11px] border-collapse min-w-[780px]">
          <thead>
            <tr className="bg-emerald-100">
              <th className="border border-gray-400 px-2 py-1.5 text-left min-w-[220px]">
                Criterios auditados
              </th>
              {WEEKS.map((w) => (
                <th key={w.key} className="border border-gray-400 px-2 py-1.5 min-w-[100px]">
                  {w.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key}>
                <td className="border border-gray-300 px-2 py-1 font-semibold text-gray-800">
                  {r.label}
                </td>
                {WEEKS.map((w) => {
                  const fieldKey = `${r.key}_${w.key}`;
                  return (
                    <td key={w.key} className="border border-gray-300 p-1">
                      <input
                        className={`${INPUT_CLASS} text-xs py-0.5`}
                        disabled={disabled}
                        value={cell(fieldKey)}
                        onChange={(e) => onUpdate(fieldKey, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="border border-gray-400 px-2 py-1 font-bold" colSpan={1}>
                TOTAL CUMPLIMIENTO DE PROGRAMA DE BIENESTAR ANIMAL
              </td>
              <td className="border border-gray-400 p-1" colSpan={5}>
                <input
                  className={`${INPUT_CLASS} text-xs font-semibold`}
                  disabled={disabled}
                  value={cell('total_cumplimiento_mes')}
                  onChange={(e) => onUpdate('total_cumplimiento_mes', e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
