import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import { Users, AlertCircle, ChevronRight } from 'lucide-react';

interface TopCustomerDue {
  id: string;
  name: string;
  outstanding: string;
}

interface OutstandingCardProps {
  totalCustomerDues: string;
  totalLabourDues: string;
  topCustomers: TopCustomerDue[];
}

export const OutstandingCard: React.FC<OutstandingCardProps> = ({
  totalCustomerDues,
  totalLabourDues,
  topCustomers,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-danger-100 text-danger-500 flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
          <h2 className="text-heading-2 font-bold text-neutral-900">Outstanding Dues</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="text-caption text-brand-500 font-semibold flex items-center gap-0.5 hover:text-brand-600"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-neutral-100 rounded-md">
          <span className="text-caption text-neutral-500 uppercase font-semibold block">Customer Dues</span>
          <span className="text-heading-2 font-bold text-danger-500 tabular-nums block mt-0.5">
            {formatCurrency(totalCustomerDues)}
          </span>
        </div>

        <div className="p-3 bg-neutral-100 rounded-md">
          <span className="text-caption text-neutral-500 uppercase font-semibold block">Labour Salary Due</span>
          <span className="text-heading-2 font-bold text-neutral-800 tabular-nums block mt-0.5">
            {formatCurrency(totalLabourDues)}
          </span>
        </div>
      </div>

      {/* Top 3 Customers By Outstanding */}
      {topCustomers.length > 0 && (
        <div className="pt-2 border-t border-neutral-100">
          <span className="text-caption text-neutral-500 uppercase font-semibold block mb-2">
            Top Unsettled Buyers
          </span>
          <div className="divide-y divide-neutral-100">
            {topCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => navigate(`/customers/${cust.id}`)}
                className="py-2 flex items-center justify-between hover:bg-neutral-50 rounded px-1 cursor-pointer transition-colors"
              >
                <span className="text-body-sm font-semibold text-neutral-900">{cust.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-body-sm font-bold text-danger-500 tabular-nums">
                    {formatCurrency(cust.outstanding)}
                  </span>
                  <ChevronRight size={14} className="text-neutral-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
