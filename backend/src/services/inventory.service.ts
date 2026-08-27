import { prisma } from '../lib/prisma';
import { PETI_SIZE, TRAY_SIZE } from '../lib/constants';
import { AppError } from '../middleware/errorHandler';

export interface EggDisplayBreakdown {
  peti: number;
  trays: number;
  looseEggs: number;
}

export interface DailyStockResult {
  date: string;
  openingStock: number;
  produced: number;
  sold: number;
  broken: number;
  closingStock: number;
  display: EggDisplayBreakdown;
}

export function computeEggDisplay(totalEggs: number): EggDisplayBreakdown {
  const safeEggs = Math.max(0, Math.floor(totalEggs || 0));
  const peti = Math.floor(safeEggs / PETI_SIZE);
  const remainderAfterPeti = safeEggs % PETI_SIZE;
  const trays = Math.floor(remainderAfterPeti / TRAY_SIZE);
  const looseEggs = remainderAfterPeti % TRAY_SIZE;

  return { peti, trays, looseEggs };
}

export class InventoryService {
  /**
   * Computes the cumulative stock movement prior to a given target date.
   * Day 0 opening stock is taken from Farm.openingEggStock.
   */
  async getOpeningStock(farmId: string, targetDateStr: string): Promise<number> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { openingEggStock: true },
    });

    const baseOpeningStock = farm?.openingEggStock || 0;
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);

    // Sum production prior to targetDate
    const priorProduction = await prisma.eggProduction.aggregate({
      where: {
        farmId,
        date: { lt: targetDate },
      },
      _sum: {
        eggsProduced: true,
        brokenEggs: true,
      },
    });

    // Sum non-voided sales prior to targetDate
    const priorSales = await prisma.sale.aggregate({
      where: {
        farmId,
        date: { lt: targetDate },
        status: { not: 'VOIDED' },
      },
      _sum: {
        eggsQty: true,
      },
    });

    const produced = priorProduction._sum.eggsProduced || 0;
    const broken = priorProduction._sum.brokenEggs || 0;
    const sold = priorSales._sum.eggsQty || 0;

    return baseOpeningStock + produced - sold - broken;
  }

  /**
   * Computes stock metrics for a single date.
   */
  async getStock(farmId: string, dateStr: string): Promise<DailyStockResult> {
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    const openingStock = await this.getOpeningStock(farmId, dateStr);

    const production = await prisma.eggProduction.findUnique({
      where: {
        farmId_date: {
          farmId,
          date: targetDate,
        },
      },
    });

    const salesAggregate = await prisma.sale.aggregate({
      where: {
        farmId,
        date: targetDate,
        status: { not: 'VOIDED' },
      },
      _sum: {
        eggsQty: true,
      },
    });

    const produced = production?.eggsProduced || 0;
    const broken = production?.brokenEggs || 0;
    const sold = salesAggregate._sum.eggsQty || 0;

    const closingStock = openingStock + produced - sold - broken;

    return {
      date: dateStr,
      openingStock,
      produced,
      sold,
      broken,
      closingStock,
      display: computeEggDisplay(closingStock),
    };
  }

  /**
   * Validates if a sale of `requestedEggs` on `dateStr` is permissible without turning closing stock negative.
   */
  async validateStockForSale(
    farmId: string,
    dateStr: string,
    requestedEggs: number
  ): Promise<{ availableStock: number; isValid: boolean }> {
    const currentStock = await this.getStock(farmId, dateStr);
    const availableStock = currentStock.closingStock;

    if (requestedEggs > availableStock) {
      return { availableStock, isValid: false };
    }

    return { availableStock, isValid: true };
  }

  /**
   * Recalculates and verifies that from `fromDateStr` forward, no day drops below 0.
   */
  async recalculate(farmId: string, fromDateStr: string): Promise<void> {
    const fromDate = new Date(`${fromDateStr}T00:00:00.000Z`);

    // Fetch distinct dates with activity from fromDate forward
    const productionDates = await prisma.eggProduction.findMany({
      where: { farmId, date: { gte: fromDate } },
      select: { date: true },
    });

    const salesDates = await prisma.sale.findMany({
      where: { farmId, date: { gte: fromDate }, status: { not: 'VOIDED' } },
      select: { date: true },
    });

    const dateSet = new Set<string>();
    dateSet.add(fromDateStr);
    productionDates.forEach((p) => dateSet.add(p.date.toISOString().split('T')[0]));
    salesDates.forEach((s) => dateSet.add(s.date.toISOString().split('T')[0]));

    const sortedDates = Array.from(dateSet).sort();

    for (const d of sortedDates) {
      const stock = await this.getStock(farmId, d);
      if (stock.closingStock < 0) {
        throw new AppError(
          `Action would result in negative closing stock (${stock.closingStock} eggs) on ${d}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }
  }

  /**
   * Returns daily inventory history for a date range.
   */
  async getHistory(farmId: string, fromStr?: string, toStr?: string): Promise<DailyStockResult[]> {
    const toDate = toStr ? new Date(`${toStr}T00:00:00.000Z`) : new Date();
    const fromDate = fromStr
      ? new Date(`${fromStr}T00:00:00.000Z`)
      : new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000); // default last 30 days

    const results: DailyStockResult[] = [];
    const current = new Date(fromDate);

    while (current <= toDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayStock = await this.getStock(farmId, dateStr);
      results.push(dayStock);
      current.setDate(current.getDate() + 1);
    }

    return results;
  }
}

export const inventoryService = new InventoryService();
