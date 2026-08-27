import Dexie, { Table } from 'dexie';

export interface LocalFarm {
  id: string;
  name: string;
  petiSize: number;
  openingEggStock: number;
  openingCash: string;
  isSetupComplete: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalEggProduction {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  eggsProduced: number;
  brokenEggs: number;
  usableEggs: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCustomer {
  id: string;
  farmId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  openingBalance: string;
  currentBalance: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSale {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  customerId: string;
  eggsQty: number;
  pricePerEgg: string;
  totalAmount: string;
  amountReceived: string;
  amountDue: string;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string | null;
  cashEntryId?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCustomerPayment {
  id: string;
  farmId: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  amount: string;
  isAdvance: boolean;
  notes?: string | null;
  cashEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCashEntry {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  type: 'IN' | 'OUT';
  amount: string;
  source: 'SALE' | 'CUSTOMER_PAYMENT' | 'LABOUR' | 'EXPENSE' | 'MANUAL';
  referenceId?: string | null;
  notes?: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalLabourer {
  id: string;
  farmId: string;
  name: string;
  phone?: string | null;
  role: string;
  salaryType: 'MONTHLY' | 'DAILY' | 'PER_TASK';
  salaryAmount: string;
  joiningDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalLabourPayment {
  id: string;
  farmId: string;
  labourerId: string;
  date: string; // YYYY-MM-DD
  amount: string;
  paymentType: 'SALARY' | 'ADVANCE';
  notes?: string | null;
  cashEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalExpenseCategory {
  id: string;
  farmId: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface LocalExpense {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  quantity?: string | null;
  unitCost?: string | null;
  totalAmount: string;
  notes?: string | null;
  cashEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalEggMarketPrice {
  id: string;
  date: string; // YYYY-MM-DD
  zone: string;
  pricePer100: number;
  pricePerEgg: number;
  pricePerTray: number;
  pricePerPeti: number;
  source: string;
  rawText?: string | null;
  updatedAt: string;
}

export interface LocalBackupLog {
  id: string;
  farmId: string;
  driveFileId?: string | null;
  fileName: string;
  fileSizeBytes: number;
  type: 'MANUAL' | 'AUTO';
  status: 'SUCCESS' | 'FAILED';
  recordCount: number;
  createdAt: string;
}

export class KukkutProDatabase extends Dexie {
  farms!: Table<LocalFarm, string>;
  eggProductions!: Table<LocalEggProduction, string>;
  customers!: Table<LocalCustomer, string>;
  sales!: Table<LocalSale, string>;
  customerPayments!: Table<LocalCustomerPayment, string>;
  cashEntries!: Table<LocalCashEntry, string>;
  labourers!: Table<LocalLabourer, string>;
  labourPayments!: Table<LocalLabourPayment, string>;
  expenseCategories!: Table<LocalExpenseCategory, string>;
  expenses!: Table<LocalExpense, string>;
  eggMarketPrices!: Table<LocalEggMarketPrice, string>;
  backupLogs!: Table<LocalBackupLog, string>;

  constructor() {
    super('KukkutProLocalDB');

    this.version(1).stores({
      farms: 'id, isDemo',
      eggProductions: 'id, farmId, date, [farmId+date]',
      customers: 'id, farmId, name, phone, isActive',
      sales: 'id, farmId, date, customerId, status, [farmId+date]',
      customerPayments: 'id, farmId, customerId, date, [farmId+date]',
      cashEntries: 'id, farmId, date, type, source, [farmId+date]',
      labourers: 'id, farmId, name, isActive',
      labourPayments: 'id, farmId, labourerId, date, [farmId+date]',
      expenseCategories: 'id, farmId, name, isActive',
      expenses: 'id, farmId, date, category, [farmId+date]',
      eggMarketPrices: 'id, date, zone, [date+zone]',
      backupLogs: 'id, farmId, createdAt',
    });
  }
}

export const db = new KukkutProDatabase();

/**
 * Initializes local Dexie database if not yet populated.
 */
export async function initLocalDatabase() {
  const farmCount = await db.farms.count();
  if (farmCount === 0) {
    const realFarmId = 'real_farm_default';
    const now = new Date().toISOString();

    await db.farms.add({
      id: realFarmId,
      name: 'Sumit Poultry Farm',
      petiSize: 210,
      openingEggStock: 10000,
      openingCash: '10000.00',
      isSetupComplete: true,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    });

    const defaultCategories = [
      'Feed (Makaa/Daana)',
      'Medicine & Vaccines',
      'Electricity & Light',
      'Bedding (Bhoosa)',
      'Transport & Delivery',
      'Equipment & Maintenance',
      'Labour Daily Wages',
      'Miscellaneous',
    ];

    for (const name of defaultCategories) {
      await db.expenseCategories.add({
        id: `cat_${name.substring(0, 4).toLowerCase()}_${Date.now()}_${Math.random()}`,
        farmId: realFarmId,
        name,
        isSystem: true,
        isActive: true,
        createdAt: now,
      });
    }
  }
}
