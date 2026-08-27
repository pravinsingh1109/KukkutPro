import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Egg, ShoppingCart, Users, MoreHorizontal } from 'lucide-react';
import { MoreDrawer } from './MoreDrawer';

export const BottomNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/daily', label: 'Daily', icon: Egg },
    { to: '/sales', label: 'Sales', icon: ShoppingCart },
    { to: '/customers', label: 'Ledger', icon: Users },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-300 flex items-center justify-around h-16 max-w-lg mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 py-1 transition-colors ${
                  isActive ? 'text-brand-500 font-semibold' : 'text-neutral-500 hover:text-neutral-700'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center w-16 py-1 text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <MoreHorizontal size={22} strokeWidth={2} />
          <span className="text-[11px] mt-1 tracking-tight">More</span>
        </button>
      </nav>

      <MoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
};
