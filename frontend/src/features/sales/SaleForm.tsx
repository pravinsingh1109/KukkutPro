import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';
import { useInventoryStock } from '../../hooks/useInventory';
import { useSettings } from '../../hooks/useSettings';
import { CustomerQuickAddSheet } from '../customers/CustomerQuickAddSheet';
import { CustomerSearchSelect } from '../../components/shared/CustomerSearchSelect';
import { TopAppBar } from '../../components/shared/FAB';
import { PETI_SIZE, TRAY_SIZE } from '../../lib/constants';
import { formatCurrency, formatEggBreakdown } from '../../lib/utils';
import { Customer } from '../../types';
import { Plus, AlertTriangle, Check } from 'lucide-react';

export const SaleForm: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [customerId, setCustomerId] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Helper to load last used selling rate from localStorage
  const getLastPrice = (mode: 'PER_EGG' | 'PER_TRAY' | 'PER_PETI'): string => {
    const saved = localStorage.getItem(`kukkutpro_last_sale_price_${mode}`);
    if (saved && parseFloat(saved) > 0) return saved;
    if (mode === 'PER_TRAY') return '165';
    if (mode === 'PER_PETI') return '1155';
    return '5.50';
  };

  // Quantity input mode: remembers last used unit or defaults to 'TRAYS'
  const [qtyMode, setQtyMode] = useState<'EGGS' | 'TRAYS' | 'PETI'>(() => {
    return (localStorage.getItem('kukkutpro_last_sale_qty_mode') as any) || 'TRAYS';
  });
  const [enteredQty, setEnteredQty] = useState<number | ''>('');

  // Price mode: remembers last used price unit or defaults to 'PER_TRAY'
  const [priceMode, setPriceMode] = useState<'PER_EGG' | 'PER_TRAY' | 'PER_PETI'>(() => {
    return (localStorage.getItem('kukkutpro_last_sale_price_mode') as any) || 'PER_TRAY';
  });

  // Selling price: initialized from last entered selling price
  const [enteredPrice, setEnteredPrice] = useState<string>(() => {
    const initialMode = (localStorage.getItem('kukkutpro_last_sale_price_mode') as any) || 'PER_TRAY';
    return getLastPrice(initialMode);
  });

  const [amountReceived, setAmountReceived] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createSale, isCreating } = useSales();
  const { customers, isLoading: isCustomersLoading } = useCustomers();
  const { data: stockData } = useInventoryStock(date);
  const { settings } = useSettings();

  const petiSize = settings?.petiSize || PETI_SIZE;

  // Handle switching price mode with smart conversion or saved rate lookup
  const handlePriceModeChange = (newMode: 'PER_PETI' | 'PER_TRAY' | 'PER_EGG') => {
    if (newMode === priceMode) return;
    if (enteredPrice && parseFloat(enteredPrice) > 0) {
      localStorage.setItem(`kukkutpro_last_sale_price_${priceMode}`, enteredPrice);
    }

    const savedForNewMode = localStorage.getItem(`kukkutpro_last_sale_price_${newMode}`);
    if (savedForNewMode) {
      setEnteredPrice(savedForNewMode);
    } else {
      const currentVal = parseFloat(enteredPrice) || 0;
      if (currentVal > 0) {
        let pPerEgg = currentVal;
        if (priceMode === 'PER_PETI') pPerEgg = currentVal / petiSize;
        else if (priceMode === 'PER_TRAY') pPerEgg = currentVal / TRAY_SIZE;

        if (newMode === 'PER_PETI') setEnteredPrice(Math.round(pPerEgg * petiSize).toString());
        else if (newMode === 'PER_TRAY') setEnteredPrice(Math.round(pPerEgg * TRAY_SIZE).toString());
        else setEnteredPrice(pPerEgg.toFixed(2));
      } else {
        setEnteredPrice(getLastPrice(newMode));
      }
    }

    setPriceMode(newMode);
    localStorage.setItem('kukkutpro_last_sale_price_mode', newMode);
  };

  const handlePriceChange = (val: string) => {
    setEnteredPrice(val);
    if (val && parseFloat(val) > 0) {
      localStorage.setItem(`kukkutpro_last_sale_price_${priceMode}`, val);
    }
  };

  // Convert entered quantity to raw egg count
  const totalEggs = useMemo(() => {
    const q = typeof enteredQty === 'number' ? enteredQty : 0;
    if (qtyMode === 'PETI') return q * petiSize;
    if (qtyMode === 'TRAYS') return q * TRAY_SIZE;
    return q;
  }, [enteredQty, qtyMode, petiSize]);

  // Convert entered price to pricePerEgg
  const pricePerEgg = useMemo(() => {
    const p = parseFloat(enteredPrice) || 0;
    if (priceMode === 'PER_PETI') return p / petiSize;
    if (priceMode === 'PER_TRAY') return p / TRAY_SIZE;
    return p;
  }, [enteredPrice, priceMode, petiSize]);

  // Calculations
  const totalAmount = useMemo(() => {
    return Math.round(totalEggs * pricePerEgg * 100) / 100;
  }, [totalEggs, pricePerEgg]);

  const receivedNum = parseFloat(amountReceived) || 0;
  const amountDue = Math.max(0, totalAmount - receivedNum);

  const availableEggs = stockData?.closingStock || 0;
  const isStockInsufficient = totalEggs > availableEggs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    if (totalEggs <= 0) {
      setError('Please enter a valid quantity of eggs');
      return;
    }

    if (isStockInsufficient) {
      setError(`Only ${availableEggs} eggs available on ${date}. Reduce the quantity.`);
      return;
    }

    if (pricePerEgg <= 0) {
      setError('Price must be greater than zero');
      return;
    }

    if (receivedNum > totalAmount) {
      setError(`Amount received cannot exceed total amount of ${formatCurrency(totalAmount)}`);
      return;
    }

    try {
      await createSale({
        date,
        customerId,
        eggsQty: totalEggs,
        pricePerEgg: pricePerEgg.toFixed(4),
        amountReceived: receivedNum.toFixed(2),
        notes: notes.trim() || undefined,
      });

      // Persist the confirmed sale price and modes for next time
      if (enteredPrice && parseFloat(enteredPrice) > 0) {
        localStorage.setItem(`kukkutpro_last_sale_price_${priceMode}`, enteredPrice);
        localStorage.setItem('kukkutpro_last_sale_price_mode', priceMode);
        localStorage.setItem('kukkutpro_last_sale_qty_mode', qtyMode);
      }

      navigate('/sales');
    } catch (err: any) {
      setError(err?.error || 'Failed to record sale. Please try again.');
    }
  };

  const handleCustomerCreated = (newCust: Customer) => {
    setCustomerId(newCust.id);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 max-w-md mx-auto">
      <TopAppBar title="Record Egg Sale" onBack={() => navigate(-1)} />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-4">
          {error && (
            <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Sale Date <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          {/* Customer Selection with Live Search */}
          <CustomerSearchSelect
            customers={customers}
            selectedCustomerId={customerId}
            onSelectCustomer={(id) => setCustomerId(id)}
            onAddNewClick={() => setIsQuickAddOpen(true)}
            isLoading={isCustomersLoading}
          />

          {/* Available Stock Indicator */}
          <div className={`p-3 rounded-md border flex items-center justify-between ${
            isStockInsufficient ? 'bg-danger-100 border-danger-500/30 text-danger-500' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}>
            <span className="text-caption uppercase font-semibold">Available Stock:</span>
            <span className="text-body-sm font-semibold">
              {availableEggs} eggs ({formatEggBreakdown(availableEggs)})
            </span>
          </div>

          {/* Quantity Mode and Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-label text-neutral-700 font-medium">
                Quantity Sold <span className="text-danger-500">*</span>
              </label>
              <div className="flex bg-neutral-100 p-0.5 rounded-md border border-neutral-300">
                {(['PETI', 'TRAYS', 'EGGS'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setQtyMode(mode)}
                    className={`px-2.5 py-1 text-caption font-semibold rounded transition-colors ${
                      qtyMode === mode ? 'bg-brand-500 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {mode === 'PETI' ? 'Peti' : mode === 'TRAYS' ? 'Trays' : 'Eggs'}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={enteredQty}
                onChange={(e) => setEnteredQty(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="0"
                className={`w-full h-12 px-3 pr-16 rounded-md border bg-neutral-100 text-body-lg tabular-nums focus:bg-white outline-none ${
                  isStockInsufficient ? 'border-danger-500 text-danger-500' : 'border-neutral-300 focus:border-brand-500'
                }`}
                required
              />
              <span className="absolute right-3 top-3 text-body text-neutral-500">
                {qtyMode === 'TRAYS' ? 'trays' : qtyMode === 'PETI' ? 'peti' : 'eggs'}
              </span>
            </div>
            {qtyMode !== 'EGGS' && (
              <div className="flex items-center justify-between text-caption text-neutral-500 mt-1">
                <span>
                  = <strong>{totalEggs.toLocaleString('en-IN')}</strong> total eggs
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  {qtyMode === 'TRAYS' ? `(${TRAY_SIZE} eggs / tray)` : `(${petiSize} eggs / peti)`}
                </span>
              </div>
            )}
            {isStockInsufficient && totalEggs > 0 && (
              <p className="text-caption text-danger-500 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Selected quantity ({totalEggs} eggs) exceeds available stock ({availableEggs} eggs)</span>
              </p>
            )}
          </div>

          {/* Price Mode and Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-label text-neutral-700 font-medium">
                Price <span className="text-danger-500">*</span>
              </label>
              <div className="flex bg-neutral-100 p-0.5 rounded-md border border-neutral-300">
                {(['PER_PETI', 'PER_TRAY', 'PER_EGG'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handlePriceModeChange(mode)}
                    className={`px-2.5 py-1 text-caption font-semibold rounded transition-colors ${
                      priceMode === mode ? 'bg-brand-500 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {mode === 'PER_PETI' ? 'Peti' : mode === 'PER_TRAY' ? 'Tray' : 'Egg'}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3 text-body text-neutral-500 font-semibold">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={enteredPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-8 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none font-semibold"
                required
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {priceMode === 'PER_TRAY'
                  ? 'Rate per tray (30 eggs)'
                  : priceMode === 'PER_PETI'
                  ? `Rate per peti (${petiSize} eggs)`
                  : 'Rate per single egg'}
              </span>
              <span className="text-brand-600 font-medium">Auto-remembers rate</span>
            </p>
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-neutral-100 rounded-md border border-neutral-200 space-y-1.5">
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-neutral-500">Total Sale Amount:</span>
              <span className="font-bold text-neutral-900 text-body-lg">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Amount Received (Cash Collected Now) */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Cash Received Now (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-body text-neutral-500">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-8 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body-lg tabular-nums focus:border-brand-500 focus:bg-white outline-none"
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-caption">
              <span className="text-neutral-500">Remaining Due to Add to Customer:</span>
              <span className={`font-bold ${amountDue > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                {amountDue > 0 ? formatCurrency(amountDue) : 'Fully Paid'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-label text-neutral-700 mb-1.5 font-medium">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. delivered to shop"
              className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating || isStockInsufficient}
            className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {isCreating ? 'Recording...' : 'Confirm Sale'} <Check size={18} />
          </button>
        </form>
      </div>

      <CustomerQuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};
