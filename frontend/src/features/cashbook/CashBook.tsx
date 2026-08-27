import React, { useState } from 'react';
import { useCashbook } from '../../hooks/useCashbook';
import { TopAppBar, FAB } from '../../components/shared/FAB';
import { ManualCashEntrySheet } from './ManualCashEntrySheet';
import { SkeletonRow } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatCurrency } from '../../lib/utils';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Calendar } from 'lucide-react';

export const CashBook: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isManualSheetOpen, setIsManualSheetOpen] = useState(false);

  const { cashbook, isLoading } = useCashbook(selectedDate, selectedDate);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Cash Book" subtitle="Daily cash flow ledger & verification" />

      <div className="p-4 space-y-4">
        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white p-3 rounded-md border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-neutral-500" />
            <span className="text-body font-semibold text-neutral-800">Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 px-2 rounded-md border border-neutral-300 bg-neutral-50 text-body-sm focus:border-brand-500 outline-none font-medium"
          />
        </div>

        {/* Daily Cash Summary Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100 text-body-sm">
            <span className="text-neutral-500">Opening Balance:</span>
            <span className="font-semibold text-neutral-800 tabular-nums">
              {formatCurrency(cashbook?.openingBalance)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-2.5 bg-success-100/50 rounded-md border border-success-500/10">
              <div className="flex items-center gap-1 text-caption font-bold text-success-500 uppercase mb-0.5">
                <ArrowDownLeft size={14} /> Total In
              </div>
              <span className="text-heading-3 font-bold text-success-500 tabular-nums">
                +{formatCurrency(cashbook?.summary.totalIn)}
              </span>
            </div>

            <div className="p-2.5 bg-danger-100/50 rounded-md border border-danger-500/10">
              <div className="flex items-center gap-1 text-caption font-bold text-danger-500 uppercase mb-0.5">
                <ArrowUpRight size={14} /> Total Out
              </div>
              <span className="text-heading-3 font-bold text-danger-500 tabular-nums">
                -{formatCurrency(cashbook?.summary.totalOut)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
            <div>
              <span className="text-caption text-neutral-500 uppercase font-semibold block">Expected Cash in Hand</span>
              <span className="text-heading-1 font-bold text-neutral-900 tabular-nums">
                {formatCurrency(cashbook?.closingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Entries Header */}
        <div className="flex items-center justify-between pt-1">
          <h3 className="text-heading-3 font-bold text-neutral-900">Today's Transactions</h3>
          <button
            type="button"
            onClick={() => setIsManualSheetOpen(true)}
            className="text-body-sm text-brand-500 font-semibold hover:text-brand-600 flex items-center gap-1"
          >
            <Plus size={16} /> Add Adjustment
          </button>
        </div>

        {/* Entries List */}
        <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : !cashbook || cashbook.entries.length === 0 ? (
            <EmptyState
              icon={Wallet}
              heading="No Cash Activity"
              subText={`No transactions recorded for ${selectedDate}. Any sale, payment, or expense will auto-post here.`}
            />
          ) : (
            cashbook.entries.map((entry) => {
              const isCashIn = entry.type === 'IN';
              return (
                <div key={entry.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCashIn ? 'bg-success-100 text-success-500' : 'bg-danger-100 text-danger-500'
                      }`}
                    >
                      {isCashIn ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-body font-semibold text-neutral-900">
                          {entry.notes || (isCashIn ? 'Cash Receipt' : 'Cash Disbursement')}
                        </span>
                        {entry.isManual && (
                          <span className="px-1.5 py-0.2 bg-neutral-100 text-neutral-600 text-[10px] rounded font-medium border border-neutral-200">
                            Manual
                          </span>
                        )}
                      </div>
                      <span className="text-caption text-neutral-400 block mt-0.5">
                        Source: {entry.source.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-body font-bold tabular-nums ${
                      isCashIn ? 'text-success-500' : 'text-danger-500'
                    }`}
                  >
                    {isCashIn ? '+' : '-'}{formatCurrency(entry.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FAB onClick={() => setIsManualSheetOpen(true)} label="Add Adjustment" />

      <ManualCashEntrySheet
        isOpen={isManualSheetOpen}
        onClose={() => setIsManualSheetOpen(false)}
      />
    </div>
  );
};
