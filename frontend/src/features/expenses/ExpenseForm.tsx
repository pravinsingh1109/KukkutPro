import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../../hooks/useExpenses';
import { useSettings } from '../../hooks/useSettings';
import { TopAppBar } from '../../components/shared/FAB';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils';
import { Check, AlertTriangle, Plus } from 'lucide-react';

export const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];
  const { settings } = useSettings();
  const { createExpense, isCreating } = useExpenses();

  const categories = settings?.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;

  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState(categories[0] || 'Feed');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate total amount if quantity and unit cost are provided
  const handleQuantityOrCostChange = (newQty: number | '', newCost: string) => {
    setQuantity(newQty);
    setUnitCost(newCost);

    const q = typeof newQty === 'number' ? newQty : 0;
    const c = parseFloat(newCost) || 0;
    if (q > 0 && c > 0) {
      setTotalAmount((q * c).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Expense description is required');
      return;
    }

    const totalNum = parseFloat(totalAmount) || 0;
    if (totalNum <= 0) {
      setError('Please enter a valid total amount');
      return;
    }

    try {
      await createExpense({
        date,
        category,
        description: description.trim(),
        quantity: typeof quantity === 'number' ? quantity : undefined,
        unitCost: unitCost ? parseFloat(unitCost) : undefined,
        totalAmount: totalNum.toFixed(2),
        notes: notes.trim() || undefined,
      });

      navigate('/expenses');
    } catch (err: any) {
      setError(err?.error || 'Failed to record expense');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar title="Record Farm Expense" onBack={() => navigate(-1)} />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-4">
          {error && (
            <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Expense Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Expense Category <span className="text-danger-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg focus:border-brand-500 focus:bg-white outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Item / Description <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Maaka feed 10 bags, ND vaccine, etc."
              className="w-full h-12 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg focus:border-brand-500 focus:bg-white outline-none"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-label text-neutral-700 mb-1 font-medium">Quantity (Optional)</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) =>
                  handleQuantityOrCostChange(
                    e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                    unitCost
                  )
                }
                placeholder="10"
                className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-label text-neutral-700 mb-1 font-medium">Unit Cost (₹)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-body text-neutral-500">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitCost}
                  onChange={(e) => handleQuantityOrCostChange(quantity, e.target.value)}
                  placeholder="350"
                  className="w-full h-11 pl-7 pr-2 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">
              Total Amount Paid (₹) <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-body text-neutral-500">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="3500.00"
                className="w-full h-12 pl-8 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-label text-neutral-700 mb-1 font-medium">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid cash to delivery truck driver"
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isCreating ? 'Recording...' : 'Record Expense'} <Check size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
