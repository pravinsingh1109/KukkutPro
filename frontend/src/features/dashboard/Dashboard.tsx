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
import { Plus, Egg, ShoppingCart, IndianRupee, Receipt, RefreshCw, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboard();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { marketPrice, isSyncing, syncPrices } = useMarketPrice('Luknow (CC)');

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
      <header className="bg-white border-b border-neutral-100 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div>
          <h1 className="text-heading-1 font-bold text-neutral-900 tracking-tight">
            {settings?.name || 'KukkutPro'}
          </h1>
          <p className="text-caption text-neutral-500 font-medium">{todayDisplay}</p>
        </div>
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
