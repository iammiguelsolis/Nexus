import type { ReactNode } from 'react';

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative glass rounded-2xl p-6 w-full max-w-lg animate-slide-up shadow-2xl shadow-nexus-900/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white font-display">{title}</h3>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export const Badge = ({ children, className = '' }: BadgeProps) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
    {children}
  </span>
);

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
        <div className="flex justify-between text-xs text-dark-300 mb-1">
          <span>{value}/{max}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-nexus-600 to-success-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-2 border-nexus-600/30 border-t-nexus-400 rounded-full animate-spin`} />
    </div>
  );
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon = '📭', title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <span className="text-5xl mb-4">{icon}</span>
    <h3 className="text-lg font-semibold text-dark-200 mb-2">{title}</h3>
    {description && <p className="text-dark-400 max-w-md mb-6">{description}</p>}
    {action}
  </div>
);
