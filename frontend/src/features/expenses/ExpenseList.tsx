import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../../hooks/useExpenses';
import { useSettings } from '../../hooks/useSettings';
import { TopAppBar, FAB } from '../../components/shared/FAB';
import { SkeletonRow } from '../../components/shared/SkeletonCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatCurrency } from '../../lib/utils';
import { Receipt, Filter, ChevronRight } from 'lucide-react';

export const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { expenses, isLoading } = useExpenses({
    category: selectedCategory === 'ALL' ? undefined : selectedCategory,
  });

  const categories = ['ALL', ...(settings?.expenseCategories || [])];

  const totalSpent = expenses.reduce((acc, e) => acc + parseFloat(e.totalAmount || '0'), 0);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Farm Expenses" subtitle="Operational costs & supplies" />

      <div className="p-4 space-y-3">
        {/* Category Pills Slider */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-caption font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Total Spent Summary */}
        <div className="bg-white rounded-md p-3.5 shadow-sm border border-neutral-100 flex justify-between items-center">
          <span className="text-body-sm text-neutral-600 font-medium">Total Expenses Shown:</span>
          <span className="text-heading-3 font-bold text-danger-500 tabular-nums">
            {formatCurrency(totalSpent)}
          </span>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              heading="No Expenses Logged"
              subText="Track your feed, medicines, vaccines, and electricity costs."
              ctaLabel="Log First Expense"
              onCta={() => navigate('/expenses/new')}
            />
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-bold text-neutral-900">{expense.description}</span>
                    <span className="px-1.5 py-0.2 bg-neutral-100 text-neutral-600 text-[10px] rounded font-semibold border border-neutral-200">
                      {expense.category}
                    </span>
                  </div>
                  <span className="text-caption text-neutral-500 block mt-0.5">
                    {expense.date} {expense.quantity ? `· Qty: ${expense.quantity}` : ''}{' '}
                    {expense.unitCost ? `· Rate: ₹${expense.unitCost}` : ''}
                  </span>
                  {expense.notes && <span className="text-caption text-neutral-400 block">{expense.notes}</span>}
                </div>

                <span className="text-body font-bold text-danger-500 tabular-nums">
                  -{formatCurrency(expense.totalAmount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <FAB onClick={() => navigate('/expenses/new')} label="Add Expense" />
    </div>
  );
};
