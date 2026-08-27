import { KukkutProDatabase } from './db';

export interface DexieBackupEnvelope {
  format: 'KUKKUTPRO_BACKUP';
  version: number;
  generatedAt: string;
  appVersion: string;
  farm: {
    name: string;
    petiSize: number;
    openingEggStock: number;
    openingCash: string;
    isSetupComplete: boolean;
    isDemo: boolean;
  };
  data: {
    eggProductions: any[];
    customers: any[];
    customerPayments: any[];
    sales: any[];
    cashEntries: any[];
    labourers: any[];
    labourPayments: any[];
    expenseCategories: any[];
    expenses: any[];
    eggMarketPrices: any[];
  };
  meta: {
    totalRecords: number;
    recordCounts: Record<string, number>;
    checksum: string;
  };
}

/**
 * Calculates SHA-256 checksum using the browser's native Web Crypto API.
 */
async function computeSha256(data: any): Promise<string> {
  const jsonStr = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compiles and exports the complete Real Farm database directly from IndexedDB (Dexie).
 * Strict protection: Rejects demo data.
 */
export async function exportDexieBackup(db: KukkutProDatabase): Promise<DexieBackupEnvelope> {
  const realFarm = await db.farms.filter((f) => !f.isDemo).first();

  if (!realFarm) {
    throw new Error('Real Farm record not found in local database.');
  }

  const farmId = realFarm.id;

  const [
    eggProductions,
    customers,
    customerPayments,
    sales,
    cashEntries,
    labourers,
    labourPayments,
    expenseCategories,
    expenses,
    eggMarketPrices,
  ] = await Promise.all([
    db.eggProductions.where('farmId').equals(farmId).sortBy('date'),
    db.customers.where('farmId').equals(farmId).sortBy('createdAt'),
    db.customerPayments.where('farmId').equals(farmId).sortBy('date'),
    db.sales.where('farmId').equals(farmId).sortBy('date'),
    db.cashEntries.where('farmId').equals(farmId).sortBy('date'),
    db.labourers.where('farmId').equals(farmId).sortBy('createdAt'),
    db.labourPayments.where('farmId').equals(farmId).sortBy('date'),
    db.expenseCategories.where('farmId').equals(farmId).sortBy('createdAt'),
    db.expenses.where('farmId').equals(farmId).sortBy('date'),
    db.eggMarketPrices.orderBy('date').reverse().limit(100).toArray(),
  ]);

  const backupData = {
    eggProductions,
    customers,
    customerPayments,
    sales,
    cashEntries,
    labourers,
    labourPayments,
    expenseCategories,
    expenses,
    eggMarketPrices,
  };

  const recordCounts: Record<string, number> = {
    eggProductions: eggProductions.length,
    customers: customers.length,
    customerPayments: customerPayments.length,
    sales: sales.length,
    cashEntries: cashEntries.length,
    labourers: labourers.length,
    labourPayments: labourPayments.length,
    expenseCategories: expenseCategories.length,
    expenses: expenses.length,
    eggMarketPrices: eggMarketPrices.length,
  };

  const totalRecords = Object.values(recordCounts).reduce((acc, n) => acc + n, 0);
  const checksum = await computeSha256(backupData);

  return {
    format: 'KUKKUTPRO_BACKUP',
    version: 1,
    generatedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    farm: {
      name: realFarm.name,
      petiSize: realFarm.petiSize,
      openingEggStock: realFarm.openingEggStock,
      openingCash: realFarm.openingCash,
      isSetupComplete: realFarm.isSetupComplete,
      isDemo: false,
    },
    data: backupData,
    meta: {
      totalRecords,
      recordCounts,
      checksum,
    },
  };
}

/**
 * Restores a backup envelope directly into IndexedDB (Dexie).
 * Validates integrity checksum and enforces strict demo isolation.
 */
export async function restoreDexieBackup(
  db: KukkutProDatabase,
  backup: DexieBackupEnvelope
): Promise<{ restoredAt: string; totalRecords: number; farmName: string }> {
  if (backup.format !== 'KUKKUTPRO_BACKUP') {
    throw new Error('Invalid format: File is not a valid KukkutPro backup.');
  }

  if (backup.version !== 1) {
    throw new Error(`Unsupported backup version (${backup.version}). Current supported version is 1.`);
  }

  if (backup.farm?.isDemo) {
    throw new Error('Security Violation: Demo farm data cannot be restored into real farm records.');
  }

  // Verify SHA-256 Checksum
  const expectedChecksum = await computeSha256(backup.data);
  if (backup.meta?.checksum && backup.meta.checksum !== expectedChecksum) {
    throw new Error('Integrity Check Failed: The backup file is corrupted or has been altered.');
  }

  const realFarm = await db.farms.filter((f) => !f.isDemo).first();
  const farmId = realFarm?.id || 'real_farm_default';
  const { data, farm: restoredFarmSettings } = backup;

  await db.transaction(
    'rw',
    [
      db.farms,
      db.eggProductions,
      db.customers,
      db.customerPayments,
      db.sales,
      db.cashEntries,
      db.labourers,
      db.labourPayments,
      db.expenseCategories,
      db.expenses,
      db.eggMarketPrices,
    ],
    async () => {
      // 1. Wipe existing real farm records
      await Promise.all([
        db.eggProductions.where('farmId').equals(farmId).delete(),
        db.customers.where('farmId').equals(farmId).delete(),
        db.customerPayments.where('farmId').equals(farmId).delete(),
        db.sales.where('farmId').equals(farmId).delete(),
        db.cashEntries.where('farmId').equals(farmId).delete(),
        db.labourers.where('farmId').equals(farmId).delete(),
        db.labourPayments.where('farmId').equals(farmId).delete(),
        db.expenseCategories.where('farmId').equals(farmId).delete(),
        db.expenses.where('farmId').equals(farmId).delete(),
      ]);

      // 2. Update farm profile
      await db.farms.put({
        id: farmId,
        name: restoredFarmSettings.name || 'My Poultry Farm',
        petiSize: restoredFarmSettings.petiSize || 210,
        openingEggStock: restoredFarmSettings.openingEggStock || 0,
        openingCash: restoredFarmSettings.openingCash || '0',
        isSetupComplete: true,
        isDemo: false,
        createdAt: realFarm?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Bulk insert restored records
      if (data.expenseCategories?.length) await db.expenseCategories.bulkPut(data.expenseCategories);
      if (data.customers?.length) await db.customers.bulkPut(data.customers);
      if (data.labourers?.length) await db.labourers.bulkPut(data.labourers);
      if (data.cashEntries?.length) await db.cashEntries.bulkPut(data.cashEntries);
      if (data.eggProductions?.length) await db.eggProductions.bulkPut(data.eggProductions);
      if (data.sales?.length) await db.sales.bulkPut(data.sales);
      if (data.customerPayments?.length) await db.customerPayments.bulkPut(data.customerPayments);
      if (data.labourPayments?.length) await db.labourPayments.bulkPut(data.labourPayments);
      if (data.expenses?.length) await db.expenses.bulkPut(data.expenses);
      if (data.eggMarketPrices?.length) await db.eggMarketPrices.bulkPut(data.eggMarketPrices);
    }
  );

  return {
    restoredAt: new Date().toISOString(),
    totalRecords: backup.meta?.totalRecords || 0,
    farmName: restoredFarmSettings.name,
  };
}
