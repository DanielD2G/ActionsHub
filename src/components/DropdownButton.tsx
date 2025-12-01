import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface DropdownOption {
  label: string;
  icon?: any;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownButtonProps {
  label: string;
  icon?: any;
  options: DropdownOption[];
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  onMainClick?: () => void;
}

export default function DropdownButton({
  label,
  icon,
  options,
  variant = 'secondary',
  disabled = false,
  loading = false,
  onMainClick,
}: DropdownButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
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

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-10';

    switch (variant) {
      case 'primary':
        return `${baseClasses} text-sm bg-button-primary-bg text-white hover:bg-button-primary-hover`;
      case 'danger':
        return `${baseClasses} text-sm bg-button-danger-bg text-white hover:bg-button-danger-hover`;
      case 'secondary':
      default:
        return `${baseClasses} text-sm bg-surface-primary text-text-secondary border border-default hover:bg-surface-hover`;
    }
  };

  const handleMainClick = () => {
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (onMainClick) {
      onMainClick();
    } else if (options.length > 0) {
      options[0].onClick();
    }
  };

  return (
    <div class="relative inline-block" ref={dropdownRef}>
      <div class="flex items-stretch min-w-[90px] sm:min-w-[120px]">
        {/* Main button */}
        <button
          onClick={handleMainClick}
          disabled={disabled || loading}
          class={`${getButtonClasses()} px-3 sm:px-4 ${options.length > 0 ? 'rounded-r-none border-r-0' : ''}`}
        >
          {loading ? (
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : icon ? (
            <div class={`${isAnimating ? 'animate-spin' : ''}`} style={isAnimating ? { animation: 'spin 0.6s linear' } : {}}>
              {icon}
            </div>
          ) : null}
          <span class="whitespace-nowrap">{label}</span>
        </button>

        {/* Dropdown toggle */}
        {options.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || loading}
            class={`${getButtonClasses()} px-2 sm:px-3 rounded-l-none flex items-center justify-center`}
          >
            <svg
              class={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && options.length > 0 && (
        <div class="absolute right-0 mt-2 w-56 bg-surface-primary rounded-lg shadow-lg border border-default py-1 z-50">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick();
                setIsOpen(false);
              }}
              disabled={option.disabled}
              class="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 transition-colors"
            >
              {option.icon && option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
