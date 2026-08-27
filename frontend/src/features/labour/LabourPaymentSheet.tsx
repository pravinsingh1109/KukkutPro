import React, { useState } from 'react';
import { useLabourerDetail } from '../../hooks/useLabour';
import { BottomSheet } from '../../components/shared/BottomSheet';
import { PaymentType } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AlertTriangle, Check } from 'lucide-react';

interface LabourPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  labourerId: string;
  labourerName: string;
  outstanding: string;
}

export const LabourPaymentSheet: React.FC<LabourPaymentSheetProps> = ({
  isOpen,
  onClose,
  labourerId,
  labourerName,
  outstanding,
}) => {
  const { recordPayment, isRecordingPayment } = useLabourerDetail(labourerId);
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [paymentType, setPaymentType] = useState<PaymentType>('SALARY');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const outstandingNum = parseFloat(outstanding) || 0;
  const amountNum = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountNum <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (paymentType === 'SALARY' && amountNum > outstandingNum) {
      setError(
        `Salary outstanding is only ${formatCurrency(outstandingNum)}. To pay more, select Advance.`
      );
      return;
    }

    try {
      await recordPayment({
        date,
        paymentType,
        amount: amountNum.toFixed(2),
        notes: notes.trim() || undefined,
      });

      setAmount('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.error || 'Failed to record payment');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Pay Worker — ${labourerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-neutral-100 rounded-md flex justify-between items-center">
          <span className="text-body-sm text-neutral-600">Current Outstanding Salary:</span>
          <span className="text-body-lg font-bold text-danger-500">{formatCurrency(outstanding)}</span>
        </div>

        {/* Payment Type Toggle */}
        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">Payment Purpose</label>
          <div className="flex bg-neutral-100 p-1 rounded-md border border-neutral-300">
            <button
              type="button"
              onClick={() => setPaymentType('SALARY')}
              className={`w-1/2 py-2 text-body-sm font-semibold rounded ${
                paymentType === 'SALARY' ? 'bg-brand-500 text-white shadow-sm' : 'text-neutral-600'
              }`}
            >
              Salary Payment
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('ADVANCE')}
              className={`w-1/2 py-2 text-body-sm font-semibold rounded ${
                paymentType === 'ADVANCE' ? 'bg-info-500 text-white shadow-sm' : 'text-neutral-600'
              }`}
            >
              Advance Cash
            </button>
          </div>
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
            Amount Paid (₹) <span className="text-danger-500">*</span>
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
            placeholder="e.g. Month of August partial payment"
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
  );
};
