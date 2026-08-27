import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PETI_SIZE, TRAY_SIZE } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function breakdownEggs(totalEggs: number) {
  const safeEggs = Math.max(0, Math.floor(totalEggs || 0));
  const peti = Math.floor(safeEggs / PETI_SIZE);
  const remainderAfterPeti = safeEggs % PETI_SIZE;
  const trays = Math.floor(remainderAfterPeti / TRAY_SIZE);
  const loose = remainderAfterPeti % TRAY_SIZE;

  return { peti, trays, loose, totalEggs: safeEggs };
}

export function formatEggBreakdown(totalEggs: number): string {
  const { peti, trays, loose } = breakdownEggs(totalEggs);
  const parts: string[] = [];
  if (peti > 0) parts.push(`${peti} peti`);
  if (trays > 0) parts.push(`${trays} tray${trays > 1 ? 's' : ''}`);
  if (loose > 0 || parts.length === 0) parts.push(`${loose} loose`);
  return parts.join(' + ');
}
