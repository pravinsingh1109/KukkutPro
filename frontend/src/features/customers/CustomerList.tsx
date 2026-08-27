import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import { TopAppBar, FAB } from '../../components/shared/FAB';
import { SkeletonRow } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { CustomerQuickAddSheet } from './CustomerQuickAddSheet';
import { formatCurrency } from '../../lib/utils';
import { Users, Search, ChevronRight } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<'dues' | 'all'>('dues');
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const { customers, isLoading } = useCustomers({
    hasDues: filterMode === 'dues' ? true : undefined,
    search: searchTerm.trim() || undefined,
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Customer Ledger" subtitle="Buyer directory & dues tracking" />

      <div className="p-4 space-y-3">
        {/* Filter Toggle */}
        <div className="flex bg-neutral-200/70 p-1 rounded-md">
          <button
            type="button"
            onClick={() => setFilterMode('dues')}
            className={`w-1/2 py-1.5 text-body-sm font-semibold rounded ${
              filterMode === 'dues' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            Who Owes Me (Dues)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`w-1/2 py-1.5 text-body-sm font-semibold rounded ${
              filterMode === 'all' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            All Customers
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full h-11 pl-9 pr-3 rounded-md border border-neutral-300 bg-white text-body focus:border-brand-500 outline-none"
          />
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              heading={filterMode === 'dues' ? 'No Pending Dues!' : 'No Customers Yet'}
              subText={filterMode === 'dues' ? 'All customers are currently paid up.' : 'Add your egg buyers to track sales and credit.'}
              ctaLabel="Add Customer"
              onCta={() => setIsQuickAddOpen(true)}
            />
          ) : (
            customers.map((c) => {
              const outstandingNum = parseFloat(c.outstanding) || 0;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="p-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h3 className="text-body font-bold text-neutral-900">{c.name}</h3>
                    <p className="text-caption text-neutral-500">
                      {c.phone || 'No phone'} {c.lastTransactionDate ? `· Last: ${c.lastTransactionDate}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-body font-bold block ${
                          outstandingNum > 0 ? 'text-danger-500' : 'text-neutral-700'
                        }`}
                      >
                        {formatCurrency(c.outstanding)}
                      </span>
                      <span className="text-caption text-neutral-400 block">
                        {outstandingNum > 0 ? 'Pending' : 'Settled'}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FAB onClick={() => setIsQuickAddOpen(true)} label="Add Customer" />

      <CustomerQuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCustomerCreated={(newCust) => navigate(`/customers/${newCust.id}`)}
      />
    </div>
  );
};
