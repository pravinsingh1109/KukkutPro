import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLabourerDetail } from '../../hooks/useLabour';
import { TopAppBar } from '../../components/shared/FAB';
import { LabourPaymentSheet } from './LabourPaymentSheet';
import { formatCurrency } from '../../lib/utils';
import { Banknote, Phone, Calendar, ArrowUpRight } from 'lucide-react';

export const LabourDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { labourer, isLoading, error } = useLabourerDetail(id || '');

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto p-4">
        <div className="h-6 w-32 bg-neutral-200 rounded animate-shimmer mb-4" />
        <div className="h-44 bg-white rounded-md p-4 animate-shimmer" />
      </div>
    );
  }

  if (error || !labourer) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto p-4 text-center">
        <p className="text-body text-danger-500 mb-4">Labourer not found.</p>
        <button
          type="button"
          onClick={() => navigate('/labour')}
          className="px-4 py-2 bg-brand-500 text-white rounded-md text-body"
        >
          Back to Labourers
        </button>
      </div>
    );
  }

  const outstandingNum = parseFloat(labourer.outstanding) || 0;
  const advanceNum = parseFloat(labourer.advanceBalance) || 0;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar title={labourer.name} onBack={() => navigate('/labour')} />

      <div className="p-4 space-y-4">
        {/* Worker Summary Card */}
        <div className="bg-white rounded-md p-5 shadow-sm border border-neutral-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-heading-1 font-bold text-neutral-900">{labourer.name}</h2>
              <span className="text-body-sm text-neutral-600 font-medium block mt-0.5">
                {labourer.role || 'Farm Worker'}
              </span>
              {labourer.phone && (
                <div className="flex items-center gap-1 text-caption text-neutral-500 mt-1">
                  <Phone size={14} />
                  <span>{labourer.phone}</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-caption text-neutral-500 block uppercase font-semibold">Salary Due</span>
              <span className={`text-heading-1 font-bold block ${outstandingNum > 0 ? 'text-danger-500' : 'text-success-500'}`}>
                {formatCurrency(labourer.outstanding)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-neutral-100 text-caption">
            <div>
              <span className="text-neutral-500 block">Rate / Salary:</span>
              <span className="text-body-sm font-bold text-neutral-900">
                {formatCurrency(labourer.salaryAmount)}/{labourer.salaryType.toLowerCase().replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Joined Farm:</span>
              <span className="text-body-sm font-semibold text-neutral-800">{labourer.joiningDate}</span>
            </div>
          </div>

          {advanceNum > 0 && (
            <div className="mt-3 p-2.5 bg-info-100/60 rounded-md flex justify-between items-center text-body-sm">
              <span className="text-info-700 font-medium">Unrecovered Advance:</span>
              <span className="font-bold text-info-700">{formatCurrency(labourer.advanceBalance)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsPaymentSheetOpen(true)}
            className="w-full h-11 mt-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Banknote size={18} /> Record Salary / Advance
          </button>
        </div>

        {/* Payment History */}
        <div>
          <h3 className="text-heading-3 font-bold text-neutral-900 mb-2 px-1">Payment History</h3>
          <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
            {!labourer.payments || labourer.payments.length === 0 ? (
              <p className="p-6 text-center text-body text-neutral-500">No disbursements recorded yet.</p>
            ) : (
              labourer.payments.map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-semibold text-neutral-900">{p.date}</span>
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                          p.paymentType === 'ADVANCE' ? 'bg-info-100 text-info-500' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {p.paymentType}
                      </span>
                    </div>
                    {p.notes && <span className="text-caption text-neutral-500 block mt-0.5">{p.notes}</span>}
                  </div>
                  <span className="text-body font-bold text-danger-500">-{formatCurrency(p.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <LabourPaymentSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        labourerId={labourer.id}
        labourerName={labourer.name}
        outstanding={labourer.outstanding}
      />
    </div>
  );
};
