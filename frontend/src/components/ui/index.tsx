import type { ReactNode } from 'react';
export { Dropdown } from './Dropdown';
export { DatePicker } from './DatePicker';
export { Portal } from './Portal';

/* ── Modal ── */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--surface-overlay)' }} onClick={onClose} />
      <div className="relative card p-6 w-full max-w-lg animate-slide-up" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
        </div>
      </div>
    </>
  );
};

/* ── Badge ── */
export const Badge = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`badge ${className}`}>{children}</span>
);

/* ── ProgressBar ── */
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar = ({ value, max = 100, className = '', showLabel = true }: ProgressBarProps) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span>{value}/{max}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-neutral-200)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
             style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary-500)' }} />
      </div>
    </div>
  );
};

/* ── LoadingSpinner ── */
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-2 rounded-full animate-spin`}
           style={{ borderColor: 'var(--color-neutral-200)', borderTopColor: 'var(--color-primary-500)' }} />
    </div>
  );
};

/* ── EmptyState ── */
export const EmptyState = ({ icon = '📭', title, description, action }: {
  icon?: string; title: string; description?: string; action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <span className="text-5xl mb-4">{icon}</span>
    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    {description && <p className="max-w-md mb-6" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
    {action}
  </div>
);
