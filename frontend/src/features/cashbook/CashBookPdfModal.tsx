import React, { useState, useMemo } from 'react';
import { BottomSheet } from '../../components/shared/BottomSheet';
import { useCashbook } from '../../hooks/useCashbook';
import { useSettings } from '../../hooks/useSettings';
import { generateCashbookPdf } from '../../lib/cashbookPdf';
import { formatCurrency } from '../../lib/utils';
import { FileDown, Calendar, Check, Loader2, Sparkles } from 'lucide-react';

interface CashBookPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  { name: 'January', short: 'Jan', num: 1 },
  { name: 'February', short: 'Feb', num: 2 },
  { name: 'March', short: 'Mar', num: 3 },
  { name: 'April', short: 'Apr', num: 4 },
  { name: 'May', short: 'May', num: 5 },
  { name: 'June', short: 'Jun', num: 6 },
  { name: 'July', short: 'Jul', num: 7 },
  { name: 'August', short: 'Aug', num: 8 },
  { name: 'September', short: 'Sep', num: 9 },
  { name: 'October', short: 'Oct', num: 10 },
  { name: 'November', short: 'Nov', num: 11 },
  { name: 'December', short: 'Dec', num: 12 },
];

export const CashBookPdfModal: React.FC<CashBookPdfModalProps> = ({ isOpen, onClose }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1; // 1-12

  const [periodType, setPeriodType] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [isGenerating, setIsGenerating] = useState(false);

  const { settings } = useSettings();

  // Compute start and end dates based on selection
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (periodType === 'YEAR') {
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
        periodLabel: `Full Year ${selectedYear}`,
      };
    }

    // Month mode
    const monthObj = MONTHS.find((m) => m.num === selectedMonth) || MONTHS[currentMonthNum - 1];
    const padMonth = String(selectedMonth).padStart(2, '0');
    const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    return {
      startDate: `${selectedYear}-${padMonth}-01`,
      endDate: `${selectedYear}-${padMonth}-${String(lastDayOfMonth).padStart(2, '0')}`,
      periodLabel: `${monthObj.name} ${selectedYear}`,
    };
  }, [periodType, selectedYear, selectedMonth]);

  // Fetch cashbook data for the selected period
  const { cashbook, isLoading } = useCashbook(startDate, endDate);

  const handleDownload = async () => {
    if (!cashbook) return;
    setIsGenerating(true);

    try {
      generateCashbookPdf({
        farmName: settings?.name || 'KukkutPro Poultry Farm',
        periodLabel,
        startDate,
        endDate,
        openingBalance: cashbook.openingBalance,
        closingBalance: cashbook.closingBalance,
        totalIn: cashbook.summary.totalIn,
        totalOut: cashbook.summary.totalOut,
        entries: cashbook.entries,
      });

      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGenerating(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Download Cash Book Statement (.PDF)">
      <div className="space-y-4">
        {/* Period Mode Selector */}
        <div className="flex bg-neutral-200/70 p-1 rounded-md">
          <button
            type="button"
            onClick={() => setPeriodType('MONTH')}
            className={`w-1/2 py-2 text-body-sm font-semibold rounded transition-all ${
              periodType === 'MONTH' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
            }`}
          >
            By Month
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('YEAR')}
            className={`w-1/2 py-2 text-body-sm font-semibold rounded transition-all ${
              periodType === 'YEAR' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
            }`}
          >
            This Year ({selectedYear})
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between px-1">
          <span className="text-label font-medium text-neutral-700">Financial Year:</span>
          <div className="flex gap-1.5">
            {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded text-caption font-bold border transition-colors ${
                  selectedYear === yr
                    ? 'bg-brand-500 text-white border-brand-500 shadow-2xs'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Month Grid (Only when periodType is 'MONTH') */}
        {periodType === 'MONTH' && (
          <div>
            <label className="block text-label text-neutral-700 mb-2 font-medium">
              Select Month:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MONTHS.map((m) => {
                const isSelected = selectedMonth === m.num;
                const isCurrentMonth = currentYear === selectedYear && currentMonthNum === m.num;

                return (
                  <button
                    key={m.num}
                    type="button"
                    onClick={() => setSelectedMonth(m.num)}
                    className={`py-2 px-1 rounded-md text-caption font-bold border transition-all text-center relative ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-brand-50 hover:border-brand-300'
                    }`}
                  >
                    {m.short}
                    {isCurrentMonth && !isSelected && (
                      <span className="block text-[9px] text-brand-600 font-semibold">Now</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Statement Summary Preview */}
        <div className="p-3.5 bg-neutral-100 rounded-md border border-neutral-200 space-y-2">
          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-200 text-body-sm">
            <span className="font-semibold text-neutral-800">{periodLabel}</span>
            <span className="text-caption text-neutral-500">
              {isLoading ? 'Calculating...' : `${cashbook?.entries.length || 0} transactions`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-white p-2 rounded border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Total In</span>
              <span className="text-body-sm font-bold text-success-600 tabular-nums">
                +{formatCurrency(cashbook?.summary.totalIn || 0)}
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Total Out</span>
              <span className="text-body-sm font-bold text-danger-500 tabular-nums">
                -{formatCurrency(cashbook?.summary.totalOut || 0)}
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-neutral-200">
              <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Closing</span>
              <span className="text-body-sm font-bold text-neutral-900 tabular-nums">
                {formatCurrency(cashbook?.closingBalance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Download Action Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading || isGenerating || !cashbook}
          className="w-full h-12 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating PDF Statement...</span>
            </>
          ) : (
            <>
              <FileDown size={20} />
              <span>Download {periodLabel} (.PDF)</span>
            </>
          )}
        </button>
      </div>
    </BottomSheet>
  );
};
