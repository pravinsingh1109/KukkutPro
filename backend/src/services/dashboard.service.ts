import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { inventoryService } from './inventory.service';
import { cashbookService } from './cashbook.service';
import { customerService } from './customer.service';
import { labourService } from './labour.service';
import { settingsService } from './settings.service';

export class DashboardService {
  async getTodayDashboard(dateStr?: string) {
    const farm = await settingsService.getOrCreateFarm();
    const todayStr = dateStr || new Date().toISOString().split('T')[0];
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Execute parallel data aggregation
    const [
      stockData,
      todayProduction,
      todaySales,
      todayCashBook,
      todayExpenses,
      customersWithDues,
      labourers,
    ] = await Promise.all([
      // 1. Inventory stock
      inventoryService.getStock(farm.id, todayStr),

      // 2. Production
      prisma.eggProduction.findUnique({
        where: {
          farmId_date: {
            farmId: farm.id,
            date: todayDate,
          },
        },
      }),

      // 3. Sales
      prisma.sale.findMany({
        where: {
          farmId: farm.id,
          date: todayDate,
          status: { not: 'VOIDED' },
        },
      }),

      // 4. Cash Book for today
      cashbookService.getEntries(farm.id, todayStr, todayStr),

      // 5. Expenses for today
      prisma.expense.aggregate({
        where: {
          farmId: farm.id,
          date: todayDate,
        },
        _sum: { totalAmount: true },
      }),

      // 6. Customers with dues
      customerService.getCustomers({ hasDues: true }),

      // 7. Labour dues
      labourService.getLabourers(),
    ]);

    // Aggregate sales metrics
    let eggsSold = 0;
    let cashCollected = new Prisma.Decimal(0);
    let creditSales = new Prisma.Decimal(0);

    todaySales.forEach((s) => {
      eggsSold += s.eggsQty;
      cashCollected = cashCollected.plus(s.amountReceived);
      creditSales = creditSales.plus(s.amountDue);
    });

    // Customer dues total and top customers
    let totalCustomerDues = new Prisma.Decimal(0);
    customersWithDues.forEach((c) => {
      totalCustomerDues = totalCustomerDues.plus(c.outstanding);
    });

    const topCustomers = customersWithDues.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.name,
      outstanding: c.outstanding,
    }));

    // Labour dues total
    let totalLabourDues = new Prisma.Decimal(0);
    labourers.forEach((l) => {
      totalLabourDues = totalLabourDues.plus(l.outstanding);
    });

    const totalExpensesAmount = todayExpenses._sum.totalAmount || new Prisma.Decimal(0);

    return {
      date: todayStr,
      production: {
        eggsProduced: todayProduction?.eggsProduced || 0,
        brokenEggs: todayProduction?.brokenEggs || 0,
      },
      inventory: {
        closingStock: stockData.closingStock,
        display: stockData.display,
      },
      sales: {
        eggsSold,
        cashCollected: cashCollected.toFixed(2),
        creditSales: creditSales.toFixed(2),
        numberOfSales: todaySales.length,
      },
      cash: {
        openingBalance: todayCashBook.openingBalance,
        closingBalance: todayCashBook.closingBalance,
        totalIn: todayCashBook.summary.totalIn,
        totalOut: todayCashBook.summary.totalOut,
      },
      expenses: {
        total: totalExpensesAmount.toFixed(2),
      },
      outstanding: {
        totalCustomerDues: totalCustomerDues.toFixed(2),
        totalLabourDues: totalLabourDues.toFixed(2),
        topCustomers,
      },
    };
  }
}

export const dashboardService = new DashboardService();
