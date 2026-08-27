export const PETI_SIZE = 210;
export const TRAY_SIZE = 30;

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Feed',
  'Medicine',
  'Vaccines',
  'Supplements',
  'Packaging',
  'Transport',
  'Electricity',
  'Water',
  'Equipment/Repairs',
  'Labour',
  'Other',
] as const;

export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number] | string;
