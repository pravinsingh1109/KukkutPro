import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  subText: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  heading,
  subText,
  ctaLabel,
  onCta,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-heading-3 text-neutral-900 mb-1">{heading}</h3>
      <p className="text-body text-neutral-500 max-w-xs mb-5">{subText}</p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-medium text-body rounded-md shadow-sm transition-all"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong while loading data.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mb-4 text-danger-500">
        <AlertCircle size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-heading-3 text-neutral-900 mb-1">Error Loading Data</h3>
      <p className="text-body text-neutral-500 max-w-xs mb-5">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 bg-white border border-brand-500 text-brand-500 hover:bg-brand-50 active:scale-95 font-medium text-body rounded-md shadow-sm transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
