import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Receipt, Banknote, Settings, X, ChevronRight } from 'lucide-react';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const links = [
    { to: '/cashbook', label: 'Cash Book', desc: 'Daily cash in & out ledger', icon: Banknote },
    { to: '/labour', label: 'Labour Management', desc: 'Worker salaries & advances', icon: Users },
    { to: '/expenses', label: 'Expenses', desc: 'Feed, medicine & farm costs', icon: Receipt },
    { to: '/settings', label: 'Settings', desc: 'Farm profile & preferences', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-lg shadow-lg z-10 p-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100">
          <h2 className="text-heading-2 font-semibold text-neutral-900">More Options</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="flex items-center justify-between py-3.5 px-2 hover:bg-neutral-50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">{link.label}</h3>
                    <p className="text-caption text-neutral-500">{link.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
