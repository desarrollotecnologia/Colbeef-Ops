interface Props {
  choices: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const COLORS: Record<string, string> = {
  C: 'bg-green-600 text-white border-green-600',
  NC: 'bg-red-600 text-white border-red-600',
  NA: 'bg-gray-500 text-white border-gray-500',
  Encendido: 'bg-green-600 text-white border-green-600',
  Apagado: 'bg-gray-500 text-white border-gray-500',
};

export default function ChoiceButtons({ choices, value, onChange, disabled, size = 'md' }: Props) {
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-5 py-2 text-sm';

  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const active = value === choice;
        const color = COLORS[choice] ?? 'bg-primary-600 text-white border-primary-600';
        return (
          <button
            key={choice}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? '' : choice)}
            className={`${pad} font-semibold rounded-lg border-2 transition-colors disabled:opacity-50 ${
              active ? color : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
