import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { cashbookService } from './cashbook.service';
import { settingsService } from './settings.service';
import { AppError } from '../middleware/errorHandler';

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface RecordCustomerPaymentInput {
  date: string;
  amount: string | number;
  isAdvance?: boolean;
  notes?: string;
}

export class CustomerService {
  async createCustomer(input: CreateCustomerInput, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const name = input.name.trim();
    if (!name) {
      throw new AppError('Customer name is required', 400, 'VALIDATION_ERROR', 'name');
    }

    const customer = await prisma.customer.create({
      data: {
        farmId: farm.id,
        name,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        isActive: true,
      },
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      totalPurchases: '0.00',
      totalPaid: '0.00',
      outstanding: '0.00',
      lastTransactionDate: null,
    };
  }

  async getCustomers(options?: { hasDues?: boolean; search?: string }, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();

    const whereClause: Prisma.CustomerWhereInput = {
      farmId: farm.id,
      isActive: true,
    };

    if (options?.search) {
      const q = options.search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        sales: {
          where: { status: { not: 'VOIDED' } },
          select: {
            date: true,
            totalAmount: true,
            amountReceived: true,
            amountDue: true,
          },
        },
        payments: {
          select: {
            date: true,
            amount: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = customers.map((c) => {
      let totalPurchases = new Prisma.Decimal(0);
      let totalAmountDue = new Prisma.Decimal(0);
      let lastDate: Date | null = null;

      c.sales.forEach((s) => {
        totalPurchases = totalPurchases.plus(s.totalAmount);
        totalAmountDue = totalAmountDue.plus(s.amountDue);
        if (!lastDate || s.date > lastDate) lastDate = s.date;
      });

      let totalPayments = new Prisma.Decimal(0);
      c.payments.forEach((p) => {
        totalPayments = totalPayments.plus(p.amount);
        if (!lastDate || p.date > lastDate) lastDate = p.date;
      });

      // Outstanding balance is the sum of remaining amountDue on sales minus unapplied payments
      // Or in the simple model: amountDue is reduced when payments occur via FIFO
      const outstanding = totalAmountDue.toFixed(2);

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        notes: c.notes,
        totalPurchases: totalPurchases.toFixed(2),
        totalPaid: totalPayments.toFixed(2),
        outstanding,
        lastTransactionDate: lastDate ? (lastDate as Date).toISOString().split('T')[0] : null,
      };
    });

    // Filter by hasDues if requested
    let result = enriched;
    if (options?.hasDues) {
      result = enriched.filter((c) => parseFloat(c.outstanding) > 0);
    }

    // Sort by outstanding descending, then name ascending
    return result.sort((a, b) => {
      const diff = parseFloat(b.outstanding) - parseFloat(a.outstanding);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }

  async getCustomerById(id: string, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { date: 'desc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!customer || customer.farmId !== farm.id) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    let totalPurchases = new Prisma.Decimal(0);
    let totalDue = new Prisma.Decimal(0);
    let totalPaid = new Prisma.Decimal(0);

    customer.sales.forEach((s) => {
      if (s.status !== 'VOIDED') {
        totalPurchases = totalPurchases.plus(s.totalAmount);
        totalDue = totalDue.plus(s.amountDue);
      }
    });

    customer.payments.forEach((p) => {
      totalPaid = totalPaid.plus(p.amount);
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      totalPurchases: totalPurchases.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      outstanding: totalDue.toFixed(2),
      sales: customer.sales.map((s) => ({
        id: s.id,
        date: s.date.toISOString().split('T')[0],
        eggsQty: s.eggsQty,
        pricePerEgg: s.pricePerEgg.toFixed(4),
        totalAmount: s.totalAmount.toFixed(2),
        amountReceived: s.amountReceived.toFixed(2),
        amountDue: s.amountDue.toFixed(2),
        status: s.status,
        notes: s.notes,
        voidedAt: s.voidedAt?.toISOString() || null,
        voidReason: s.voidReason,
        createdAt: s.createdAt.toISOString(),
      })),
      payments: customer.payments.map((p) => ({
        id: p.id,
        date: p.date.toISOString().split('T')[0],
        amount: p.amount.toFixed(2),
        isAdvance: p.isAdvance,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  async recordPayment(customerId: string, input: RecordCustomerPaymentInput, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          where: { status: { in: ['PARTIAL', 'UNPAID'] } },
          orderBy: { date: 'asc' }, // FIFO: oldest sales first
        },
      },
    });

    if (!customer || customer.farmId !== farm.id) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    const paymentAmount = new Prisma.Decimal(input.amount.toString());
    if (paymentAmount.lte(0)) {
      throw new AppError('Payment amount must be greater than zero', 400, 'VALIDATION_ERROR', 'amount');
    }

    const totalDue = customer.sales.reduce(
      (acc, s) => acc.plus(s.amountDue),
      new Prisma.Decimal(0)
    );

    if (paymentAmount.gt(totalDue) && !input.isAdvance) {
      throw new AppError(
        `Payment of ₹${paymentAmount.toFixed(2)} exceeds outstanding balance of ₹${totalDue.toFixed(2)}. Mark as advance?`,
        400,
        'EXCEEDS_OUTSTANDING'
      );
    }

    const paymentDate = new Date(`${input.date}T00:00:00.000Z`);

    // Execute payment and FIFO deduction atomically
    return prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.create({
        data: {
          farmId: farm.id,
          customerId,
          date: paymentDate,
          amount: paymentAmount,
          isAdvance: input.isAdvance ?? false,
          notes: input.notes,
        },
      });

      // Post to Cash Book
      await cashbookService.postEntry(
        farm.id,
        {
          date: input.date,
          type: 'IN',
          amount: paymentAmount,
          source: 'CUSTOMER_PAYMENT',
          referenceId: payment.id,
          notes: `Payment from ${customer.name}${input.notes ? `: ${input.notes}` : ''}`,
        },
        tx
      );

      // FIFO allocation across unpaid/partial sales
      let remainingToApply = paymentAmount;
      for (const sale of customer.sales) {
        if (remainingToApply.lte(0)) break;

        if (remainingToApply.gte(sale.amountDue)) {
          remainingToApply = remainingToApply.minus(sale.amountDue);
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              amountDue: new Prisma.Decimal(0),
              status: 'PAID',
            },
          });
        } else {
          const newDue = sale.amountDue.minus(remainingToApply);
          remainingToApply = new Prisma.Decimal(0);
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              amountDue: newDue,
              status: 'PARTIAL',
            },
          });
        }
      }

      return {
        id: payment.id,
        customerId,
        date: input.date,
        amount: payment.amount.toFixed(2),
        isAdvance: payment.isAdvance,
        notes: payment.notes,
      };
    });
  }

  async updateCustomer(id: string, input: Partial<CreateCustomerInput>) {
    const farm = await settingsService.getOrCreateFarm();
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.farmId !== farm.id) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      },
    });
  }

  async deleteCustomer(id: string) {
    const farm = await settingsService.getOrCreateFarm();
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: { where: { status: { not: 'VOIDED' } } },
      },
    });

    if (!customer || customer.farmId !== farm.id) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    const totalDue = customer.sales.reduce((acc, s) => acc.plus(s.amountDue), new Prisma.Decimal(0));
    if (totalDue.gt(0)) {
      throw new AppError('Cannot delete customer with outstanding dues', 400, 'VALIDATION_ERROR');
    }

    return prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const customerService = new CustomerService();
