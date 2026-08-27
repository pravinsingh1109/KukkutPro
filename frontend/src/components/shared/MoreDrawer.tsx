import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDemoStore } from '../../lib/demoStore';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Users,
  Receipt,
  Banknote,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  const { isDemoMode, setDemoMode } = useDemoStore();
  const queryClient = useQueryClient();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const links = [
    { to: '/cashbook', label: 'Cash Book', desc: 'Daily cash in & out ledger', icon: Banknote },
    { to: '/labour', label: 'Labour Management', desc: 'Worker salaries & advances', icon: Users },
    { to: '/expenses', label: 'Expenses', desc: 'Feed, medicine & farm costs', icon: Receipt },
    { to: '/settings', label: 'Settings', desc: 'Farm profile & preferences', icon: Settings },
  ];

  const handleToggleDemo = async () => {
    const nextMode = !isDemoMode;
    setDemoMode(nextMode);
    await queryClient.invalidateQueries();
    onClose();
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.post('/demo/reset');
      await queryClient.invalidateQueries();
      setIsResetModalOpen(false);
      onClose();
    } catch (err: any) {
      alert(err?.error || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative w-full max-w-lg bg-white rounded-t-lg shadow-lg z-10 p-4"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100">
            <h2 className="text-heading-2 font-semibold text-neutral-900">More Options</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className="flex items-center justify-between py-3.5 px-2 hover:bg-neutral-50 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-neutral-900">{link.label}</h3>
                      <p className="text-caption text-neutral-500">{link.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-neutral-400" />
                </NavLink>
              );
            })}
          </div>

          {/* Demo Mode Action Card */}
          <div className="mt-4 p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-body-sm font-bold text-amber-950">
                    {isDemoMode ? 'Demo Mode (Active)' : 'Explore Demo Farm'}
                  </h4>
                  <p className="text-caption text-amber-800">
                    {isDemoMode
                      ? 'Viewing Ramesh Poultry sample data'
                      : 'Sample egg inventory, sales & cash ledger'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleDemo}
                className={`px-3 py-1.5 rounded text-caption font-bold shadow-xs transition-all ${
                  isDemoMode
                    ? 'bg-neutral-800 text-white hover:bg-neutral-900'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isDemoMode ? 'Exit Demo' : 'Turn On'}
              </button>
            </div>

            {isDemoMode && (
              <div className="pt-2 border-t border-amber-200/70 flex justify-between items-center">
                <span className="text-[11px] text-amber-900">Need a fresh start?</span>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-caption text-amber-900 font-bold hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Reset Demo Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                onClick={handleResetDemo}
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
