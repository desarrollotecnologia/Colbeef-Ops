import type { ChecklistItemData, FieldOptions } from '@/types';
import CavaMatrixTable from './CavaMatrixTable';
import MatrixObsFooter from './MatrixObsFooter';

interface Props {
  options: FieldOptions;
  value: Record<string, ChecklistItemData>;
  onChange: (v: Record<string, ChecklistItemData>) => void;
  disabled?: boolean;
  /** Índices donde cortar columnas (ej. [4, 9] → 3 tablas) */
  splitAt?: number[];
  subtitles?: string[];
}

function buildChunks<T>(items: T[], splitAt: number[]): T[][] {
  const cuts = [...splitAt].sort((a, b) => a - b).filter((n) => n > 0 && n < items.length);
  const chunks: T[][] = [];
  let start = 0;
  for (const cut of cuts) {
    chunks.push(items.slice(start, cut));
    start = cut;
  }
  chunks.push(items.slice(start));
  return chunks.filter((c) => c.length > 0);
}

function hasObsCols(options: FieldOptions): boolean {
  const raw = options.columns;
  if (!Array.isArray(raw) || !raw[0] || typeof raw[0] !== 'string') return false;
  const cols = raw as string[];
  return cols.includes('observation') || cols.includes('corrective');
}

export default function CavaMatrixSplit({
  options,
  value,
  onChange,
  disabled,
  splitAt = [5],
  subtitles,
}: Props) {
  const columnDefs = options.columnDefs ?? [];
  const items = options.items ?? [];
  if (columnDefs.length === 0) return null;

  const chunks = buildChunks(columnDefs, splitAt);
  const splitMode = chunks.length > 1;
  const obsSeparate = splitMode && hasObsCols(options);

  if (!splitMode) {
    return (
      <CavaMatrixTable
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        showObsCols
      />
    );
  }

  return (
    <div className="divide-y divide-gray-300">
      {chunks.map((chunk, i) => {
        const subtitle =
          subtitles?.[i] ??
          `${chunk[0]?.key} — ${chunk[chunk.length - 1]?.key}`;
        return (
          <div key={i} className="bg-white">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border-b border-gray-200">
              <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                {i + 1}/{chunks.length}
              </span>
              <span className="text-[11px] font-semibold text-gray-800">{subtitle}</span>
            </div>
            <CavaMatrixTable
              options={{
                ...options,
                columnDefs: chunk,
                columns: ['cavaColumns'],
              }}
              value={value}
              onChange={onChange}
              disabled={disabled}
              showObsCols={false}
              showScrollHint={i === 0}
              hideAreaLabel={i > 0}
              compact
            />
          </div>
        );
      })}

      {obsSeparate && items.length > 0 && (
        <MatrixObsFooter
          items={items}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
