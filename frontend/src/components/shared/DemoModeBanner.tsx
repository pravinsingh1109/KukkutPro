import React, { useState } from 'react';
import { useDemoStore } from '../../lib/demoStore';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Sparkles, RotateCcw, X, AlertTriangle, Check, ShieldAlert } from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
  const { isDemoMode, setDemoMode } = useDemoStore();
  const queryClient = useQueryClient();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isDemoMode) {
    return null;
  }

  const handleReset = async () => {
    setIsResetting(true);
    setFeedbackMsg(null);

    try {
      await api.post('/demo/reset');
      await queryClient.invalidateQueries();
      setFeedbackMsg('Demo farm data reset to initial realistic state!');
      setIsResetModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err?.error || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExitDemo = async () => {
    setDemoMode(false);
    await queryClient.invalidateQueries();
  };

  return (
    <>
      <aside aria-label="Demo Mode Notice" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 sticky top-0 z-50 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="p-1 bg-white/20 rounded-md shrink-0">
              <Sparkles size={16} className="text-white" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-bold tracking-wider uppercase bg-white/25 px-1.5 py-0.2 rounded text-[10px]">
                  Demo Mode
                </span>
                <span className="text-caption font-semibold truncate">Ramesh Poultry Farm</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95"
              title="Reset Demo Data"
            >
              <RotateCcw size={12} className={isResetting ? 'animate-spin' : ''} />
              <span>Reset Data</span>
            </button>

            <button
              type="button"
              onClick={handleExitDemo}
              className="p-1 bg-white/10 hover:bg-white/25 text-white rounded transition-all"
              title="Exit Demo Mode"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="max-w-md mx-auto mt-1 p-1 bg-white text-amber-800 text-[11px] font-semibold rounded text-center shadow flex items-center justify-center gap-1">
            <Check size={12} className="text-success-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </aside>

      {/* Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-heading-3 font-bold text-neutral-900">Reset Demo Farm Data?</h3>
                <span className="text-caption text-neutral-500">Completely isolated reset</span>
              </div>
            </div>

            <p className="text-body-sm text-neutral-600 mb-4 leading-relaxed">
              This will re-seed all sample egg collection records, buyer sales, customer dues,
              labour payouts, and cash book reconciliations for the demo farm.
            </p>

            <div className="p-3 bg-neutral-100 rounded-md text-caption text-neutral-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Your real farm data</strong> is strictly isolated and will <strong>not</strong> be affected.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="w-1/2 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-md text-body-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleReset}
                className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold rounded-md text-body-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Yes, Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
