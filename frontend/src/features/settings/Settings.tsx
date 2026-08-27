import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { TopAppBar } from '../../components/shared/FAB';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';
import { Check, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, refetch } = useSettings();

  const [farmName, setFarmName] = useState(settings?.name || '');
  const [petiSize, setPetiSize] = useState<number>(settings?.petiSize || 210);
  const [newCategory, setNewCategory] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Settings" subtitle="Farm profile and unit configurations" />

      <div className="p-4 space-y-4">
        {saveSuccess && (
          <div className="p-3 bg-success-100 border border-success-500/20 text-success-600 rounded-md text-body-sm font-semibold flex items-center gap-1.5">
            <Check size={18} /> Settings saved successfully
          </div>
        )}

        {error && (
          <div className="p-3 bg-danger-100 text-danger-500 rounded-md text-body-sm">
            {error}
          </div>
        )}

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
              Eggs per Peti (Unit Standard)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={petiSize}
                onChange={(e) => setPetiSize(parseInt(e.target.value) || 210)}
                className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none tabular-nums"
                required
              />
              <span className="absolute right-3 top-2.5 text-body text-neutral-500">eggs</span>
            </div>
            <p className="text-caption text-neutral-500 mt-1">Default in India is 210 eggs (7 trays of 30 eggs).</p>
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
    </div>
  );
};
