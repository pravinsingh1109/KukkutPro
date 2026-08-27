import React from 'react';
import { Plus, LucideIcon } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  icon?: LucideIcon;
  label?: string;
  className?: string;
}

export const FAB: React.FC<FABProps> = ({
  onClick,
  icon: Icon = Plus,
  label = 'Add',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white shadow-md flex items-center justify-center transition-all ${className}`}
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <Icon size={24} strokeWidth={2.5} />
    </button>
  );
};

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 h-14 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-neutral-100 active:scale-95 text-neutral-700"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-heading-2 font-semibold text-neutral-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-caption text-neutral-500">{subtitle}</p>
          )}
        </div>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
};

export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <main
      className={`min-h-screen bg-neutral-50 pb-24 px-4 pt-4 max-w-md mx-auto ${className}`}
    >
      {children}
    </main>
  );
};
