import React from 'react';
import { SaleStatus } from '../../types';

interface StatusBadgeProps {
  status: SaleStatus | 'ADVANCE';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'PAID':
        return 'bg-success-100 text-success-500 border-success-500/20';
      case 'PARTIAL':
        return 'bg-warning-100 text-warning-500 border-warning-500/20';
      case 'UNPAID':
        return 'bg-danger-100 text-danger-500 border-danger-500/20';
      case 'VOIDED':
        return 'bg-neutral-100 text-neutral-500 border-neutral-300';
      case 'ADVANCE':
        return 'bg-info-100 text-info-500 border-info-500/20';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getDotStyle = () => {
    switch (status) {
      case 'PAID':
        return 'bg-success-500';
      case 'PARTIAL':
        return 'bg-warning-500';
      case 'UNPAID':
        return 'bg-danger-500';
      case 'VOIDED':
        return 'bg-neutral-500';
      case 'ADVANCE':
        return 'bg-info-500';
      default:
        return 'bg-neutral-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label font-medium border ${getBadgeStyle()} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};
