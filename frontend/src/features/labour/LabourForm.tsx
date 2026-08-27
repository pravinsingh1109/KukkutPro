import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabour } from '../../hooks/useLabour';
import { TopAppBar } from '../../components/shared/FAB';
import { SalaryType } from '../../types';
import { Check, AlertTriangle } from 'lucide-react';

export const LabourForm: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Farm Worker');
  const [salaryType, setSalaryType] = useState<SalaryType>('MONTHLY');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [joiningDate, setJoiningDate] = useState(todayStr);
  const [error, setError] = useState<string | null>(null);

  const { createLabourer, isCreating } = useLabour();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Labourer name is required');
      return;
    }

    const amountNum = parseFloat(salaryAmount) || 0;
    if (amountNum <= 0) {
      setError('Salary amount must be greater than zero');
      return;
    }

    try {
      await createLabourer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
        salaryType,
        salaryAmount: amountNum.toFixed(2),
        joiningDate,
      });

      navigate('/labour');
    } catch (err: any) {
      setError(err?.error || 'Failed to add labourer');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar title="Add New Labourer" onBack={() => navigate(-1)} />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-4">
          {error && (
            <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Worker Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramu"
              className="w-full h-12 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg focus:border-brand-500 focus:bg-white outline-none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Role / Task</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Egg Collector / Shed Maintenance"
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          {/* Salary Type */}
          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Salary Type</label>
            <div className="flex bg-neutral-100 p-1 rounded-md border border-neutral-300">
              {(['MONTHLY', 'DAILY', 'PER_TASK'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSalaryType(type)}
                  className={`flex-1 py-1.5 text-caption font-semibold rounded capitalize ${
                    salaryType === type ? 'bg-brand-500 text-white shadow-sm' : 'text-neutral-600'
                  }`}
                >
                  {type.toLowerCase().replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Amount */}
          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Salary Amount (₹) <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-body text-neutral-500">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                placeholder="15000"
                className="w-full h-12 pl-8 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none font-semibold"
                required
              />
            </div>
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Joining Date <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isCreating ? 'Adding...' : 'Save Worker'} <Check size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
