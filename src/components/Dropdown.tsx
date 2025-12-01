import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  variant?: 'default' | 'button';
}

export default function Dropdown({ value, onChange, options, placeholder, variant = 'default' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const isButton = variant === 'button';

  return (
    <div class={isButton ? 'relative inline-block w-full' : 'relative'} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        class={isButton
          ? 'w-full px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-default rounded-lg hover:bg-surface-hover focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap'
          : 'w-full px-3 py-2 text-left bg-surface-primary border border-default rounded-lg hover:bg-surface-hover focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-colors flex items-center justify-between cursor-pointer'
        }
      >
        <span class={value === '' ? 'text-text-faint' : 'text-text-primary'}>
          {displayText}
        </span>
        <svg
          class={`${isButton ? 'w-4 h-4' : 'w-5 h-5'} text-text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div class={`absolute z-50 ${isButton ? 'min-w-full' : 'w-full'} mt-1 bg-surface-primary border border-default rounded-lg shadow-lg max-h-60 overflow-auto`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              class={`w-full text-left ${isButton ? 'px-4 py-2 text-sm whitespace-nowrap' : 'px-3 py-2'} hover:bg-surface-hover transition-colors cursor-pointer ${
                value === option.value
                  ? 'bg-info-bg text-info-text font-medium'
                  : 'text-text-secondary'
              } ${option.value === '' ? 'border-b border-default' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
