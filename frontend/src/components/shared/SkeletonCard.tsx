import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-md p-4 shadow-sm border border-neutral-100 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 w-28 bg-neutral-200 rounded animate-shimmer" />
        <div className="h-4 w-12 bg-neutral-200 rounded animate-shimmer" />
      </div>
      <div className="h-8 w-36 bg-neutral-200 rounded mb-2 animate-shimmer" />
      <div className="h-3 w-48 bg-neutral-200 rounded animate-shimmer" />
    </div>
  );
};

export const SkeletonRow: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-neutral-100 min-h-[64px] ${className}`}>
      <div className="space-y-2">
        <div className="h-4 w-32 bg-neutral-200 rounded animate-shimmer" />
        <div className="h-3 w-20 bg-neutral-200 rounded animate-shimmer" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-4 w-16 bg-neutral-200 rounded ml-auto animate-shimmer" />
        <div className="h-3 w-12 bg-neutral-200 rounded ml-auto animate-shimmer" />
      </div>
    </div>
  );
};
