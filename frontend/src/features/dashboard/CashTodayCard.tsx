import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, ChevronRight } from 'lucide-react';

interface CashTodayCardProps {
  cashCollected: string;
  creditSales: string;
  totalExpenses: string;
  closingBalance: string;
}

export const CashTodayCard: React.FC<CashTodayCardProps> = ({
  cashCollected,
  creditSales,
  totalExpenses,
  closingBalance,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-success-100 text-success-500 flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <h2 className="text-heading-2 font-bold text-neutral-900">Cash & Flow Today</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cashbook')}
          className="text-caption text-brand-500 font-semibold flex items-center gap-0.5 hover:text-brand-600"
        >
          Cash Book <ChevronRight size={14} />
        </button>
      </div>

      {/* Expected Closing Cash in Hand */}
      <div className="p-3.5 bg-neutral-100 rounded-md border border-neutral-200 flex justify-between items-center">
        <div>
          <span className="text-caption text-neutral-500 uppercase font-semibold block">
            Expected Physical Cash
          </span>
          <span className="text-display font-bold text-neutral-900 tabular-nums leading-tight block mt-0.5">
            {formatCurrency(closingBalance)}
          </span>
        </div>
      </div>

      {/* 3 Metric Pills: Collected (Green), Credit (Amber), Expenses (Red) */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="p-2 bg-success-100/40 rounded-md border border-success-500/10">
          <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-success-500 uppercase mb-0.5">
            <ArrowDownLeft size={12} /> Cash In
          </div>
          <span className="text-body font-bold text-success-500 tabular-nums block">
            +{formatCurrency(cashCollected)}
          </span>
        </div>

        <div className="p-2 bg-warning-100/40 rounded-md border border-warning-500/10">
          <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-warning-500 uppercase mb-0.5">
            <Clock size={12} /> Credit
          </div>
          <span className="text-body font-bold text-warning-500 tabular-nums block">
            {formatCurrency(creditSales)}
          </span>
        </div>

        <div className="p-2 bg-danger-100/40 rounded-md border border-danger-500/10">
          <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-danger-500 uppercase mb-0.5">
            <ArrowUpRight size={12} /> Expenses
          </div>
          <span className="text-body font-bold text-danger-500 tabular-nums block">
            -{formatCurrency(totalExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
};
