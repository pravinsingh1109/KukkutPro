import { prisma } from '../lib/prisma';
import { CashEntryType, CashSource, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface CreateCashEntryInput {
  date: string;
  type: CashEntryType;
  amount: string | number | Prisma.Decimal;
  source: CashSource;
  referenceId?: string;
  notes?: string;
  isManual?: boolean;
}

export class CashbookService {
  /**
   * Posts a new cash book entry (atomic ledger append).
   */
  async postEntry(farmId: string, input: CreateCashEntryInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const entryDate = new Date(`${input.date}T00:00:00.000Z`);
    const decimalAmount = new Prisma.Decimal(input.amount.toString());

    if (decimalAmount.lte(0)) {
      throw new AppError('Cash entry amount must be greater than zero', 400, 'VALIDATION_ERROR');
    }

    return client.cashEntry.create({
      data: {
        farmId,
        date: entryDate,
        type: input.type,
        amount: decimalAmount,
        source: input.source,
        referenceId: input.referenceId,
        notes: input.notes,
        isManual: input.isManual ?? false,
      },
    });
  }

  /**
   * Calculates closing cash balance as of target date.
   */
  async getBalance(farmId: string, dateStr: string): Promise<string> {
    const targetDate = new Date(`${dateStr}T23:59:59.999Z`);
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: { openingCash: true },
    });

    const baseOpeningCash = farm?.openingCash || new Prisma.Decimal(0);

    const cashIn = await prisma.cashEntry.aggregate({
      where: {
        farmId,
        date: { lte: targetDate },
        type: 'IN',
      },
      _sum: { amount: true },
    });

    const cashOut = await prisma.cashEntry.aggregate({
      where: {
        farmId,
        date: { lte: targetDate },
        type: 'OUT',
      },
      _sum: { amount: true },
    });

    const totalIn = cashIn._sum.amount || new Prisma.Decimal(0);
    const totalOut = cashOut._sum.amount || new Prisma.Decimal(0);

    const balance = baseOpeningCash.plus(totalIn).minus(totalOut);
    return balance.toFixed(2);
  }

  /**
   * Gets cash book entries and running summary for a date range.
   */
  async getEntries(farmId: string, fromStr?: string, toStr?: string) {
    const now = new Date();
    const toDate = toStr ? new Date(`${toStr}T23:59:59.999Z`) : now;
    const fromDate = fromStr
      ? new Date(`${fromStr}T00:00:00.000Z`)
      : new Date(toDate.getTime() - 29 * 24 * 60 * 60 * 1000);

    const fromDateMinusOneDay = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);
    const openingBalance = await this.getBalance(farmId, fromDateMinusOneDay.toISOString().split('T')[0]);

    const entries = await prisma.cashEntry.findMany({
      where: {
        farmId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    let totalIn = new Prisma.Decimal(0);
    let totalOut = new Prisma.Decimal(0);

    entries.forEach((e) => {
      if (e.type === 'IN') {
        totalIn = totalIn.plus(e.amount);
      } else {
        totalOut = totalOut.plus(e.amount);
      }
    });

    const net = totalIn.minus(totalOut);
    const closingBalance = new Prisma.Decimal(openingBalance).plus(net).toFixed(2);

    return {
      openingBalance,
      closingBalance,
      entries: entries.map((e) => ({
        id: e.id,
        date: e.date.toISOString().split('T')[0],
        type: e.type,
        source: e.source,
        amount: e.amount.toFixed(2),
        referenceId: e.referenceId,
        notes: e.notes,
        isManual: e.isManual,
        createdAt: e.createdAt.toISOString(),
      })),
      summary: {
        totalIn: totalIn.toFixed(2),
        totalOut: totalOut.toFixed(2),
        net: net.toFixed(2),
      },
    };
  }

  /**
   * Reverses an existing cash entry by creating an opposing entry.
   */
  async postReversal(farmId: string, originalEntryId: string, reason: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const original = await client.cashEntry.findUnique({
      where: { id: originalEntryId },
    });

    if (!original) {
      throw new AppError('Original cash entry not found', 404, 'NOT_FOUND');
    }

    const opposingType: CashEntryType = original.type === 'IN' ? 'OUT' : 'IN';
    const notes = `Reversal of entry ${originalEntryId}: ${reason}`;

    return client.cashEntry.create({
      data: {
        farmId,
        date: original.date,
        type: opposingType,
        amount: original.amount,
        source: original.source,
        referenceId: original.id,
        notes,
        isManual: false,
      },
    });
  }
}

export const cashbookService = new CashbookService();
