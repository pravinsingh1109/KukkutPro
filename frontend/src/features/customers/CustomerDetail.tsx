import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerDetail } from '../../hooks/useCustomers';
import { TopAppBar } from '../../components/shared/FAB';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PaymentBottomSheet } from './PaymentBottomSheet';
import { formatCurrency, formatEggBreakdown } from '../../lib/utils';
import { IndianRupee, Phone, MapPin, ChevronRight } from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, isLoading, error } = useCustomerDetail(id || '');

  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'payments'>('summary');
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto p-4">
        <div className="h-6 w-32 bg-neutral-200 rounded animate-shimmer mb-4" />
        <div className="h-44 bg-white rounded-md p-4 animate-shimmer" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto p-4 text-center">
        <p className="text-body text-danger-500 mb-4">Customer not found.</p>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-brand-500 text-white rounded-md text-body"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const outstandingNum = parseFloat(customer.outstanding) || 0;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar title={customer.name} onBack={() => navigate('/customers')} />

      <div className="p-4 space-y-4">
        {/* Customer Header Card */}
        <div className="bg-white rounded-md p-5 shadow-sm border border-neutral-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-heading-1 font-bold text-neutral-900">{customer.name}</h2>
              {customer.phone && (
                <div className="flex items-center gap-1 text-caption text-neutral-500 mt-1">
                  <Phone size={14} />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1 text-caption text-neutral-500 mt-0.5">
                  <MapPin size={14} />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-caption text-neutral-500 block uppercase font-semibold">Outstanding Dues</span>
              <span className={`text-heading-1 font-bold block ${outstandingNum > 0 ? 'text-danger-500' : 'text-success-500'}`}>
                {formatCurrency(customer.outstanding)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentSheetOpen(true)}
            className="w-full h-11 mt-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <IndianRupee size={18} /> Receive Payment
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-200/70 p-1 rounded-md">
          {(['summary', 'sales', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-body-sm font-semibold rounded capitalize ${
                activeTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Summary */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-body text-neutral-600">Total Lifetime Purchases</span>
              <span className="text-body font-bold text-neutral-900">{formatCurrency(customer.totalPurchases)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-body text-neutral-600">Total Payments Made</span>
              <span className="text-body font-bold text-success-500">{formatCurrency(customer.totalPaid)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-body font-semibold text-neutral-900">Current Balance Due</span>
              <span className="text-body font-bold text-danger-500">{formatCurrency(customer.outstanding)}</span>
            </div>
          </div>
        )}

        {/* Tab 2: Sales History */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
            {!customer.sales || customer.sales.length === 0 ? (
              <p className="p-6 text-center text-body text-neutral-500">No sales recorded for this customer yet.</p>
            ) : (
              customer.sales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => navigate(`/sales/${sale.id}`)}
                  className="p-3.5 hover:bg-neutral-50 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-semibold text-neutral-900">{sale.date}</span>
                      <StatusBadge status={sale.status} />
                    </div>
                    <span className="text-caption text-neutral-500">
                      {sale.eggsQty} eggs ({formatEggBreakdown(sale.eggsQty)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-body font-bold text-neutral-900 block">{formatCurrency(sale.totalAmount)}</span>
                      {parseFloat(sale.amountDue) > 0 && (
                        <span className="text-caption text-danger-500 font-semibold block">
                          Due: {formatCurrency(sale.amountDue)}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
            {!customer.payments || customer.payments.length === 0 ? (
              <p className="p-6 text-center text-body text-neutral-500">No payments recorded yet.</p>
            ) : (
              customer.payments.map((payment) => (
                <div key={payment.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-body font-semibold text-neutral-900 block">{payment.date}</span>
                    {payment.notes && <span className="text-caption text-neutral-500 block">{payment.notes}</span>}
                    {payment.isAdvance && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-info-100 text-info-500 rounded">
                        Advance
                      </span>
                    )}
                  </div>
                  <span className="text-body font-bold text-success-500">+{formatCurrency(payment.amount)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <PaymentBottomSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        outstanding={customer.outstanding}
      />
    </div>
  );
};
