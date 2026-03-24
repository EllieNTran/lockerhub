import type { ReactNode } from 'react';

interface SlidingToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SlidingToggleProps<T extends string> {
  options: [SlidingToggleOption<T>, SlidingToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
}

export function SlidingToggle<T extends string>({ 
  options, 
  value, 
  onChange 
}: SlidingToggleProps<T>) {
  const selectedIndex = options.findIndex(opt => opt.value === value);

  return (
    <div className="relative flex items-center bg-grey-outline rounded-full p-0.5 h-full">
      <div
        className="absolute top-0.5 bottom-0.5 bg-secondary rounded-full transition-all duration-300 ease-in-out"
        style={{
          width: 'calc(50% - 2px)',
          left: selectedIndex === 0 ? '2px' : 'calc(50%)',
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            relative z-10 flex items-center justify-center gap-1.5 px-3 h-full rounded-full text-xs font-medium transition-colors
            ${value === option.value ? 'text-white' : 'text-grey hover:text-dark-blue'}
          `}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
