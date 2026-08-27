import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProduction } from '../../hooks/useProduction';
import { useInventoryStock } from '../../hooks/useInventory';
import { TopAppBar } from '../../components/shared/FAB';
import { formatEggBreakdown } from '../../lib/utils';
import { Egg, Plus, ShoppingCart, Calendar, Edit2 } from 'lucide-react';

export const DailyEntry: React.FC = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { productions, isLoading } = useProduction();
  const { data: stockData } = useInventoryStock(selectedDate);

  const todayProduction = productions.find((p) => p.date === selectedDate);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 max-w-md mx-auto">
      <TopAppBar title="Daily Operations" subtitle="Daily production & quick actions" />

      <div className="p-4 space-y-4">
        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white p-3 rounded-md border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-neutral-500" />
            <span className="text-body font-semibold text-neutral-800">Target Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 px-2 rounded-md border border-neutral-300 bg-neutral-50 text-body-sm focus:border-brand-500 outline-none font-medium"
          />
        </div>

        {/* Today's Production Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-caption text-neutral-500 uppercase font-bold tracking-wider">
              Egg Production for {selectedDate}
            </span>
            {todayProduction && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-success-100 text-success-600 rounded-full">
                Recorded
              </span>
            )}
          </div>

          {todayProduction ? (
            <div className="space-y-3">
              <div className="p-3 bg-brand-50 rounded-md border border-brand-100 flex items-center justify-between">
                <div>
                  <span className="text-display font-bold text-neutral-900 tabular-nums leading-tight block">
                    {todayProduction.eggsProduced.toLocaleString('en-IN')}{' '}
                    <span className="text-body font-normal text-neutral-500">eggs</span>
                  </span>
                  <span className="text-caption text-brand-600 font-medium block mt-0.5">
                    {formatEggBreakdown(todayProduction.eggsProduced)}
                  </span>
                </div>
                {todayProduction.brokenEggs > 0 && (
                  <div className="text-right">
                    <span className="text-caption text-danger-500 font-semibold block">
                      {todayProduction.brokenEggs} broken
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/production/new')}
                className="w-full h-11 bg-white border border-brand-500 text-brand-500 hover:bg-brand-50 rounded-md font-semibold text-body flex items-center justify-center gap-2 transition-all"
              >
                <Edit2 size={16} /> Edit Production Entry
              </button>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-body text-neutral-500">No egg collection recorded yet for {selectedDate}.</p>
              <button
                type="button"
                onClick={() => navigate('/production/new')}
                className="w-full h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-md font-semibold text-body flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Plus size={18} /> Record Production Now
              </button>
            </div>
          )}
        </div>

        {/* Quick Sale Entry Card */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-neutral-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-caption text-neutral-500 uppercase font-bold tracking-wider">
              Egg Sales
            </span>
            <span className="text-caption text-neutral-600 font-medium">
              Available: {stockData?.closingStock || 0} eggs
            </span>
          </div>

          <p className="text-body-sm text-neutral-500">
            Record buyer sales, credit terms, and cash collection for today.
          </p>

          <button
            type="button"
            onClick={() => navigate('/sales/new')}
            className="w-full h-11 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-md font-semibold text-body flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <ShoppingCart size={18} /> Record Egg Sale
          </button>
        </div>

        {/* Production History List */}
        <div>
          <h3 className="text-heading-3 font-bold text-neutral-900 mb-2 px-1">Recent Daily Production</h3>
          <div className="bg-white rounded-md shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
            {isLoading ? (
              <p className="p-4 text-center text-caption text-neutral-400">Loading entries...</p>
            ) : productions.length === 0 ? (
              <p className="p-6 text-center text-body text-neutral-500">No entries recorded yet.</p>
            ) : (
              productions.slice(0, 7).map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-body font-semibold text-neutral-900 block">{p.date}</span>
                    <span className="text-caption text-neutral-500">
                      {formatEggBreakdown(p.eggsProduced)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-body font-bold text-neutral-900 tabular-nums block">
                      {p.eggsProduced.toLocaleString('en-IN')} eggs
                    </span>
                    {p.brokenEggs > 0 && (
                      <span className="text-[11px] text-danger-500 block">
                        {p.brokenEggs} broken
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
