import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProduction, useProductionDate } from '../../hooks/useProduction';
import { breakdownEggs } from '../../lib/utils';
import { TopAppBar } from '../../components/shared/FAB';
import { Egg, AlertTriangle, Check } from 'lucide-react';

export const ProductionForm: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [eggsProduced, setEggsProduced] = useState<number | ''>('');
  const [brokenEggs, setBrokenEggs] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const { createProduction, updateProduction, isCreating, isUpdating } = useProduction();
  const { data: existingForDate } = useProductionDate(date);

  const safeProduced = typeof eggsProduced === 'number' ? eggsProduced : 0;
  const safeBroken = typeof brokenEggs === 'number' ? brokenEggs : 0;
  const eggBreakdown = breakdownEggs(safeProduced);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (safeProduced < 0) {
      setInlineError('Eggs produced cannot be negative');
      return;
    }

    if (safeBroken > safeProduced) {
      setInlineError('Broken eggs cannot exceed total eggs produced');
      return;
    }

    // Check if duplicate entry exists for date and we aren't already editing it
    if (existingForDate && !existingId) {
      setShowDuplicateModal(true);
      return;
    }

    try {
      if (existingId) {
        await updateProduction({
          id: existingId,
          data: {
            eggsProduced: safeProduced,
            brokenEggs: safeBroken,
            notes,
          },
        });
      } else {
        await createProduction({
          date,
          eggsProduced: safeProduced,
          brokenEggs: safeBroken,
          notes,
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err?.code === 'DUPLICATE_ENTRY') {
        setShowDuplicateModal(true);
      } else {
        setInlineError(err?.error || 'Failed to save production. Please try again.');
      }
    }
  };

  const handleEditExisting = () => {
    if (existingForDate) {
      setExistingId(existingForDate.id);
      setEggsProduced(existingForDate.eggsProduced);
      setBrokenEggs(existingForDate.brokenEggs);
      setNotes(existingForDate.notes || '');
      setShowDuplicateModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar
        title={existingId ? 'Edit Daily Production' : 'Record Daily Production'}
        onBack={() => navigate(-1)}
      />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-4">
          {inlineError && (
            <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{inlineError}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Entry Date <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setExistingId(null);
              }}
              className="w-full h-12 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          {/* Eggs Produced */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Total Eggs Produced <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={eggsProduced}
                onChange={(e) => setEggsProduced(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="e.g. 4620"
                className="w-full h-12 px-3 pr-16 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none"
                required
                autoFocus
              />
              <span className="absolute right-3 top-3 text-body text-neutral-500">eggs</span>
            </div>
          </div>

          {/* Live Unit Breakdown Preview */}
          <div className="p-3 bg-brand-50 rounded-md border border-brand-100 flex items-center justify-between">
            <span className="text-caption text-neutral-500 uppercase font-semibold">Equivalent:</span>
            <span className="text-body font-semibold text-brand-600">
              {eggBreakdown.peti} Peti + {eggBreakdown.trays} Trays + {eggBreakdown.loose} Loose
            </span>
          </div>

          {/* Broken Eggs */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Broken / Damaged Eggs
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={brokenEggs}
                onChange={(e) => setBrokenEggs(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full h-12 px-3 pr-16 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none"
              />
              <span className="absolute right-3 top-3 text-body text-neutral-500">eggs</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any remarks on flock or temperature..."
              rows={2}
              className="w-full p-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none resize-none"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {isCreating || isUpdating ? 'Saving...' : existingId ? 'Update Production' : 'Save Production'}
            <Check size={18} />
          </button>
        </form>
      </div>

      {/* Duplicate entry confirmation modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg">
            <h3 className="text-heading-2 font-bold text-neutral-900 mb-2">Entry Already Exists</h3>
            <p className="text-body text-neutral-600 mb-5">
              You already recorded production for <strong>{date}</strong>. Would you like to view and edit that existing entry instead?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="w-1/2 h-11 bg-white border border-neutral-300 rounded-md text-neutral-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditExisting}
                className="w-1/2 h-11 bg-brand-500 hover:bg-brand-600 text-white rounded-md font-semibold"
              >
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
