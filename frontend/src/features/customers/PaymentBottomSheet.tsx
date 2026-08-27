import React, { useState } from 'react';
import { useCustomerDetail } from '../../hooks/useCustomers';
import { BottomSheet } from '../../components/shared/BottomSheet';
import { formatCurrency } from '../../lib/utils';
import { IndianRupee, AlertTriangle, Check } from 'lucide-react';

interface PaymentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  outstanding: string;
}

export const PaymentBottomSheet: React.FC<PaymentBottomSheetProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  outstanding,
}) => {
  const { recordPayment, isRecordingPayment } = useCustomerDetail(customerId);
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const outstandingNum = parseFloat(outstanding) || 0;
  const amountNum = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountNum <= 0) {
      setError('Please enter an amount greater than zero');
      return;
    }

    if (amountNum > outstandingNum && !showAdvanceModal) {
      setShowAdvanceModal(true);
      return;
    }

    await executePayment(false);
  };

  const executePayment = async (isAdvance: boolean) => {
    try {
      await recordPayment({
        date,
        amount: amountNum.toFixed(2),
        isAdvance,
        notes: notes.trim() || undefined,
      });

      setShowAdvanceModal(false);
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: any) {
      if (err?.code === 'EXCEEDS_OUTSTANDING') {
        setShowAdvanceModal(true);
      } else {
        setError(err?.error || 'Failed to record payment');
      }
    }
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title={`Receive Payment — ${customerName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-neutral-100 rounded-md flex justify-between items-center">
            <span className="text-body-sm text-neutral-600">Current Outstanding Dues:</span>
            <span className="text-body-lg font-bold text-danger-500">{formatCurrency(outstanding)}</span>
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Amount Received (₹) <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-body text-neutral-500">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-8 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none font-semibold"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cash handed over at shop"
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 h-11 bg-white border border-neutral-300 rounded-md font-semibold text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRecordingPayment}
              className="w-2/3 h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isRecordingPayment ? 'Recording...' : 'Confirm Payment'} <Check size={18} />
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Advance Modal Prompt */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg">
            <h3 className="text-heading-2 font-bold text-neutral-900 mb-2">Advance Payment?</h3>
            <p className="text-body-sm text-neutral-600 mb-4">
              The entered amount of <strong>{formatCurrency(amountNum)}</strong> exceeds the outstanding balance of{' '}
              <strong>{formatCurrency(outstandingNum)}</strong>.
            </p>
            <p className="text-body-sm text-neutral-600 mb-5">
              Would you like to mark the extra <strong>{formatCurrency(amountNum - outstandingNum)}</strong> as an advance
              payment to be applied to future sales?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanceModal(false)}
                className="w-1/3 h-11 bg-white border border-neutral-300 rounded-md text-neutral-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executePayment(true)}
                className="w-2/3 h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-md font-semibold"
              >
                Yes, Mark as Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
