import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useBackup } from '../../hooks/useBackup';
import { useFarmStore } from '../../hooks/useFarmStore';
import { FarmSwitcherModal } from '../../components/shared/FarmSwitcherModal';
import { useQueryClient } from '@tanstack/react-query';
import { TopAppBar } from '../../components/shared/FAB';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';
import {
  Check,
  Plus,
  RotateCcw,
  Cloud,
  ChevronRight,
  Warehouse,
  LogOut,
  Trash2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [isFarmSwitcherOpen, setIsFarmSwitcherOpen] = useState(false);
  const { farms } = useFarmStore();
  const { settings, updateSettings, refetch } = useSettings();
  const { isConnected, googleUser, signOut } = useBackup();
  const queryClient = useQueryClient();

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

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.delete(`/settings/categories/${id}`);
      refetch();
    } catch (err: any) {
      alert(err?.error || 'Failed to delete category');
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

        {/* Poultry Farms Management Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Warehouse size={20} />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-heading-3 font-bold text-neutral-900">Poultry Farms</h3>
                <span className="text-caption text-neutral-500 block truncate">
                  Active: {settings?.name || 'My Poultry Farm'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFarmSwitcherOpen(true)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 active:scale-95 text-white rounded text-caption font-bold flex items-center gap-1 shadow-2xs transition-all shrink-0 ml-2"
            >
              <span>Switch / Add</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Isolated ledgers per farm</span>
            <span className="text-neutral-700 font-semibold">{farms.length} Farm{farms.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Google Drive & Cloud Backup Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Cloud size={20} />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-heading-3 font-bold text-neutral-900">Google Drive Backup</h3>
                <span className="text-caption text-neutral-500 block truncate">
                  {isConnected
                    ? `Connected: ${googleUser?.email}`
                    : 'Zero-cost local-first cloud recovery'}
                </span>
              </div>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => navigate('/backup')}
                  className="px-2.5 py-1.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded text-caption font-bold flex items-center gap-1 shadow-2xs transition-all"
                >
                  <span>Manage</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="px-2.5 py-1.5 bg-danger-50 hover:bg-danger-100 active:scale-95 text-danger-600 rounded text-caption font-bold flex items-center gap-1 transition-all"
                  title="Sign out Google Account"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/backup')}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded text-caption font-bold flex items-center gap-1 shadow-2xs transition-all shrink-0 ml-2"
              >
                <span>Connect</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Daily 12:00 AM auto-snapshots</span>
            {isConnected ? (
              <span className="text-success-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 inline-block" /> Active
              </span>
            ) : (
              <span className="text-neutral-400 font-medium">Not Connected</span>
            )}
          </div>
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
            <p className="text-caption text-neutral-500 mb-2">
              Standard commercial packaging unit in your mandi (typically 210 eggs / 7 trays).
            </p>
            <input
              type="number"
              min={30}
              max={420}
              value={petiSize}
              onChange={(e) => setPetiSize(parseInt(e.target.value, 10) || 0)}
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
              required
            />
            <div className="flex gap-2 mt-2">
              {[150, 180, 210, 240, 300].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPetiSize(preset)}
                  className={`px-2.5 py-1 text-caption font-semibold rounded border transition-colors ${
                    petiSize === preset
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {preset} eggs
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-body-sm rounded-md shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={18} /> Save Settings
            </button>
          </div>
        </form>

        {/* Expense Categories */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <h2 className="text-heading-2 font-bold text-neutral-900 mb-1">Expense Categories</h2>
          <p className="text-caption text-neutral-500">
            Categorize operational costs like feed, medicine, and electricity.
          </p>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name..."
              className="flex-1 h-10 px-3 rounded-md border border-neutral-300 text-body-sm focus:border-brand-500 outline-none"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-neutral-900 text-white rounded-md text-caption font-bold hover:bg-neutral-800 flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
          </form>

          <div className="divide-y divide-neutral-100 pt-1">
            {settings?.expenseCategories?.map((cat, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="text-body-sm text-neutral-800 font-medium">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Farm Switcher / Add Farm Modal */}
      <FarmSwitcherModal
        isOpen={isFarmSwitcherOpen}
        onClose={() => setIsFarmSwitcherOpen(false)}
      />
    </div>
  );
};
