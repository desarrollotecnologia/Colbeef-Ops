type CncChoice = 'C' | 'NC' | 'NA';

const CNC_ACTIVE_CLASS: Record<CncChoice, string> = {
  C: 'bg-green-600 text-white border-green-600',
  NC: 'bg-red-600 text-white border-red-600',
  NA: 'bg-gray-500 text-white border-gray-500',
};

const CNC_LABEL: Record<CncChoice, string> = {
  C: 'Cumple',
  NC: 'No cumple',
  NA: 'No aplica',
};

interface Props {
  choice: CncChoice;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  compact?: boolean;
}

export default function CncToggle({ choice, value, disabled, onChange, compact }: Props) {
  const active = value === choice;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(active ? '' : choice)}
      className={`w-full ${compact ? 'py-0.5 text-[9px]' : 'py-1 text-xs'} font-bold rounded border-2 ${
        active ? CNC_ACTIVE_CLASS[choice] : 'bg-white border-gray-300'
      }`}
    >
      {choice}
    </button>
  );
}

/** Encabezado de columna: al hacer clic marca todas las filas con esa opción. */
export function CncColumnHeader({
  choice,
  disabled,
  onFillAll,
  className = '',
  label,
}: {
  choice: CncChoice;
  disabled?: boolean;
  onFillAll: (choice: CncChoice) => void;
  className?: string;
  label?: string;
}) {
  return (
    <th className={className}>
      <button
        type="button"
        disabled={disabled}
        title={`Marcar todos como ${CNC_LABEL[choice]} (${choice}). Luego puede cambiar cada fila.`}
        onClick={() => onFillAll(choice)}
        className={`w-full py-0.5 rounded font-bold uppercase text-[11px] border border-transparent hover:border-gray-400 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed ${
          choice === 'C' ? 'text-green-800' : choice === 'NC' ? 'text-red-800' : 'text-gray-700'
        }`}
      >
        {label ?? choice}
      </button>
    </th>
  );
}

export function cncChoicesFromOptions(choices?: string[]): CncChoice[] {
  const all: CncChoice[] = ['C', 'NC', 'NA'];
  if (!choices?.length) return ['C', 'NC'];
  return all.filter((c) => choices.includes(c));
}

export type { CncChoice };
