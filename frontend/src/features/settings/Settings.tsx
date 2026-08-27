import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useDemoStore } from '../../lib/demoStore';
import { useQueryClient } from '@tanstack/react-query';
import { TopAppBar } from '../../components/shared/FAB';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';
import {
  Check,
  Plus,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, refetch } = useSettings();
  const { isDemoMode, setDemoMode } = useDemoStore();
  const queryClient = useQueryClient();

  const [farmName, setFarmName] = useState(settings?.name || '');
  const [petiSize, setPetiSize] = useState<number>(settings?.petiSize || 210);
  const [newCategory, setNewCategory] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sync state if settings resolve
  React.useEffect(() => {
    if (settings) {
      setFarmName(settings.name);
      setPetiSize(settings.petiSize);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    try {
      await updateSettings({
        name: farmName.trim(),
        petiSize: Math.max(1, Math.floor(petiSize)),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.error || 'Failed to update settings');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await api.post('/settings/categories', { name: newCategory.trim() });
      setNewCategory('');
      refetch();
    } catch (err: any) {
      alert(err?.error || 'Failed to add category');
    }
  };

  const handleToggleDemo = async () => {
    const nextMode = !isDemoMode;
    setDemoMode(nextMode);
    await queryClient.invalidateQueries();
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.post('/demo/reset');
      await queryClient.invalidateQueries();
      setIsResetModalOpen(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err: any) {
      alert(err?.error || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Settings" subtitle="Farm profile and unit configurations" />

      <div className="p-4 space-y-4">
        {saveSuccess && (
          <div className="p-3 bg-success-100 border border-success-500/20 text-success-600 rounded-md text-body-sm font-semibold flex items-center gap-1.5">
            <Check size={18} /> Settings saved successfully
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 bg-amber-100 border border-amber-500/30 text-amber-900 rounded-md text-body-sm font-semibold flex items-center gap-1.5">
            <Check size={18} className="text-amber-700" /> Demo farm re-seeded with realistic data!
          </div>
        )}

        {error && (
          <div className="p-3 bg-danger-100 text-danger-500 rounded-md text-body-sm">
            {error}
          </div>
        )}

        {/* Demo Mode Management Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-amber-200 bg-linear-to-b from-amber-50/40 to-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-heading-3 font-bold text-neutral-900">Demo Farm Mode</h3>
                <span className="text-caption text-neutral-500 block">
                  {isDemoMode ? 'Active: Ramesh Poultry Farm' : 'Inactive: Using real farm'}
                </span>
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
              {isDemoMode ? 'Exit Demo' : 'Turn On Demo'}
            </button>
          </div>

          <p className="text-caption text-neutral-600 leading-relaxed">
            Experience KukkutPro with 7 days of realistic egg collection, buyer ledger dues, labour salaries, and cash books. Demo records are completely isolated from your real farm.
          </p>

          {isDemoMode && (
            <div className="pt-2 border-t border-neutral-100 flex justify-between items-center">
              <span className="text-caption text-neutral-600 font-medium">Re-seed sample records:</span>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-2.5 py-1 text-caption font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={13} /> Reset Demo Data
              </button>
            </div>
          )}
        </div>

        {/* General Farm Settings Form */}
        <form onSubmit={handleSaveSettings} className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <h2 className="text-heading-2 font-bold text-neutral-900 mb-1">Farm Information</h2>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Farm Name</label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Eggs per Peti (Carton Packaging Standard)
            </label>

            {/* Quick Presets */}
            <div className="flex gap-2 mb-2">
              {[
                { label: '210 Eggs (7 Trays · Std)', value: 210 },
                { label: '180 Eggs (6 Trays)', value: 180 },
                { label: '240 Eggs (8 Trays)', value: 240 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setPetiSize(preset.value)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                    petiSize === preset.value
                      ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="30"
                max="420"
                value={petiSize}
                onChange={(e) => setPetiSize(Math.min(420, Math.max(30, parseInt(e.target.value) || 210)))}
                className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none tabular-nums font-semibold"
                required
              />
              <span className="absolute right-3 top-2.5 text-body text-neutral-500">eggs / peti</span>
            </div>
            <p className="text-caption text-neutral-500 mt-1">
              ⚠️ <em>Note: A "Peti" is the transport carton/box (Standard in India = 210 eggs). This is <strong>not</strong> your total flock/bird count.</em>
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            Save Preferences
          </button>
        </form>

        {/* Initial Setup Baseline (Read-Only) */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-2">
          <h3 className="text-heading-3 font-bold text-neutral-900">Starting Baselines</h3>
          <p className="text-caption text-neutral-500">Values recorded during farm setup onboarding.</p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-neutral-100 rounded-md">
              <span className="text-caption text-neutral-500 block">Initial Opening Eggs:</span>
              <span className="text-body font-bold text-neutral-900">
                {settings?.openingEggStock || 0} eggs
              </span>
            </div>
            <div className="p-2.5 bg-neutral-100 rounded-md">
              <span className="text-caption text-neutral-500 block">Initial Opening Cash:</span>
              <span className="text-body font-bold text-neutral-900">
                {formatCurrency(settings?.openingCash)}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Categories Management */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <h3 className="text-heading-3 font-bold text-neutral-900">Expense Categories</h3>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name..."
              className="flex-1 h-10 px-3 rounded-md border border-neutral-300 bg-neutral-50 text-body-sm focus:border-brand-500 focus:bg-white outline-none"
            />
            <button
              type="submit"
              className="px-3 h-10 bg-brand-500 text-white rounded-md text-caption font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus size={16} /> Add
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {settings?.expenseCategories?.map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-md text-caption font-medium border border-neutral-200"
              >
                {cat}
              </span>
            ))}
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
    </div>
  );
};
