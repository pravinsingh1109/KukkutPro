import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduction, useProductionDate, useProductionEntry } from '../../hooks/useProduction';
import { breakdownEggs } from '../../lib/utils';
import { TopAppBar } from '../../components/shared/FAB';
import { Egg, AlertTriangle, Check, Loader2, ArrowRight } from 'lucide-react';

export const ProductionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [eggsProduced, setEggsProduced] = useState<number | ''>('');
  const [brokenEggs, setBrokenEggs] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(routeId || null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { createProduction, updateProduction, isCreating, isUpdating } = useProduction();
  
  // Fetch existing record by ID (if in edit route) or by date (if checking duplicate in create route)
  const { data: routeEntry, isLoading: isLoadingRouteEntry } = useProductionEntry(routeId);
  const { data: existingForDate } = useProductionDate(date);

  // Pre-populate fields when opened in edit mode via /production/edit/:id
  useEffect(() => {
    if (routeEntry && !isInitialized) {
      setDate(routeEntry.date);
      setEggsProduced(routeEntry.eggsProduced);
      setBrokenEggs(routeEntry.brokenEggs);
      setNotes(routeEntry.notes || '');
      setExistingId(routeEntry.id);
      setIsInitialized(true);
    }
  }, [routeEntry, isInitialized]);

  const safeProduced = typeof eggsProduced === 'number' ? eggsProduced : 0;
  const safeBroken = typeof brokenEggs === 'number' ? brokenEggs : 0;
  const eggBreakdown = breakdownEggs(safeProduced);

  const isEditMode = Boolean(existingId || routeId);

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

    // If we're in CREATE mode (/production/new), but an entry already exists for this date, show update confirmation
    if (!isEditMode && existingForDate) {
      setShowDuplicateModal(true);
      return;
    }

    try {
      const targetId = existingId || routeId;
      if (targetId) {
        await updateProduction({
          id: targetId,
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
      navigate('/daily');
    } catch (err: any) {
      if (err?.code === 'DUPLICATE_ENTRY') {
        setShowDuplicateModal(true);
      } else {
        setInlineError(err?.error || 'Failed to save production. Please try again.');
      }
    }
  };

  // Direct 1-tap overwrite: saves the newly typed values to the existing record
  const handleOverwriteExisting = async () => {
    if (!existingForDate) return;
    try {
      setInlineError(null);
      await updateProduction({
        id: existingForDate.id,
        data: {
          eggsProduced: safeProduced,
          brokenEggs: safeBroken,
          notes,
        },
      });
      setShowDuplicateModal(false);
      navigate('/daily');
    } catch (err: any) {
      setShowDuplicateModal(false);
      setInlineError(err?.error || 'Failed to update existing entry.');
    }
  };

  // Option to inspect previous values
  const handleLoadPrevious = () => {
    if (existingForDate) {
      setExistingId(existingForDate.id);
      setEggsProduced(existingForDate.eggsProduced);
      setBrokenEggs(existingForDate.brokenEggs);
      setNotes(existingForDate.notes || '');
      setShowDuplicateModal(false);
    }
  };

  if (routeId && isLoadingRouteEntry) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 size={20} className="animate-spin text-brand-500" />
          <span>Loading production entry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar
        title={isEditMode ? 'Edit Daily Production' : 'Record Daily Production'}
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
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Entry Date <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              disabled={isEditMode}
              onChange={(e) => {
                setDate(e.target.value);
                setExistingId(null); // reset ID if date changed in create mode
              }}
              className={`w-full h-12 px-3 rounded-md border border-neutral-300 text-body focus:border-brand-500 outline-none tabular-nums font-medium ${
                isEditMode ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : 'bg-white'
              }`}
              required
            />
            {isEditMode && (
              <p className="text-[11px] text-neutral-400 mt-1">
                Date cannot be changed during edit. Create a new entry if recording for another day.
              </p>
            )}
          </div>

          {/* Total Eggs Produced */}
          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Total Eggs Produced <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={eggsProduced}
                onChange={(e) => setEggsProduced(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="e.g. 4800"
                className="w-full h-12 px-3 pr-16 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none font-semibold"
                required
                autoFocus
              />
              <span className="absolute right-3 top-3 text-body text-neutral-500">eggs</span>
            </div>

            {/* Equivalent Peti / Tray breakdown badge */}
            <div className="mt-2 p-2.5 bg-brand-50 rounded-md border border-brand-100 flex items-center justify-between text-body-sm">
              <span className="text-caption text-neutral-500 uppercase font-semibold">Equivalent:</span>
              <span className="font-semibold text-brand-600 tabular-nums">
                {eggBreakdown.peti} Peti + {eggBreakdown.trays} Trays + {eggBreakdown.loose} Loose
              </span>
            </div>
          </div>

          {/* Broken / Damaged Eggs */}
          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Broken / Damaged Eggs
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={safeProduced}
                value={brokenEggs}
                onChange={(e) => setBrokenEggs(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full h-12 px-3 pr-16 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none"
              />
              <span className="absolute right-3 top-3 text-body text-neutral-500">eggs</span>
            </div>
            <p className="text-caption text-neutral-500 mt-1">
              Broken eggs are automatically deducted from sellable stock.
            </p>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any remarks on flock or temperature..."
              className="w-full p-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {isCreating || isUpdating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{isEditMode ? 'Update Production' : 'Save Production'}</span>
                <Check size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Duplicate entry confirmation modal with 1-click update */}
      {showDuplicateModal && existingForDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-heading-2 font-bold text-neutral-900 leading-tight">Entry Already Exists</h3>
                <span className="text-caption text-neutral-500 font-medium">{date}</span>
              </div>
            </div>

            <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 text-body-sm space-y-2">
              <div className="flex justify-between items-center text-neutral-600">
                <span>Existing in database:</span>
                <strong className="text-neutral-900 tabular-nums">
                  {existingForDate.eggsProduced.toLocaleString('en-IN')} eggs
                </strong>
              </div>
              <div className="flex justify-between items-center text-brand-600 font-medium">
                <span>Your new value:</span>
                <strong className="tabular-nums">
                  {safeProduced.toLocaleString('en-IN')} eggs
                </strong>
              </div>
            </div>

            <p className="text-caption text-neutral-600 leading-relaxed">
              Would you like to overwrite today's record with your new value of{' '}
              <strong>{safeProduced.toLocaleString('en-IN')} eggs</strong>?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOverwriteExisting}
                disabled={isUpdating}
                className="w-full h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-md font-semibold text-body flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isUpdating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                <span>Update to {safeProduced.toLocaleString('en-IN')} Eggs</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-1/2 h-10 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md text-neutral-700 font-semibold text-body-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLoadPrevious}
                  className="w-1/2 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-700 font-semibold text-body-sm transition-colors"
                >
                  Load Previous
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
