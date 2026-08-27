import React, { useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { BottomSheet } from '../../components/shared/BottomSheet';
import { Customer } from '../../types';

interface CustomerQuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const CustomerQuickAddSheet: React.FC<CustomerQuickAddSheetProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const { createCustomer, isCreating } = useCustomers();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    try {
      const newCust = await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      setName('');
      setPhone('');
      onCustomerCreated(newCust);
      onClose();
    } catch (err: any) {
      setError(err?.error || 'Failed to add customer');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Quick Add Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500">
            {error}
          </div>
        )}

        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">
            Customer Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
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
            placeholder="10-digit mobile number"
            className="w-full h-11 px-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 h-11 bg-white border border-neutral-300 rounded-md font-semibold text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="w-2/3 h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md transition-all disabled:opacity-50"
          >
            {isCreating ? 'Saving...' : 'Add Customer'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
