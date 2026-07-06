type CncChoice = 'C' | 'NC' | 'NA';

const CNC_ACTIVE_CLASS: Record<CncChoice, string> = {
  C: 'bg-green-600 text-white border-green-600',
  NC: 'bg-red-600 text-white border-red-600',
  NA: 'bg-gray-500 text-white border-gray-500',
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

export function cncChoicesFromOptions(choices?: string[]): CncChoice[] {
  const all: CncChoice[] = ['C', 'NC', 'NA'];
  if (!choices?.length) return ['C', 'NC'];
  return all.filter((c) => choices.includes(c));
}
