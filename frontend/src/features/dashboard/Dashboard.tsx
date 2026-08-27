import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useSettings } from '../../hooks/useSettings';
import { TodayEggCard } from './TodayEggCard';
import { CashTodayCard } from './CashTodayCard';
import { OutstandingCard } from './OutstandingCard';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { ErrorState } from '../../components/shared/EmptyState';
import { useMarketPrice } from '../../hooks/useMarketPrice';
import { useBackup } from '../../hooks/useBackup';
import { Plus, Egg, ShoppingCart, IndianRupee, Receipt, RefreshCw, TrendingUp, Cloud } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboard();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { marketPrice, isSyncing, syncPrices } = useMarketPrice('Luknow (CC)');
  const { isConnected, googleUser } = useBackup();

  // Redirect to setup wizard if farm setup is not complete
  useEffect(() => {
    if (!isSettingsLoading && settings && !settings.isSetupComplete) {
      navigate('/setup');
    }
  }, [settings, isSettingsLoading, navigate]);

  const todayDisplay = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-100 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div>
          <h1 className="text-heading-2 font-bold text-neutral-900 tracking-tight">
            {settings?.name || 'KukkutPro'}
          </h1>
          <p className="text-caption text-neutral-500 font-medium">{todayDisplay}</p>
        </div>

        {/* Google Account / Sign-In Status */}
        {isConnected && googleUser ? (
          <button
            type="button"
            onClick={() => navigate('/backup')}
            className="flex items-center gap-2 p-1 pl-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full transition-all active:scale-95 shadow-2xs"
            title={`Connected: ${googleUser.email}`}
          >
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <Cloud size={14} className="text-brand-500" />
            </div>
            {googleUser.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                className="w-6 h-6 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                {googleUser.name?.charAt(0) || 'G'}
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/backup')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-full shadow-2xs text-[12px] font-bold text-neutral-800 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </header>

      {/* Quick Action Pills */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => navigate('/daily')}
            className="px-3 py-2 bg-brand-500 text-white rounded-md text-caption font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            <Egg size={14} /> Record Production
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/new')}
            className="px-3 py-2 bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 rounded-md text-caption font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            <ShoppingCart size={14} /> New Sale
          </button>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-3 py-2 bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 rounded-md text-caption font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            <IndianRupee size={14} /> Dues
          </button>
          <button
            type="button"
            onClick={() => navigate('/expenses/new')}
            className="px-3 py-2 bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 rounded-md text-caption font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            <Receipt size={14} /> Expense
          </button>
        </div>
      </div>

      {/* Google Cloud Backup Banner (If Not Connected) */}
      {!isConnected && (
        <div className="px-4 pt-1">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-md p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Cloud size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-bold text-neutral-900 leading-tight">Google Drive Backup</p>
                <p className="text-[11px] text-neutral-600 truncate mt-0.5">
                  Sign in with Google for auto cloud recovery
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/backup')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold rounded shadow-xs shrink-0 ml-2"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Live NECC Mandi Rate Card */}
      {marketPrice && (
        <div className="px-4 pt-1">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-md p-3 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-success-500 inline-block animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-900">
                  NECC Mandi Rate · {marketPrice.zone}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-heading-2 font-bold text-neutral-900 tabular-nums">
                  ₹{marketPrice.pricePerEgg}
                  <span className="text-body-sm font-normal text-neutral-500"> / egg</span>
                </span>
                <span className="text-body-sm font-semibold text-amber-800 tabular-nums">
                  ₹{marketPrice.pricePerTray} / tray
                </span>
                <span className="text-caption text-neutral-500 tabular-nums">
                  (₹{marketPrice.pricePer100} / 100)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => syncPrices()}
              disabled={isSyncing}
              title="Sync latest price from e2necc.com"
              className="p-2 bg-white hover:bg-neutral-50 active:scale-95 border border-amber-200 rounded-md text-amber-800 shadow-2xs transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Cards */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error || !data ? (
          <ErrorState
            message="Unable to load today's operational summary."
            onRetry={() => refetch()}
          />
        ) : (
          <>
            {/* Card 1: Today's Egg Stock */}
            <TodayEggCard
              eggsProduced={data.production.eggsProduced}
              brokenEggs={data.production.brokenEggs}
              eggsSold={data.sales.eggsSold}
              closingStock={data.inventory.closingStock}
              display={data.inventory.display}
              hasProductionToday={data.production.eggsProduced > 0}
            />

            {/* Card 2: Cash Today */}
            <CashTodayCard
              cashCollected={data.sales.cashCollected}
              creditSales={data.sales.creditSales}
              totalExpenses={data.expenses.total}
              closingBalance={data.cash.closingBalance}
            />

            {/* Card 3: Outstanding Dues */}
            <OutstandingCard
              totalCustomerDues={data.outstanding.totalCustomerDues}
              totalLabourDues={data.outstanding.totalLabourDues}
              topCustomers={data.outstanding.topCustomers}
            />
          </>
        )}
      </div>
    </div>
  );
};
