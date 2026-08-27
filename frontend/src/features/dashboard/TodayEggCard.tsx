import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EggDisplay } from '../../types';
import { formatEggBreakdown } from '../../lib/utils';
import { Egg, Plus, ChevronRight } from 'lucide-react';

interface TodayEggCardProps {
  eggsProduced: number;
  brokenEggs: number;
  eggsSold: number;
  closingStock: number;
  display: EggDisplay;
  hasProductionToday: boolean;
}

export const TodayEggCard: React.FC<TodayEggCardProps> = ({
  eggsProduced,
  brokenEggs,
  eggsSold,
  closingStock,
  display,
  hasProductionToday,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center">
            <Egg size={18} />
          </div>
          <h2 className="text-heading-2 font-bold text-neutral-900">Egg Inventory</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/daily')}
          className="text-caption text-brand-500 font-semibold flex items-center gap-0.5 hover:text-brand-600"
        >
          Daily View <ChevronRight size={14} />
        </button>
      </div>

      {/* No production recorded today banner */}
      {!hasProductionToday && (
        <div className="p-3 bg-warning-100/70 border border-warning-500/20 rounded-md flex items-center justify-between">
          <span className="text-caption font-semibold text-warning-700">No egg production recorded today yet</span>
          <button
            type="button"
            onClick={() => navigate('/daily')}
            className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[11px] rounded shadow-sm flex items-center gap-1 transition-all"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      )}

      {/* Main Closing Stock Display */}
      <div className="p-3.5 bg-brand-50 rounded-md border border-brand-100 flex items-center justify-between">
        <div>
          <span className="text-caption text-neutral-500 uppercase font-semibold block">Current Stock in Hand</span>
          <span className="text-display font-bold text-neutral-900 tabular-nums leading-tight block mt-0.5">
            {closingStock.toLocaleString('en-IN')}{' '}
            <span className="text-body font-normal text-neutral-500">eggs</span>
          </span>
          <span className="text-caption text-brand-600 font-medium block mt-0.5">
            {display.peti} Peti + {display.trays} Trays + {display.looseEggs} Loose
          </span>
        </div>
      </div>

      {/* Today's Movement Sub-stats */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-center">
        <div className="p-2.5 bg-neutral-100 rounded-md">
          <span className="text-caption text-neutral-500 block">Produced Today</span>
          <span className="text-body-lg font-bold text-neutral-900 tabular-nums">
            {eggsProduced.toLocaleString('en-IN')}
          </span>
          {brokenEggs > 0 && (
            <span className="text-[10px] text-danger-500 block">({brokenEggs} broken)</span>
          )}
        </div>

        <div className="p-2.5 bg-neutral-100 rounded-md">
          <span className="text-caption text-neutral-500 block">Sold Today</span>
          <span className="text-body-lg font-bold text-neutral-900 tabular-nums">
            {eggsSold.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-neutral-500 block">({formatEggBreakdown(eggsSold)})</span>
        </div>
      </div>
    </div>
  );
};
