export type SaleStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'VOIDED';
export type CashEntryType = 'IN' | 'OUT';
export type CashSource = 'SALE' | 'CUSTOMER_PAYMENT' | 'LABOUR' | 'EXPENSE' | 'MANUAL';
export type SalaryType = 'MONTHLY' | 'DAILY' | 'PER_TASK';
export type PaymentType = 'SALARY' | 'ADVANCE';

export interface EggDisplay {
  peti: number;
  trays: number;
  looseEggs: number;
}

export interface FarmSettings {
  id: string;
  name: string;
  openingEggStock: number;
  openingCash: string;
  petiSize: number;
  isSetupComplete: boolean;
  expenseCategories: string[];
}

export interface EggProduction {
  id: string;
  date: string;
  eggsProduced: number;
  brokenEggs: number;
  notes?: string | null;
  closingStock?: number;
  display?: EggDisplay;
}

export interface EggInventoryStock {
  date: string;
  openingStock: number;
  produced: number;
  sold: number;
  broken: number;
  closingStock: number;
  display: EggDisplay;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName?: string;
  eggsQty: number;
  petiQty?: number;
  pricePerEgg: string;
  totalAmount: string;
  amountReceived: string;
  amountDue: string;
  status: SaleStatus;
  notes?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  date: string;
  amount: string;
  isAdvance: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  totalPurchases?: string;
  totalPaid?: string;
  outstanding: string;
  lastTransactionDate?: string | null;
  sales?: Sale[];
  payments?: CustomerPayment[];
}

export interface CashEntry {
  id: string;
  date: string;
  type: CashEntryType;
  amount: string;
  source: CashSource;
  referenceId?: string | null;
  notes?: string | null;
  isManual: boolean;
  createdAt: string;
}

export interface CashBookSummary {
  totalIn: string;
  totalOut: string;
  net: string;
}

export interface CashBookResponse {
  openingBalance: string;
  closingBalance: string;
  entries: CashEntry[];
  summary: CashBookSummary;
}

export interface LabourPayment {
  id: string;
  labourerId: string;
  date: string;
  amount: string;
  paymentType: PaymentType;
  notes?: string | null;
  createdAt: string;
}

export interface Labourer {
  id: string;
  name: string;
  phone?: string | null;
  role?: string | null;
  salaryType: SalaryType;
  salaryAmount: string;
  joiningDate: string;
  totalAccrued?: string;
  totalPaid?: string;
  outstanding: string;
  advanceBalance: string;
  payments?: LabourPayment[];
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  quantity?: number | null;
  unitCost?: string | null;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
}

export interface DashboardResponse {
  date: string;
  production: {
    eggsProduced: number;
    brokenEggs: number;
  };
  inventory: {
    closingStock: number;
    display: EggDisplay;
  };
  sales: {
    eggsSold: number;
    cashCollected: string;
    creditSales: string;
    numberOfSales: number;
  };
  cash: {
    openingBalance: string;
    closingBalance: string;
    totalIn: string;
    totalOut: string;
  };
  expenses: {
    total: string;
  };
  outstanding: {
    totalCustomerDues: string;
    totalLabourDues: string;
    topCustomers: Array<{
      id: string;
      name: string;
      outstanding: string;
    }>;
  };
}
