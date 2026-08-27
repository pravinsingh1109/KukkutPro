import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSaleDetail, useSales } from '../../hooks/useSales';
import { TopAppBar } from '../../components/shared/FAB';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatEggBreakdown } from '../../lib/utils';
import { AlertTriangle, Trash2, Ban } from 'lucide-react';

export const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading, error } = useSaleDetail(id || '');
  const { voidSale, isVoiding } = useSales();

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto p-4">
        <div className="h-6 w-32 bg-neutral-200 rounded animate-shimmer mb-4" />
        <div className="h-64 bg-white rounded-md p-4 animate-shimmer" />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto p-4 text-center">
        <p className="text-body text-danger-500 mb-4">Sale record not found.</p>
        <button
          type="button"
          onClick={() => navigate('/sales')}
          className="px-4 py-2 bg-brand-500 text-white rounded-md text-body"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  const handleConfirmVoid = async () => {
    if (!voidReason.trim()) {
      setVoidError('Please enter a reason for voiding this sale');
      return;
    }

    try {
      await voidSale({ id: sale.id, reason: voidReason.trim() });
      setIsVoidModalOpen(false);
      navigate('/sales');
    } catch (err: any) {
      setVoidError(err?.error || 'Failed to void sale');
    }
  };

  const isVoided = sale.status === 'VOIDED';

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar
        title="Sale Details"
        subtitle={`Sale #${sale.id.slice(-6)}`}
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* Main Details Card */}
        <div className="bg-white rounded-md p-5 shadow-sm border border-neutral-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-heading-2 font-bold text-neutral-900">{sale.customerName}</h2>
              <p className="text-caption text-neutral-500">{sale.date}</p>
            </div>
            <StatusBadge status={sale.status} />
          </div>

          {isVoided && (
            <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-md">
              <span className="text-caption font-bold text-danger-500 uppercase block">Voided Entry</span>
              <p className="text-body-sm text-neutral-700 mt-0.5">
                Reason: {sale.voidReason || 'No reason provided'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-caption text-neutral-500 block">Quantity Sold</span>
              <span className="text-body-lg font-bold text-neutral-900">{sale.eggsQty} eggs</span>
              <span className="text-caption text-neutral-500 block mt-0.5">
                {formatEggBreakdown(sale.eggsQty)}
              </span>
            </div>
            <div>
              <span className="text-caption text-neutral-500 block">Price Per Egg</span>
              <span className="text-body-lg font-bold text-neutral-900">₹{sale.pricePerEgg}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <div className="flex justify-between items-center text-body">
              <span className="text-neutral-500">Total Sale Amount:</span>
              <span className="font-bold text-neutral-900">{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-body">
              <span className="text-neutral-500">Cash Received Now:</span>
              <span className="font-semibold text-success-500">{formatCurrency(sale.amountReceived)}</span>
            </div>
            <div className="flex justify-between items-center text-body">
              <span className="text-neutral-500">Remaining Balance Due:</span>
              <span className={`font-bold ${parseFloat(sale.amountDue) > 0 ? 'text-danger-500' : 'text-neutral-700'}`}>
                {formatCurrency(sale.amountDue)}
              </span>
            </div>
          </div>

          {sale.notes && (
            <div className="pt-3 border-t border-neutral-100">
              <span className="text-caption text-neutral-500 block mb-1">Notes:</span>
              <p className="text-body text-neutral-700 bg-neutral-50 p-2.5 rounded-md">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Void action button */}
        {!isVoided && (
          <button
            type="button"
            onClick={() => setIsVoidModalOpen(true)}
            className="w-full h-11 bg-white border border-danger-500 text-danger-500 hover:bg-danger-100 active:scale-95 rounded-md font-semibold text-body flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Ban size={18} /> Void This Sale
          </button>
        )}
      </div>

      {/* Void confirmation modal */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg">
            <div className="w-12 h-12 rounded-full bg-danger-100 text-danger-500 flex items-center justify-center mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-heading-2 font-bold text-neutral-900 mb-1">Void This Sale?</h3>
            <p className="text-body-sm text-neutral-600 mb-4">
              This action will return <strong>{sale.eggsQty} eggs</strong> to your inventory and reverse any cash collected in the Cash Book. This cannot be undone.
            </p>

            {voidError && (
              <div className="p-2 mb-3 bg-danger-100 text-danger-500 text-caption rounded">
                {voidError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-label text-neutral-700 mb-1 font-medium">
                Reason for Voiding <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Wrong quantity entered"
                className="w-full h-10 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="w-1/2 h-11 bg-white border border-neutral-300 rounded-md text-neutral-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={isVoiding}
                className="w-1/2 h-11 bg-danger-500 hover:bg-danger-600 active:scale-95 text-white rounded-md font-semibold transition-all disabled:opacity-50"
              >
                {isVoiding ? 'Voiding...' : 'Yes, Void Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
