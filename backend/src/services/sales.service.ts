import { prisma } from '../lib/prisma';
import { Prisma, SaleStatus } from '@prisma/client';
import { inventoryService } from './inventory.service';
import { cashbookService } from './cashbook.service';
import { settingsService } from './settings.service';
import { PETI_SIZE } from '../lib/constants';
import { AppError } from '../middleware/errorHandler';

export interface CreateSaleInput {
  date: string;
  customerId: string;
  eggsQty: number;
  pricePerEgg: string | number;
  amountReceived?: string | number;
  notes?: string;
}

export class SalesService {
  async createSale(input: CreateSaleInput) {
    const farm = await settingsService.getOrCreateFarm();
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer || customer.farmId !== farm.id) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND', 'customerId');
    }

    if (input.eggsQty <= 0) {
      throw new AppError('Quantity must be greater than zero', 400, 'VALIDATION_ERROR', 'eggsQty');
    }

    // Validate available stock for that date
    const stock = await inventoryService.getStock(farm.id, input.date);
    if (input.eggsQty > stock.closingStock) {
      throw new AppError(
        `Only ${stock.closingStock} eggs available on ${input.date}. Please reduce quantity.`,
        400,
        'INSUFFICIENT_STOCK',
        'eggsQty'
      );
    }

    const pricePerEggDecimal = new Prisma.Decimal(input.pricePerEgg.toString());
    if (pricePerEggDecimal.lte(0)) {
      throw new AppError('Price per egg must be greater than zero', 400, 'VALIDATION_ERROR', 'pricePerEgg');
    }

    const totalAmount = new Prisma.Decimal(input.eggsQty).mul(pricePerEggDecimal).toDecimalPlaces(2);
    const amountReceived = new Prisma.Decimal(input.amountReceived ? input.amountReceived.toString() : '0');

    if (amountReceived.gt(totalAmount)) {
      throw new AppError(
        `Amount received cannot exceed total amount of ₹${totalAmount.toFixed(2)}`,
        400,
        'VALIDATION_ERROR',
        'amountReceived'
      );
    }

    if (amountReceived.lt(0)) {
      throw new AppError('Amount received cannot be negative', 400, 'VALIDATION_ERROR', 'amountReceived');
    }

    const amountDue = totalAmount.minus(amountReceived);
    let status: SaleStatus = 'UNPAID';
    if (amountDue.isZero()) {
      status = 'PAID';
    } else if (amountReceived.gt(0)) {
      status = 'PARTIAL';
    }

    const saleDate = new Date(`${input.date}T00:00:00.000Z`);

    // Execute atomic sale creation with inventory and cash book cascades
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          farmId: farm.id,
          date: saleDate,
          customerId: input.customerId,
          eggsQty: input.eggsQty,
          pricePerEgg: pricePerEggDecimal,
          totalAmount,
          amountReceived,
          amountDue,
          status,
          notes: input.notes,
        },
      });

      // If cash was received, post to Cash Book
      if (amountReceived.gt(0)) {
        const cashEntry = await cashbookService.postEntry(
          farm.id,
          {
            date: input.date,
            type: 'IN',
            amount: amountReceived,
            source: 'SALE',
            referenceId: sale.id,
            notes: `Egg sale to ${customer.name} (${input.eggsQty} eggs)`,
          },
          tx
        );

        await tx.sale.update({
          where: { id: sale.id },
          data: { cashEntryId: cashEntry.id },
        });
      }

      return sale;
    });

    // Recalculate and verify stock chain
    await inventoryService.recalculate(farm.id, input.date);

    return {
      id: result.id,
      date: input.date,
      customerId: customer.id,
      customerName: customer.name,
      eggsQty: result.eggsQty,
      petiQty: Math.floor(result.eggsQty / (farm.petiSize || PETI_SIZE)),
      pricePerEgg: result.pricePerEgg.toFixed(4),
      totalAmount: result.totalAmount.toFixed(2),
      amountReceived: result.amountReceived.toFixed(2),
      amountDue: result.amountDue.toFixed(2),
      status: result.status,
      notes: result.notes,
      createdAt: result.createdAt.toISOString(),
    };
  }

  async getSales(options?: { customerId?: string; from?: string; to?: string; status?: SaleStatus }) {
    const farm = await settingsService.getOrCreateFarm();

    const whereClause: Prisma.SaleWhereInput = {
      farmId: farm.id,
    };

    if (options?.customerId) whereClause.customerId = options.customerId;
    if (options?.status) whereClause.status = options.status;

    if (options?.from || options?.to) {
      whereClause.date = {};
      if (options.from) whereClause.date.gte = new Date(`${options.from}T00:00:00.000Z`);
      if (options.to) whereClause.date.lte = new Date(`${options.to}T23:59:59.999Z`);
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return sales.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      customerId: s.customerId,
      customerName: s.customer.name,
      eggsQty: s.eggsQty,
      petiQty: Math.floor(s.eggsQty / (farm.petiSize || PETI_SIZE)),
      pricePerEgg: s.pricePerEgg.toFixed(4),
      totalAmount: s.totalAmount.toFixed(2),
      amountReceived: s.amountReceived.toFixed(2),
      amountDue: s.amountDue.toFixed(2),
      status: s.status,
      notes: s.notes,
      voidedAt: s.voidedAt?.toISOString() || null,
      voidReason: s.voidReason,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getSaleById(id: string) {
    const farm = await settingsService.getOrCreateFarm();
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!sale || sale.farmId !== farm.id) {
      throw new AppError('Sale record not found', 404, 'NOT_FOUND');
    }

    return {
      id: sale.id,
      date: sale.date.toISOString().split('T')[0],
      customerId: sale.customerId,
      customerName: sale.customer.name,
      customerPhone: sale.customer.phone,
      eggsQty: sale.eggsQty,
      petiQty: Math.floor(sale.eggsQty / (farm.petiSize || PETI_SIZE)),
      pricePerEgg: sale.pricePerEgg.toFixed(4),
      totalAmount: sale.totalAmount.toFixed(2),
      amountReceived: sale.amountReceived.toFixed(2),
      amountDue: sale.amountDue.toFixed(2),
      status: sale.status,
      notes: sale.notes,
      voidedAt: sale.voidedAt?.toISOString() || null,
      voidReason: sale.voidReason,
      createdAt: sale.createdAt.toISOString(),
    };
  }

  async voidSale(id: string, reason: string) {
    const farm = await settingsService.getOrCreateFarm();
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!sale || sale.farmId !== farm.id) {
      throw new AppError('Sale record not found', 404, 'NOT_FOUND');
    }

    if (sale.status === 'VOIDED') {
      throw new AppError('Sale is already voided', 400, 'RECORD_VOIDED');
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new AppError('Reason is required to void a sale', 400, 'VALIDATION_ERROR', 'reason');
    }

    const dateStr = sale.date.toISOString().split('T')[0];

    // Atomically void the sale, reverse cash entry if cash was collected
    await prisma.$transaction(async (tx) => {
      if (sale.amountReceived.gt(0) && sale.cashEntryId) {
        await cashbookService.postReversal(
          farm.id,
          sale.cashEntryId,
          `Sale #${sale.id} voided: ${trimmedReason}`,
          tx
        );
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidReason: trimmedReason,
        },
      });
    });

    // Recalculate stock chain (eggs returned to available stock)
    await inventoryService.recalculate(farm.id, dateStr);

    return this.getSaleById(id);
  }
}

export const salesService = new SalesService();
