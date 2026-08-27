import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface BackupEnvelope {
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

export class BackupService {
  /**
   * Generates a SHA-256 hash string for data integrity validation.
   */
  private generateChecksum(data: any): string {
    const jsonStr = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  /**
   * Exports full data snapshot for the REAL farm.
   * Strict protection: Rejects any attempt to backup a demo farm.
   */
  async exportRealFarmBackup(farmId: string): Promise<BackupEnvelope> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new Error('Farm not found');
    }

    if (farm.isDemo) {
      throw new Error('Security Violation: Demo farm data cannot be exported into Google Drive backup.');
    }

    // Fetch all real farm domain records using accurate Prisma model names
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
      prisma.eggProduction.findMany({ where: { farmId }, orderBy: { date: 'asc' } }),
      prisma.customer.findMany({ where: { farmId }, orderBy: { createdAt: 'asc' } }),
      prisma.customerPayment.findMany({ where: { farmId }, orderBy: { date: 'asc' } }),
      prisma.sale.findMany({ where: { farmId }, orderBy: { date: 'asc' } }),
      prisma.cashEntry.findMany({ where: { farmId }, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] }),
      prisma.labourer.findMany({ where: { farmId }, orderBy: { createdAt: 'asc' } }),
      prisma.labourPayment.findMany({ where: { farmId }, orderBy: { date: 'asc' } }),
      prisma.expenseCategory.findMany({ where: { farmId }, orderBy: { createdAt: 'asc' } }),
      prisma.expense.findMany({ where: { farmId }, orderBy: { date: 'asc' } }),
      prisma.eggMarketPrice.findMany({ orderBy: { date: 'desc' }, take: 100 }),
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
    const checksum = this.generateChecksum(backupData);

    const envelope: BackupEnvelope = {
      format: 'KUKKUTPRO_BACKUP',
      version: 1,
      generatedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      farm: {
        name: farm.name,
        petiSize: farm.petiSize,
        openingEggStock: farm.openingEggStock,
        openingCash: farm.openingCash.toString(),
        isSetupComplete: farm.isSetupComplete,
        isDemo: false,
      },
      data: backupData,
      meta: {
        totalRecords,
        recordCounts,
        checksum,
      },
    };

    return envelope;
  }

  /**
   * Restores a backup envelope into the target REAL farm.
   * Validates structure, format, version, and checksum.
   * Strict protection: Rejects demo data or corrupted payloads.
   */
  async restoreRealFarmBackup(targetFarmId: string, backup: BackupEnvelope) {
    if (backup.format !== 'KUKKUTPRO_BACKUP') {
      throw new Error('Invalid backup format. File is not a valid KukkutPro backup.');
    }

    if (backup.version !== 1) {
      throw new Error(`Unsupported backup version (${backup.version}). Current supported version is 1.`);
    }

    if (backup.farm?.isDemo) {
      throw new Error('Security Violation: Cannot restore Demo data into Real farm records.');
    }

    const targetFarm = await prisma.farm.findUnique({
      where: { id: targetFarmId },
    });

    if (!targetFarm) {
      throw new Error('Target farm not found');
    }

    if (targetFarm.isDemo) {
      throw new Error('Security Violation: Target farm is a Demo Farm. Backups can only be restored into Real Farm.');
    }

    // Verify SHA-256 Checksum
    const expectedChecksum = this.generateChecksum(backup.data);
    if (backup.meta?.checksum && backup.meta.checksum !== expectedChecksum) {
      throw new Error('Checksum mismatch! The backup file appears corrupted or altered.');
    }

    const { data, farm: restoredFarmSettings } = backup;

    // Execute atomic transaction for safe complete replacement
    return await prisma.$transaction(
      async (tx) => {
        // 1. Delete existing real farm transactional data in proper reverse FK order
        await tx.sale.deleteMany({ where: { farmId: targetFarmId } });
        await tx.customerPayment.deleteMany({ where: { farmId: targetFarmId } });
        await tx.customer.deleteMany({ where: { farmId: targetFarmId } });
        await tx.labourPayment.deleteMany({ where: { farmId: targetFarmId } });
        await tx.labourer.deleteMany({ where: { farmId: targetFarmId } });
        await tx.expense.deleteMany({ where: { farmId: targetFarmId } });
        await tx.expenseCategory.deleteMany({ where: { farmId: targetFarmId } });
        await tx.cashEntry.deleteMany({ where: { farmId: targetFarmId } });
        await tx.eggProduction.deleteMany({ where: { farmId: targetFarmId } });

        // 2. Update farm profile & settings
        await tx.farm.update({
          where: { id: targetFarmId },
          data: {
            name: restoredFarmSettings.name || targetFarm.name,
            petiSize: restoredFarmSettings.petiSize || 210,
            openingEggStock: restoredFarmSettings.openingEggStock || 0,
            openingCash: new Prisma.Decimal(restoredFarmSettings.openingCash || '0'),
            isSetupComplete: true,
          },
        });

        // 3. Insert Expense Categories
        if (data.expenseCategories && data.expenseCategories.length > 0) {
          for (const cat of data.expenseCategories) {
            await tx.expenseCategory.create({
              data: {
                id: cat.id,
                farmId: targetFarmId,
                name: cat.name,
                isSystem: cat.isSystem ?? false,
                isActive: cat.isActive ?? true,
                createdAt: new Date(cat.createdAt),
              },
            });
          }
        }

        // 4. Insert Customers
        if (data.customers && data.customers.length > 0) {
          for (const c of data.customers) {
            await tx.customer.create({
              data: {
                id: c.id,
                farmId: targetFarmId,
                name: c.name,
                phone: c.phone || null,
                address: c.address || null,
                notes: c.notes || null,
                isActive: c.isActive ?? true,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
              },
            });
          }
        }

        // 5. Insert Labourers
        if (data.labourers && data.labourers.length > 0) {
          for (const l of data.labourers) {
            await tx.labourer.create({
              data: {
                id: l.id,
                farmId: targetFarmId,
                name: l.name,
                phone: l.phone || null,
                role: l.role || 'Worker',
                salaryType: l.salaryType || 'MONTHLY',
                salaryAmount: new Prisma.Decimal(l.salaryAmount || '0'),
                joiningDate: new Date(l.joiningDate),
                isActive: l.isActive ?? true,
                createdAt: new Date(l.createdAt),
                updatedAt: new Date(l.updatedAt),
              },
            });
          }
        }

        // 6. Insert Cash Entries
        if (data.cashEntries && data.cashEntries.length > 0) {
          for (const ce of data.cashEntries) {
            await tx.cashEntry.create({
              data: {
                id: ce.id,
                farmId: targetFarmId,
                date: new Date(ce.date),
                type: ce.type,
                amount: new Prisma.Decimal(ce.amount),
                source: ce.source,
                referenceId: ce.referenceId || null,
                notes: ce.notes || null,
                isManual: ce.isManual ?? false,
                createdAt: new Date(ce.createdAt),
                updatedAt: new Date(ce.updatedAt),
              },
            });
          }
        }

        // 7. Insert Egg Productions
        if (data.eggProductions && data.eggProductions.length > 0) {
          for (const p of data.eggProductions) {
            await tx.eggProduction.create({
              data: {
                id: p.id,
                farmId: targetFarmId,
                date: new Date(p.date),
                eggsProduced: p.eggsProduced,
                brokenEggs: p.brokenEggs || 0,
                notes: p.notes || null,
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt),
              },
            });
          }
        }

        // 8. Insert Sales
        if (data.sales && data.sales.length > 0) {
          for (const s of data.sales) {
            await tx.sale.create({
              data: {
                id: s.id,
                farmId: targetFarmId,
                customerId: s.customerId,
                date: new Date(s.date),
                eggsQty: s.eggsQty,
                pricePerEgg: new Prisma.Decimal(s.pricePerEgg),
                totalAmount: new Prisma.Decimal(s.totalAmount),
                amountReceived: new Prisma.Decimal(s.amountReceived || '0'),
                amountDue: new Prisma.Decimal(s.amountDue || '0'),
                status: s.status || 'UNPAID',
                cashEntryId: s.cashEntryId || null,
                notes: s.notes || null,
                voidedAt: s.voidedAt ? new Date(s.voidedAt) : null,
                voidReason: s.voidReason || null,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
              },
            });
          }
        }

        // 9. Insert Customer Payments
        if (data.customerPayments && data.customerPayments.length > 0) {
          for (const cp of data.customerPayments) {
            await tx.customerPayment.create({
              data: {
                id: cp.id,
                farmId: targetFarmId,
                customerId: cp.customerId,
                date: new Date(cp.date),
                amount: new Prisma.Decimal(cp.amount),
                isAdvance: cp.isAdvance ?? false,
                cashEntryId: cp.cashEntryId || null,
                notes: cp.notes || null,
                createdAt: new Date(cp.createdAt),
                updatedAt: new Date(cp.updatedAt),
              },
            });
          }
        }

        // 10. Insert Labour Payments
        if (data.labourPayments && data.labourPayments.length > 0) {
          for (const lp of data.labourPayments) {
            await tx.labourPayment.create({
              data: {
                id: lp.id,
                farmId: targetFarmId,
                labourerId: lp.labourerId,
                date: new Date(lp.date),
                amount: new Prisma.Decimal(lp.amount),
                paymentType: lp.paymentType,
                notes: lp.notes || null,
                cashEntryId: lp.cashEntryId || null,
                createdAt: new Date(lp.createdAt),
                updatedAt: new Date(lp.updatedAt),
              },
            });
          }
        }

        // 11. Insert Expenses
        if (data.expenses && data.expenses.length > 0) {
          for (const exp of data.expenses) {
            await tx.expense.create({
              data: {
                id: exp.id,
                farmId: targetFarmId,
                date: new Date(exp.date),
                category: exp.category,
                description: exp.description,
                quantity: exp.quantity ? new Prisma.Decimal(exp.quantity) : null,
                unitCost: exp.unitCost ? new Prisma.Decimal(exp.unitCost) : null,
                totalAmount: new Prisma.Decimal(exp.totalAmount),
                notes: exp.notes || null,
                cashEntryId: exp.cashEntryId || null,
                createdAt: new Date(exp.createdAt),
                updatedAt: new Date(exp.updatedAt),
              },
            });
          }
        }

        return {
          restoredAt: new Date().toISOString(),
          recordCounts: backup.meta.recordCounts,
          totalRecords: backup.meta.totalRecords,
          farmName: restoredFarmSettings.name,
        };
      },
      {
        timeout: 30000,
      }
    );
  }

  /**
   * Logs backup event into local database log.
   */
  async logBackupActivity(params: {
    farmId: string;
    driveFileId?: string;
    fileName: string;
    fileSizeBytes?: number;
    type?: 'MANUAL' | 'AUTO';
    status?: 'SUCCESS' | 'FAILED';
    recordCount?: number;
  }) {
    return await prisma.backupLog.create({
      data: {
        farmId: params.farmId,
        driveFileId: params.driveFileId || null,
        fileName: params.fileName,
        fileSizeBytes: params.fileSizeBytes || 0,
        type: params.type || 'MANUAL',
        status: params.status || 'SUCCESS',
        recordCount: params.recordCount || 0,
      },
    });
  }

  /**
   * Gets backup history for the farm.
   */
  async getBackupHistory(farmId: string, limit = 20) {
    return await prisma.backupLog.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const backupService = new BackupService();
