import React, { useState } from 'react';
import { useCashbook } from '../../hooks/useCashbook';
import { BottomSheet } from '../../components/shared/BottomSheet';
import { CashEntryType } from '../../types';
import { AlertTriangle, Check } from 'lucide-react';

interface ManualCashEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualCashEntrySheet: React.FC<ManualCashEntrySheetProps> = ({ isOpen, onClose }) => {
  const { addManualEntry, isAddingManual } = useCashbook();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [type, setType] = useState<CashEntryType>('IN');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(amount) || 0;

    if (amountNum <= 0) {
      setError('Please enter an amount greater than zero');
      return;
    }

    if (!notes.trim()) {
      setError('Reason/notes are required for manual cash adjustments');
      return;
    }

    try {
      await addManualEntry({
        date,
        type,
        amount: amountNum.toFixed(2),
        notes: notes.trim(),
      });
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.error || 'Failed to record cash entry');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Manual Cash Adjustment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Type Toggle: IN vs OUT */}
        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">Entry Direction</label>
          <div className="flex bg-neutral-100 p-1 rounded-md border border-neutral-300">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`w-1/2 py-2 text-body-sm font-semibold rounded ${
                type === 'IN' ? 'bg-success-500 text-white shadow-sm' : 'text-neutral-600'
              }`}
            >
              + Cash In (Receipt)
            </button>
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`w-1/2 py-2 text-body-sm font-semibold rounded ${
                type === 'OUT' ? 'bg-danger-500 text-white shadow-sm' : 'text-neutral-600'
              }`}
            >
              - Cash Out (Withdrawal)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
          />
        </div>

        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">
            Amount (₹) <span className="text-danger-500">*</span>
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
          <label className="block text-label text-neutral-700 mb-1 font-medium">
            Reason / Notes <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Sold empty egg cartons / Owner withdrawal"
            className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            required
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
            disabled={isAddingManual}
            className="w-2/3 h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isAddingManual ? 'Saving...' : 'Record Adjustment'} <Check size={18} />
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
