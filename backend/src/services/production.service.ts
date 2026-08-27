import { prisma } from '../lib/prisma';
import { inventoryService, computeEggDisplay } from './inventory.service';
import { settingsService } from './settings.service';
import { AppError } from '../middleware/errorHandler';

export interface CreateProductionInput {
  date: string;
  eggsProduced: number;
  brokenEggs?: number;
  notes?: string;
}

export interface UpdateProductionInput {
  eggsProduced?: number;
  brokenEggs?: number;
  notes?: string;
}

export class ProductionService {
  async createProduction(input: CreateProductionInput, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const broken = input.brokenEggs || 0;

    if (broken > input.eggsProduced) {
      throw new AppError(
        'Broken eggs cannot exceed eggs produced',
        400,
        'VALIDATION_ERROR',
        'brokenEggs'
      );
    }

    const entryDate = new Date(`${input.date}T00:00:00.000Z`);

    // Check future date limit (> 1 day in future)
    const now = new Date();
    const maxAllowedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (entryDate > maxAllowedDate) {
      throw new AppError('Date cannot be more than 1 day in the future', 400, 'VALIDATION_ERROR', 'date');
    }

    // Check for duplicate entry on same date
    const existing = await prisma.eggProduction.findUnique({
      where: {
        farmId_date: {
          farmId: farm.id,
          date: entryDate,
        },
      },
    });

    if (existing) {
      throw new AppError(
        'A production entry already exists for this date',
        409,
        'DUPLICATE_ENTRY'
      );
    }

    const production = await prisma.eggProduction.create({
      data: {
        farmId: farm.id,
        date: entryDate,
        eggsProduced: input.eggsProduced,
        brokenEggs: broken,
        notes: input.notes,
      },
    });

    // Verify stock consistency
    await inventoryService.recalculate(farm.id, input.date);

    const stock = await inventoryService.getStock(farm.id, input.date);

    return {
      id: production.id,
      date: input.date,
      eggsProduced: production.eggsProduced,
      brokenEggs: production.brokenEggs,
      notes: production.notes,
      closingStock: stock.closingStock,
      display: stock.display,
    };
  }

  async getProductionList(fromStr?: string, toStr?: string, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const toDate = toStr ? new Date(`${toStr}T23:59:59.999Z`) : new Date();
    const fromDate = fromStr
      ? new Date(`${fromStr}T00:00:00.000Z`)
      : new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000);

    const productions = await prisma.eggProduction.findMany({
      where: {
        farmId: farm.id,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    const results = await Promise.all(
      productions.map(async (p) => {
        const dateStr = p.date.toISOString().split('T')[0];
        const stock = await inventoryService.getStock(farm.id, dateStr);
        return {
          id: p.id,
          date: dateStr,
          eggsProduced: p.eggsProduced,
          brokenEggs: p.brokenEggs,
          notes: p.notes,
          closingStock: stock.closingStock,
          display: stock.display,
        };
      })
    );

    return results;
  }

  async getProductionByDate(dateStr: string, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    const production = await prisma.eggProduction.findUnique({
      where: {
        farmId_date: {
          farmId: farm.id,
          date: targetDate,
        },
      },
    });

    if (!production) {
      throw new AppError(`No production entry found for ${dateStr}`, 404, 'NOT_FOUND');
    }

    const stock = await inventoryService.getStock(farm.id, dateStr);

    return {
      id: production.id,
      date: dateStr,
      eggsProduced: production.eggsProduced,
      brokenEggs: production.brokenEggs,
      notes: production.notes,
      closingStock: stock.closingStock,
      display: stock.display,
    };
  }

  async updateProduction(id: string, input: UpdateProductionInput, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const existing = await prisma.eggProduction.findUnique({ where: { id } });

    if (!existing || existing.farmId !== farm.id) {
      throw new AppError('Production record not found', 404, 'NOT_FOUND');
    }

    const dateStr = existing.date.toISOString().split('T')[0];
    const newEggsProduced = input.eggsProduced !== undefined ? input.eggsProduced : existing.eggsProduced;
    const newBrokenEggs = input.brokenEggs !== undefined ? input.brokenEggs : existing.brokenEggs;

    if (newBrokenEggs > newEggsProduced) {
      throw new AppError('Broken eggs cannot exceed eggs produced', 400, 'VALIDATION_ERROR', 'brokenEggs');
    }

    // Check that eggsProduced is not less than eggs sold on that date
    const soldAggregate = await prisma.sale.aggregate({
      where: {
        farmId: farm.id,
        date: existing.date,
        status: { not: 'VOIDED' },
      },
      _sum: { eggsQty: true },
    });

    const totalSold = soldAggregate._sum.eggsQty || 0;
    const openingStock = await inventoryService.getOpeningStock(farm.id, dateStr);
    const available = openingStock + newEggsProduced - newBrokenEggs;

    if (totalSold > available) {
      throw new AppError(
        `Cannot reduce production: ${totalSold} eggs already sold on this date, but only ${available} would be available`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    const updated = await prisma.eggProduction.update({
      where: { id },
      data: {
        eggsProduced: newEggsProduced,
        brokenEggs: newBrokenEggs,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    // Recalculate downstream stock
    await inventoryService.recalculate(farm.id, dateStr);

    const stock = await inventoryService.getStock(farm.id, dateStr);

    return {
      id: updated.id,
      date: dateStr,
      eggsProduced: updated.eggsProduced,
      brokenEggs: updated.brokenEggs,
      notes: updated.notes,
      closingStock: stock.closingStock,
      display: stock.display,
    };
  }
}

export const productionService = new ProductionService();
