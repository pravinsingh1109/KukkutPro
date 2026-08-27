import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { cashbookService } from './cashbook.service';
import { settingsService } from './settings.service';
import { AppError } from '../middleware/errorHandler';

export interface CreateExpenseInput {
  date: string;
  category: string;
  description: string;
  quantity?: number;
  unitCost?: string | number;
  totalAmount: string | number;
  notes?: string;
}

export class ExpenseService {
  async createExpense(input: CreateExpenseInput) {
    const farm = await settingsService.getOrCreateFarm();
    const category = input.category.trim();
    const description = input.description.trim();

    if (!category) {
      throw new AppError('Expense category is required', 400, 'VALIDATION_ERROR', 'category');
    }

    if (!description) {
      throw new AppError('Expense description is required', 400, 'VALIDATION_ERROR', 'description');
    }

    const totalAmount = new Prisma.Decimal(input.totalAmount.toString());
    if (totalAmount.lte(0)) {
      throw new AppError('Total amount must be greater than zero', 400, 'VALIDATION_ERROR', 'totalAmount');
    }

    const quantityDecimal = input.quantity !== undefined ? new Prisma.Decimal(input.quantity.toString()) : null;
    const unitCostDecimal = input.unitCost !== undefined ? new Prisma.Decimal(input.unitCost.toString()) : null;
    const expenseDate = new Date(`${input.date}T00:00:00.000Z`);

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          farmId: farm.id,
          date: expenseDate,
          category,
          description,
          quantity: quantityDecimal,
          unitCost: unitCostDecimal,
          totalAmount,
          notes: input.notes,
        },
      });

      // Post to Cash Book (Cash OUT)
      const cashEntry = await cashbookService.postEntry(
        farm.id,
        {
          date: input.date,
          type: 'OUT',
          amount: totalAmount,
          source: 'EXPENSE',
          referenceId: expense.id,
          notes: `${category}: ${description}${input.notes ? ` (${input.notes})` : ''}`,
        },
        tx
      );

      await tx.expense.update({
        where: { id: expense.id },
        data: { cashEntryId: cashEntry.id },
      });

      return {
        id: expense.id,
        date: input.date,
        category: expense.category,
        description: expense.description,
        quantity: expense.quantity ? expense.quantity.toNumber() : null,
        unitCost: expense.unitCost ? expense.unitCost.toFixed(2) : null,
        totalAmount: expense.totalAmount.toFixed(2),
        notes: expense.notes,
        createdAt: expense.createdAt.toISOString(),
      };
    });
  }

  async getExpenses(options?: { from?: string; to?: string; category?: string }) {
    const farm = await settingsService.getOrCreateFarm();
    const whereClause: Prisma.ExpenseWhereInput = {
      farmId: farm.id,
    };

    if (options?.category) {
      whereClause.category = options.category;
    }

    if (options?.from || options?.to) {
      whereClause.date = {};
      if (options.from) whereClause.date.gte = new Date(`${options.from}T00:00:00.000Z`);
      if (options.to) whereClause.date.lte = new Date(`${options.to}T23:59:59.999Z`);
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return expenses.map((e) => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      category: e.category,
      description: e.description,
      quantity: e.quantity ? e.quantity.toNumber() : null,
      unitCost: e.unitCost ? e.unitCost.toFixed(2) : null,
      totalAmount: e.totalAmount.toFixed(2),
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}

export const expenseService = new ExpenseService();
