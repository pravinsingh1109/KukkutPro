import React, { useState } from 'react';
import { useFarmStore, FarmSummary } from '../../hooks/useFarmStore';
import {
  Warehouse,
  Plus,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Coins,
  Egg,
} from 'lucide-react';

interface FarmSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmSwitcherModal: React.FC<FarmSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { farms, activeFarm, switchFarm, createFarm, isCreatingFarm } = useFarmStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [petiSize, setPetiSize] = useState('210');
  const [openingEggs, setOpeningEggs] = useState('0');
  const [openingCash, setOpeningCash] = useState('0');
  const [createError, setCreateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectFarm = async (farm: FarmSummary) => {
    await switchFarm(farm);
    onClose();
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const name = newFarmName.trim();
    if (!name) {
      setCreateError('Please enter a farm name');
      return;
    }

    try {
      await createFarm({
        name,
        petiSize: parseInt(petiSize, 10) || 210,
        openingEggStock: parseInt(openingEggs, 10) || 0,
        openingCash: parseFloat(openingCash) || 0,
      });

      setIsAddingNew(false);
      setNewFarmName('');
      setPetiSize('210');
      setOpeningEggs('0');
      setOpeningCash('0');
      onClose();
    } catch (err: any) {
      setCreateError(err?.error || err?.message || 'Failed to create farm');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-heading-3 font-bold text-neutral-900">Switch Poultry Farm</h3>
            <p className="text-caption text-neutral-500">Manage multiple farms with isolated ledgers</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* Farm List */}
          <div className="space-y-2">
            {farms
              .filter((f) => !f.isDemo)
              .map((farm) => {
                const isActive = activeFarm?.id === farm.id;

                return (
                  <button
                    key={farm.id}
                    type="button"
                    onClick={() => handleSelectFarm(farm)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-brand-50/60 border-brand-500/40 ring-1 ring-brand-500/30'
                        : 'bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-brand-500 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Warehouse size={18} />
                      </div>

                      <div className="overflow-hidden">
                        <p className="text-body font-bold text-neutral-900 truncate">{farm.name}</p>
                        <p className="text-caption text-neutral-500 truncate mt-0.5">
                          Peti: {farm.petiSize} eggs · {farm.saleCount} sales · {farm.customerCount} customers
                        </p>
                      </div>
                    </div>

                  <div className="shrink-0 ml-2">
                    {isActive ? (
                      <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    ) : (
                      <ChevronRight size={18} className="text-neutral-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Create New Farm Form or Button */}
          {!isAddingNew ? (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 px-4 border-2 border-dashed border-neutral-300 hover:border-brand-500 hover:bg-brand-50/20 text-brand-600 rounded-xl font-bold text-body-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} />
              <span>Add Another Poultry Farm</span>
            </button>
          ) : (
            <form onSubmit={handleCreateFarm} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                <h4 className="text-body-sm font-bold text-neutral-900">New Farm Profile</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-caption text-neutral-500 hover:text-neutral-900"
                >
                  Cancel
                </button>
              </div>

              {createError && (
                <div className="p-2 bg-danger-100 text-danger-600 text-caption rounded">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-caption font-semibold text-neutral-700 mb-1">
                  Farm Name *
                </label>
                <input
                  type="text"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="e.g. Kisan Broiler & Layer Farm"
                  required
                  className="w-full h-10 px-3 border border-neutral-300 rounded-md text-body-sm focus:outline-none focus:border-brand-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Peti Size
                  </label>
                  <input
                    type="number"
                    value={petiSize}
                    onChange={(e) => setPetiSize(e.target.value)}
                    className="w-full h-9 px-2 border border-neutral-300 rounded text-caption bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Egg Stock
                  </label>
                  <input
                    type="number"
                    value={openingEggs}
                    onChange={(e) => setOpeningEggs(e.target.value)}
                    className="w-full h-9 px-2 border border-neutral-300 rounded text-caption bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Opening Cash
                  </label>
                  <input
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    className="w-full h-9 px-2 border border-neutral-300 rounded text-caption bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingFarm}
                className="w-full h-10 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-body-sm rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-2"
              >
                {isCreatingFarm ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                <span>Create & Switch to Farm</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
