import React from 'react';
import { formatCurrency, formatEggBreakdown } from '../../lib/utils';

interface CurrencyDisplayProps {
  amount: number | string | null | undefined;
  type?: 'positive' | 'negative' | 'neutral' | 'credit';
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'display';
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  type = 'neutral',
  className = '',
  size = 'base',
}) => {
  const getColorClass = () => {
    switch (type) {
      case 'positive':
        return 'text-success-500';
      case 'negative':
        return 'text-danger-500';
      case 'credit':
        return 'text-warning-500';
      default:
        return 'text-neutral-900';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-body-sm font-medium';
      case 'lg':
        return 'text-heading-2 font-semibold';
      case 'display':
        return 'text-display font-bold';
      default:
        return 'text-body font-semibold';
    }
  };

  return (
    <span className={`tabular-nums ${getColorClass()} ${getSizeClass()} ${className}`}>
      {formatCurrency(amount)}
    </span>
  );
};

interface EggDisplayProps {
  totalEggs: number;
  showBreakdown?: boolean;
  className?: string;
}

export const EggDisplay: React.FC<EggDisplayProps> = ({
  totalEggs,
  showBreakdown = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-heading-2 font-bold tabular-nums text-neutral-900">
        {totalEggs.toLocaleString('en-IN')} <span className="text-body font-normal text-neutral-500">eggs</span>
      </span>
      {showBreakdown && (
        <span className="text-caption text-neutral-500 mt-0.5">
          {formatEggBreakdown(totalEggs)}
        </span>
      )}
    </div>
  );
};
