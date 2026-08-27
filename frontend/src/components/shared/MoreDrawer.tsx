import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBackup } from '../../hooks/useBackup';
import {
  Users,
  Receipt,
  Banknote,
  Settings,
  X,
  ChevronRight,
  Cloud,
  LogOut,
  LogIn,
} from 'lucide-react';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  const { isConnected, googleUser, signOut, signIn } = useBackup();

  if (!isOpen) return null;

  const links = [
    { to: '/cashbook', label: 'Cash Book', desc: 'Daily cash in & out ledger', icon: Banknote },
    { to: '/labour', label: 'Labour Management', desc: 'Worker salaries & advances', icon: Users },
    { to: '/expenses', label: 'Expenses', desc: 'Feed, medicine & farm costs', icon: Receipt },
    { to: '/backup', label: 'Google Drive Backup', desc: 'Auto-backup & cloud recovery', icon: Cloud },
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

        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between p-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'hover:bg-neutral-50 text-neutral-800'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700">
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

        {/* Google Account & Sign Out Section */}
        <div className="mt-4 p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between">
          {isConnected && googleUser ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-caption">
                    {googleUser.name?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-body-sm font-bold text-neutral-900 truncate">{googleUser.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{googleUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded text-caption font-bold flex items-center gap-1 transition-colors shrink-0 ml-2"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Cloud size={18} />
                </div>
                <div>
                  <p className="text-body-sm font-bold text-neutral-900">Google Account</p>
                  <p className="text-[11px] text-neutral-500">Sign in for auto cloud backup</p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await signIn();
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-caption font-bold flex items-center gap-1 transition-colors shrink-0 ml-2"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
