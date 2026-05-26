import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Portal } from './Portal';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DatePicker = ({ value, onChange, placeholder = 'Selecciona una fecha', disabled = false }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Parse date in UTC to avoid timezone offset issues
  const selectedDate = value 
    ? new Date(value + 'T00:00:00Z') 
    : undefined;

  // Smart positioning: show above if not enough space below
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calendarHeight = 380; // Approximate height including padding
      
      setShowAbove(spaceBelow < calendarHeight);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        portalRef.current &&
        !portalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const isoString = format(date, 'yyyy-MM-dd');
      onChange(isoString);
      setIsOpen(false);
    }
  };

  const formattedValue = selectedDate 
    ? format(selectedDate, 'dd/MM/yyyy', { locale: es })
    : '';

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-3.5 rounded-xl bg-dark-700/50 border-2 border-dark-600/60 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 focus:border-nexus-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-medium shadow-lg shadow-dark-900/20 flex items-center justify-between"
      >
        <span className={formattedValue ? 'text-white' : 'text-dark-400'}>
          {formattedValue || placeholder}
        </span>
        <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={portalRef}
            className="fixed rounded-xl bg-dark-700 border-2 border-dark-600/60 shadow-2xl shadow-dark-900/50 z-[9999] p-4 animate-fade-in"
            style={{
              top: containerRef.current 
                ? showAbove 
                  ? (containerRef.current.getBoundingClientRect().top - 380 - 8) 
                  : (containerRef.current.getBoundingClientRect().bottom + 8)
                : 'auto',
              left: containerRef.current ? (containerRef.current.getBoundingClientRect().left) : 'auto',
              width: containerRef.current ? (containerRef.current.getBoundingClientRect().width) : 'auto',
              minWidth: '320px',
            }}
          >
            <style>{`
              .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: #2E5FA3;
                --rdp-background-color: rgba(46, 95, 163, 0.2);
                margin: 0;
              }
              
              .rdp-month {
                width: 100%;
              }
              
              .rdp-caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 0.5rem 1rem;
                font-weight: bold;
                color: white;
              }
              
              .rdp-caption_label {
                font-size: 0.95rem;
                text-transform: capitalize;
              }
              
              .rdp-button_reset {
                color: white;
                background: transparent;
                border: none;
                padding: 0.5rem;
                cursor: pointer;
                border-radius: 0.5rem;
              }
              
              .rdp-button_reset:hover {
                background-color: rgba(75, 85, 99, 0.5);
              }
              
              .rdp-head_cell {
                color: #9CA3AF;
                font-weight: 600;
                font-size: 0.75rem;
                text-transform: uppercase;
              }
              
              .rdp-cell {
                position: relative;
              }
              
              .rdp-day {
                font-size: 0.875rem;
                color: #D1D5DB;
                border-radius: 0.5rem;
                transition: all 0.2s;
              }
              
              .rdp-day:hover:not(.rdp-day_disabled) {
                background-color: rgba(75, 85, 99, 0.5);
                color: white;
              }
              
              .rdp-day_selected {
                background-color: #2E5FA3;
                color: white;
                font-weight: 600;
              }
              
              .rdp-day_today {
                background-color: transparent;
                color: #60A5FA;
                border: 2px solid #60A5FA;
              }
              
              .rdp-day_outside {
                color: #6B7280;
              }
              
              .rdp-day_disabled {
                color: #4B5563;
                cursor: not-allowed;
              }
            `}</style>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={es}
              disabled={disabled}
            />
          </div>
        </Portal>
      )}
    </div>
  );
};
