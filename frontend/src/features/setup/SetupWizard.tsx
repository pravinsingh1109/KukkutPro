import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { breakdownEggs } from '../../lib/utils';
import { Egg, IndianRupee, Home, ChevronRight, Check } from 'lucide-react';

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { completeSetup, isSettingUp } = useSettings();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [farmName, setFarmName] = useState('');
  const [openingEggStock, setOpeningEggStock] = useState<number>(0);
  const [openingCash, setOpeningCash] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);

  const eggBreakdown = breakdownEggs(openingEggStock);

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!farmName.trim()) {
        setError('Please enter your farm name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (openingEggStock < 0) {
        setError('Please enter 0 or a positive number for eggs');
        return;
      }
      setStep(3);
    }
  };

  const handleFinish = async () => {
    setError(null);
    const cashNum = parseFloat(openingCash);
    if (isNaN(cashNum) || cashNum < 0) {
      setError('Please enter a valid cash amount (0 or more)');
      return;
    }

    try {
      await completeSetup({
        name: farmName.trim(),
        openingEggStock: Math.floor(openingEggStock),
        openingCash: cashNum.toFixed(2),
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.error || 'Failed to save setup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-100">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-label font-bold ${
                step >= 1 ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              1
            </span>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-brand-500' : 'bg-neutral-200'}`} />
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-label font-bold ${
                step >= 2 ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              2
            </span>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-brand-500' : 'bg-neutral-200'}`} />
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-label font-bold ${
                step === 3 ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              3
            </span>
          </div>
          <span className="text-caption text-neutral-500 font-medium">Step {step} of 3</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center mb-4">
              <Home size={24} />
            </div>
            <h2 className="text-heading-1 font-bold text-neutral-900 mb-1">Name Your Farm</h2>
            <p className="text-body text-neutral-500 mb-5">
              Enter the registered or trade name of your poultry farm.
            </p>

            <div className="mb-6">
              <label className="block text-label text-neutral-700 mb-2">
                Farm Name <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Ramesh Poultry Farm"
                className="w-full h-12 px-4 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg focus:border-brand-500 focus:bg-white outline-none"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Next Step <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center mb-4">
              <Egg size={24} />
            </div>
            <h2 className="text-heading-1 font-bold text-neutral-900 mb-1">Opening Egg Stock</h2>
            <p className="text-body text-neutral-500 mb-5">
              How many eggs do you currently have ready in your farm stock right now?
            </p>

            <div className="mb-4">
              <label className="block text-label text-neutral-700 mb-2">
                Current Stock (Raw Eggs) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={openingEggStock || ''}
                onChange={(e) => setOpeningEggStock(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full h-12 px-4 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none"
                autoFocus
              />
            </div>

            <div className="p-3 bg-brand-50 rounded-md border border-brand-100 mb-6">
              <span className="text-caption text-neutral-500 uppercase font-semibold tracking-wider block mb-1">
                Converted Breakdown
              </span>
              <span className="text-body font-semibold text-brand-600">
                {eggBreakdown.peti} Peti + {eggBreakdown.trays} Trays + {eggBreakdown.loose} Loose Eggs
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-12 bg-white border border-neutral-300 text-neutral-700 font-semibold rounded-md"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="w-2/3 h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-success-100 text-success-500 flex items-center justify-center mb-4">
              <IndianRupee size={24} />
            </div>
            <h2 className="text-heading-1 font-bold text-neutral-900 mb-1">Opening Cash Balance</h2>
            <p className="text-body text-neutral-500 mb-5">
              How much physical cash do you have in hand right now to start your ledger?
            </p>

            <div className="mb-6">
              <label className="block text-label text-neutral-700 mb-2">
                Physical Cash in Hand (₹) <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-body-lg text-neutral-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 pl-9 pr-4 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 h-12 bg-white border border-neutral-300 text-neutral-700 font-semibold rounded-md"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSettingUp}
                className="w-2/3 h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isSettingUp ? 'Setting up...' : 'Finish Setup'} <Check size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
