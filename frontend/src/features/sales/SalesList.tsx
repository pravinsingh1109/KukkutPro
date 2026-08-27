import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '../../hooks/useSales';
import { TopAppBar, FAB } from '../../components/shared/FAB';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { SkeletonRow } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatCurrency, formatEggBreakdown } from '../../lib/utils';
import { ShoppingCart, ChevronRight, Calendar } from 'lucide-react';

export const SalesList: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const queryParams = filterMode === 'today' ? { from: selectedDate, to: selectedDate } : undefined;
  const { sales, isLoading, error } = useSales(queryParams);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar
        title="Egg Sales"
        subtitle={filterMode === 'today' ? `Date: ${selectedDate}` : 'All Recent Sales'}
      />

      {/* Filter Tabs */}
      <div className="p-4 pb-2">
        <div className="flex bg-neutral-200/70 p-1 rounded-md mb-3">
          <button
            type="button"
            onClick={() => setFilterMode('today')}
            className={`w-1/2 py-1.5 text-body-sm font-semibold rounded ${
              filterMode === 'today' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            By Date
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`w-1/2 py-1.5 text-body-sm font-semibold rounded ${
              filterMode === 'all' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            All Sales
          </button>
        </div>

        {filterMode === 'today' && (
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-neutral-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-2 rounded-md border border-neutral-300 bg-white text-body-sm focus:border-brand-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Sales List Container */}
      <div className="px-4">
        <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : sales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              heading="No Sales Found"
              subText={filterMode === 'today' ? `No sales recorded for ${selectedDate}.` : 'You have not recorded any sales yet.'}
              ctaLabel="Record New Sale"
              onCta={() => navigate('/sales/new')}
            />
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => navigate(`/sales/${sale.id}`)}
                className="p-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-bold text-neutral-900">{sale.customerName}</span>
                    <StatusBadge status={sale.status} />
                  </div>
                  <p className="text-caption text-neutral-500">
                    {sale.eggsQty} eggs ({formatEggBreakdown(sale.eggsQty)}) · {sale.date}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-body font-bold text-neutral-900 block">
                      {formatCurrency(sale.totalAmount)}
                    </span>
                    {parseFloat(sale.amountDue) > 0 && (
                      <span className="text-caption font-semibold text-danger-500 block">
                        Due: {formatCurrency(sale.amountDue)}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-neutral-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <FAB onClick={() => navigate('/sales/new')} label="Add Sale" />
    </div>
  );
};
