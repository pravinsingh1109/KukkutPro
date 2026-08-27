import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Search, User, Phone, Check, X, Plus, ChevronDown, AlertCircle } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onAddNewClick: () => void;
  isLoading?: boolean;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddNewClick,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  const handleSelect = (id: string) => {
    onSelectCustomer(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCustomer('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-label text-neutral-700 font-medium">
          Customer <span className="text-danger-500">*</span>
        </label>
        <button
          type="button"
          onClick={onAddNewClick}
          className="text-body-sm text-brand-500 font-semibold flex items-center gap-1 hover:text-brand-600 active:scale-95 transition-all"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Trigger: Selected State or Search Trigger */}
      {selectedCustomer ? (
        <div
          onClick={() => setIsOpen(true)}
          className="p-3 rounded-md border border-brand-300 bg-brand-50/40 hover:bg-brand-50 hover:border-brand-500 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-body shrink-0 shadow-xs">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-body font-bold text-neutral-900 truncate">
                  {selectedCustomer.name}
                </span>
                {parseFloat(selectedCustomer.outstanding) > 0 ? (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-danger-100 text-danger-700 tabular-nums shrink-0">
                    Due: {formatCurrency(selectedCustomer.outstanding)}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-success-100 text-success-700 shrink-0">
                    Settled
                  </span>
                )}
              </div>
              <p className="text-caption text-neutral-500 truncate mt-0.5">
                {selectedCustomer.phone || 'No phone recorded'}
                {selectedCustomer.address ? ` · ${selectedCustomer.address}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-caption font-semibold text-brand-600 shrink-0 ml-2">
            <span>Change</span>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-brand-100 rounded-full text-neutral-400 hover:text-neutral-700 ml-1"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(true)}
          className="w-full h-12 px-3 rounded-md border border-neutral-300 bg-neutral-100 hover:bg-white hover:border-brand-500 cursor-pointer flex items-center justify-between text-neutral-500 transition-all group"
        >
          <div className="flex items-center gap-2 text-body">
            <Search size={18} className="text-neutral-400 group-hover:text-brand-500 transition-colors" />
            <span className="text-neutral-500">Search customer by name or phone...</span>
          </div>
          <ChevronDown size={18} className="text-neutral-400" />
        </div>
      )}

      {/* Searchable Picker Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Customer">
        <div className="space-y-3">
          {/* Live Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, mobile number..."
              className="w-full h-11 pl-10 pr-9 rounded-md border border-neutral-300 bg-white text-body focus:border-brand-500 outline-none"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Customer Count / Fast Action */}
          <div className="flex items-center justify-between text-caption text-neutral-500 px-1">
            <span>
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddNewClick();
              }}
              className="text-brand-600 font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Add New Buyer
            </button>
          </div>

          {/* Customer List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 rounded-md border border-neutral-200 bg-white">
            {isLoading ? (
              <div className="p-6 text-center text-caption text-neutral-400">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <AlertCircle size={20} />
                </div>
                <p className="text-body-sm font-medium text-neutral-700">
                  No customer matching "{searchTerm}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewClick();
                  }}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded font-semibold text-caption inline-flex items-center gap-1 shadow-xs"
                >
                  <Plus size={14} /> Add "{searchTerm}" as Customer
                </button>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                const outstanding = parseFloat(c.outstanding) || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`p-3.5 flex items-center justify-between hover:bg-brand-50/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 border-l-4 border-brand-500' : ''
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-bold text-neutral-900 truncate">
                          {c.name}
                        </span>
                        {isSelected && <Check size={16} className="text-brand-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-caption text-neutral-500 mt-0.5">
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-neutral-400" />
                            {c.phone}
                          </span>
                        )}
                        {c.address && <span>· {c.address}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {outstanding > 0 ? (
                        <span className="text-caption font-bold text-danger-500 block tabular-nums">
                          Due: {formatCurrency(c.outstanding)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-neutral-400 block">
                          No Dues
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
