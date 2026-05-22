import { useState, useRef, useEffect } from 'react';
import { Portal } from './Portal';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled = false,
  label,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside (but not on Portal options)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-semibold text-white mb-3">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-3.5 rounded-xl bg-dark-700/50 border-2 border-dark-600/60 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 focus:border-nexus-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all appearance-none cursor-pointer font-medium shadow-lg shadow-dark-900/20 flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-white' : 'text-dark-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Portal>
          <div
            className="fixed rounded-xl bg-dark-700 border-2 border-dark-600/60 shadow-2xl shadow-dark-900/50 z-[9999] overflow-hidden animate-fade-in pointer-events-auto"
            style={{
              top: containerRef.current ? (containerRef.current.getBoundingClientRect().bottom + 8) : 'auto',
              left: containerRef.current ? (containerRef.current.getBoundingClientRect().left) : 'auto',
              width: containerRef.current ? (containerRef.current.getBoundingClientRect().width) : 'auto',
              minWidth: '280px',
              maxHeight: '320px',
            }}
          >
            <div className="overflow-y-auto max-h-80">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    type="button"
                    className={`w-full px-4 py-3 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-nexus-600/30 text-white border-l-4 border-nexus-500 font-semibold'
                        : 'bg-transparent text-dark-300 hover:bg-dark-600/50 hover:text-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <span className="text-nexus-400 text-lg">✓</span>}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-dark-500 text-sm text-center">
                No hay opciones disponibles
              </div>
            )}
          </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
