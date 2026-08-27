import React, { useState } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { BottomSheet } from '../../components/shared/BottomSheet';
import { Customer } from '../../types';
import { AlertTriangle, User, Phone, MapPin, Check, Loader2 } from 'lucide-react';

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
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanName = name.trim();

    if (!cleanName) {
      setError('Customer name is required');
      return;
    }

    try {
      const newCust = await createCustomer({
        name: cleanName,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      setName('');
      setPhone('');
      setAddress('');
      onCustomerCreated(newCust);
      onClose();
    } catch (err: any) {
      setError(err?.error || 'Failed to add customer. Please try again.');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Quick Add Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-100 border border-danger-500/30 rounded-md text-body-sm text-danger-500 flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">
            Customer Name <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amit Singh"
              className="w-full h-12 pl-10 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none font-medium"
              autoFocus
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-3 text-neutral-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full h-11 pl-10 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-label text-neutral-700 mb-1 font-medium">
            Shop / Location (Optional)
          </label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Mandi Gate #2 / Station Road"
              className="w-full h-11 pl-10 pr-3 rounded-md border border-neutral-300 bg-neutral-100 text-body focus:border-brand-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 h-11 bg-white border border-neutral-300 rounded-md font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="w-2/3 h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Add Customer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
