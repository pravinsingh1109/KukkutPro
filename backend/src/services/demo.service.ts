import { prisma } from '../lib/prisma';
import { Prisma, SaleStatus } from '@prisma/client';
import { DEFAULT_EXPENSE_CATEGORIES, PETI_SIZE } from '../lib/constants';
import { inventoryService } from './inventory.service';

export class DemoService {
  /**
   * Returns the dedicated demo farm, creating one if it doesn't exist.
   */
  async getOrCreateDemoFarm() {
    let demoFarm = await prisma.farm.findFirst({
      where: { isDemo: true },
      include: { expenseCategories: true },
    });

    if (!demoFarm) {
      demoFarm = await prisma.farm.create({
        data: {
          name: 'KukkutPro Demo Farm (Ramesh Poultry)',
          openingEggStock: 600,
          openingCash: new Prisma.Decimal(12000.0),
          petiSize: 210,
          isSetupComplete: true,
          isDemo: true,
        },
        include: { expenseCategories: true },
      });
    }

    return demoFarm;
  }

  /**
   * Resets all demo data under the dedicated Demo Farm.
   * Completely isolated: only records where farmId === demoFarm.id are modified/deleted.
   * Real farm data is 100% untouched.
   */
  async resetDemoData() {
    const demoFarm = await this.getOrCreateDemoFarm();

    // 1. Delete all existing records strictly belonging to the Demo Farm
    await prisma.$transaction([
      prisma.cashEntry.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.labourPayment.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.labourer.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.customerPayment.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.sale.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.customer.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.expense.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.eggProduction.deleteMany({ where: { farmId: demoFarm.id } }),
      prisma.expenseCategory.deleteMany({ where: { farmId: demoFarm.id } }),
    ]);

    // 2. Reset baseline farm properties
    await prisma.farm.update({
      where: { id: demoFarm.id },
      data: {
        name: 'KukkutPro Demo Farm (Ramesh Poultry)',
        openingEggStock: 600,
        openingCash: new Prisma.Decimal(12000.0),
        petiSize: 210,
        isSetupComplete: true,
        isDemo: true,
      },
    });

    // 3. Seed Default Expense Categories for Demo Farm
    for (const catName of DEFAULT_EXPENSE_CATEGORIES) {
      await prisma.expenseCategory.create({
        data: {
          farmId: demoFarm.id,
          name: catName,
          isSystem: true,
          isActive: true,
        },
      });
    }

    // 4. Seed 5 Realistic Customers
    const customerRajesh = await prisma.customer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Rajesh Kumar (Mandi Wholesaler)',
        phone: '9876543210',
        address: 'Wholesale Mandi Gate 2, Gorakhpur',
        notes: 'Buys in 15-20 Peti lots. Reliable buyer with credit terms.',
        isActive: true,
      },
    });

    const customerSunil = await prisma.customer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Sunil Gupta (Station Egg Depot)',
        phone: '9812345678',
        address: 'Shop 14, Station Road',
        notes: 'Regular retail supply depot. Partial cash, partial credit.',
        isActive: true,
      },
    });

    const customerAmit = await prisma.customer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Amit Verma (Golden Bakery)',
        phone: '9765432109',
        address: 'Civil Lines Central Market',
        notes: 'Takes 5-8 Peti weekly for bakery ovens.',
        isActive: true,
      },
    });

    const customerPooja = await prisma.customer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Pooja Provision Store',
        phone: '9988776655',
        address: 'Village Chauraha',
        notes: 'Local village kirana store. Cash on delivery.',
        isActive: true,
      },
    });

    const customerVikram = await prisma.customer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Vikram Highway Dhaba',
        phone: '9876501234',
        address: 'NH-28 Bypass Mile 12',
        notes: 'Daily dhaba egg curry consumption. Weekly payment settlement.',
        isActive: true,
      },
    });

    // 5. Generate Dates for the past 7 days (including today)
    const today = new Date();
    const getDateString = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const d6 = getDateString(6);
    const d5 = getDateString(5);
    const d4 = getDateString(4);
    const d3 = getDateString(3);
    const d2 = getDateString(2);
    const d1 = getDateString(1);
    const d0 = getDateString(0); // today

    // 6. Seed Daily Egg Production Records (7 days)
    const productionsData = [
      { date: d6, produced: 4620, broken: 25, notes: 'Normal collection. Temperature fine.' },
      { date: d5, produced: 4710, broken: 30, notes: 'Good lay rate. High morning turnout.' },
      { date: d4, produced: 4680, broken: 20, notes: 'Feed ratio adjusted slightly.' },
      { date: d3, produced: 4830, broken: 35, notes: 'Peak collection day.' },
      { date: d2, produced: 4740, broken: 25, notes: 'Routine shed maintenance.' },
      { date: d1, produced: 4800, broken: 28, notes: 'Vaccine booster administered yesterday.' },
      { date: d0, produced: 4770, broken: 22, notes: 'Today morning egg collection complete.' },
    ];

    for (const p of productionsData) {
      await prisma.eggProduction.create({
        data: {
          farmId: demoFarm.id,
          date: new Date(`${p.date}T00:00:00.000Z`),
          eggsProduced: p.produced,
          brokenEggs: p.broken,
          notes: p.notes,
        },
      });
    }

    // 7. Helper to create Sale + CashEntry atomically
    const recordDemoSale = async (params: {
      date: string;
      customer: any;
      petiCount: number;
      pricePerPeti: number;
      amountReceived: number;
      notes?: string;
    }) => {
      const eggsQty = params.petiCount * PETI_SIZE;
      const pricePerEgg = new Prisma.Decimal((params.pricePerPeti / PETI_SIZE).toFixed(4));
      const totalAmount = new Prisma.Decimal((eggsQty * parseFloat(pricePerEgg.toString())).toFixed(2));
      const received = new Prisma.Decimal(params.amountReceived.toFixed(2));
      const due = totalAmount.minus(received);

      let status: SaleStatus = 'UNPAID';
      if (due.isZero()) status = 'PAID';
      else if (received.gt(0)) status = 'PARTIAL';

      const sale = await prisma.sale.create({
        data: {
          farmId: demoFarm.id,
          date: new Date(`${params.date}T00:00:00.000Z`),
          customerId: params.customer.id,
          eggsQty,
          pricePerEgg,
          totalAmount,
          amountReceived: received,
          amountDue: due,
          status,
          notes: params.notes,
        },
      });

      if (received.gt(0)) {
        const cash = await prisma.cashEntry.create({
          data: {
            farmId: demoFarm.id,
            date: new Date(`${params.date}T00:00:00.000Z`),
            type: 'IN',
            amount: received,
            source: 'SALE',
            referenceId: sale.id,
            notes: `Egg sale payment from ${params.customer.name} (${params.petiCount} Peti)`,
            isManual: false,
          },
        });

        await prisma.sale.update({
          where: { id: sale.id },
          data: { cashEntryId: cash.id },
        });
      }

      return sale;
    };

    // Helper for customer payment
    const recordDemoCustomerPayment = async (
      customer: any,
      date: string,
      amount: number,
      notes: string
    ) => {
      const decimalAmount = new Prisma.Decimal(amount.toFixed(2));
      const payment = await prisma.customerPayment.create({
        data: {
          farmId: demoFarm.id,
          customerId: customer.id,
          date: new Date(`${date}T00:00:00.000Z`),
          amount: decimalAmount,
          isAdvance: false,
          notes,
        },
      });

      await prisma.cashEntry.create({
        data: {
          farmId: demoFarm.id,
          date: new Date(`${date}T00:00:00.000Z`),
          type: 'IN',
          amount: decimalAmount,
          source: 'CUSTOMER_PAYMENT',
          referenceId: payment.id,
          notes: `Due payment received from ${customer.name}: ${notes}`,
          isManual: false,
        },
      });

      // Reduce oldest unpaid sales for that customer
      const unpaidSales = await prisma.sale.findMany({
        where: { farmId: demoFarm.id, customerId: customer.id, status: { in: ['PARTIAL', 'UNPAID'] } },
        orderBy: { date: 'asc' },
      });

      let remaining = decimalAmount;
      for (const s of unpaidSales) {
        if (remaining.lte(0)) break;
        if (remaining.gte(s.amountDue)) {
          remaining = remaining.minus(s.amountDue);
          await prisma.sale.update({
            where: { id: s.id },
            data: { amountDue: new Prisma.Decimal(0), status: 'PAID' },
          });
        } else {
          const newDue = s.amountDue.minus(remaining);
          remaining = new Prisma.Decimal(0);
          await prisma.sale.update({
            where: { id: s.id },
            data: { amountDue: newDue, status: 'PARTIAL' },
          });
        }
      }
    };

    // 8. Seed Sales across the 7 days
    // Day -6: Rajesh buys 18 Peti (₹5,130), pays ₹3,000; Sunil buys 4 Peti (₹1,140) full cash
    await recordDemoSale({ date: d6, customer: customerRajesh, petiCount: 18, pricePerPeti: 285, amountReceived: 3000, notes: '18 Peti dispatched in tempo' });
    await recordDemoSale({ date: d6, customer: customerSunil, petiCount: 4, pricePerPeti: 285, amountReceived: 1140, notes: 'Daily depot pickup' });

    // Day -5: Amit Bakery 6 Peti (₹1,710) full cash; Pooja 2 Peti (₹570) full cash
    await recordDemoSale({ date: d5, customer: customerAmit, petiCount: 6, pricePerPeti: 285, amountReceived: 1710, notes: 'Bakery oven weekly lot' });
    await recordDemoSale({ date: d5, customer: customerPooja, petiCount: 2, pricePerPeti: 285, amountReceived: 570, notes: 'Kirana shop collection' });

    // Day -4: Rajesh buys 19 Peti (₹5,320), pays ₹2,500; Vikram Dhaba 3 Peti (₹840) credit
    await recordDemoSale({ date: d4, customer: customerRajesh, petiCount: 19, pricePerPeti: 280, amountReceived: 2500, notes: 'Bulk order dispatch' });
    await recordDemoSale({ date: d4, customer: customerVikram, petiCount: 3, pricePerPeti: 280, amountReceived: 0, notes: 'Dhaba supply on weekly credit' });

    // Day -3: Sunil buys 8 Peti (₹2,240), pays ₹1,240; Pooja 2 Peti (₹560) cash
    await recordDemoSale({ date: d3, customer: customerSunil, petiCount: 8, pricePerPeti: 280, amountReceived: 1240, notes: 'Weekend stock buffer' });
    await recordDemoSale({ date: d3, customer: customerPooja, petiCount: 2, pricePerPeti: 280, amountReceived: 560, notes: 'Retail trays' });

    // Day -2: Rajesh makes due payment of ₹3,000 cash!
    await recordDemoCustomerPayment(customerRajesh, d2, 3000, 'Partial settlement of Mandi sales');
    // Day -2: Amit Bakery 5 Peti (₹1,425) cash
    await recordDemoSale({ date: d2, customer: customerAmit, petiCount: 5, pricePerPeti: 285, amountReceived: 1425, notes: 'Mid-week replenishment' });

    // Day -1: Rajesh buys 16 Peti (₹4,560), pays ₹2,000; Vikram Dhaba 4 Peti (₹1,140) pays ₹500
    await recordDemoSale({ date: d1, customer: customerRajesh, petiCount: 16, pricePerPeti: 285, amountReceived: 2000, notes: 'Morning loading' });
    await recordDemoSale({ date: d1, customer: customerVikram, petiCount: 4, pricePerPeti: 285, amountReceived: 500, notes: 'Partial cash handover' });

    // Today (Day 0): Sunil buys 6 Peti (₹1,710), pays ₹1,000; Vikram Dhaba pays ₹640 past dues
    await recordDemoSale({ date: d0, customer: customerSunil, petiCount: 6, pricePerPeti: 285, amountReceived: 1000, notes: 'Today morning order' });
    await recordDemoCustomerPayment(customerVikram, d0, 640, 'Settlement for Day -4 Dhaba delivery');

    // 9. Seed Labourers and Payments
    const labourRamu = await prisma.labourer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Ramu (Egg Collector & Feeder)',
        phone: '9801122334',
        role: 'Head Flock Attendant',
        salaryType: 'MONTHLY',
        salaryAmount: new Prisma.Decimal(14000.0),
        joiningDate: new Date(new Date().setMonth(today.getMonth() - 3)),
        isActive: true,
      },
    });

    const labourShyam = await prisma.labourer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Shyam (Shed Care & Sanitation)',
        phone: '9805566778',
        role: 'Shed Maintenance & Water',
        salaryType: 'MONTHLY',
        salaryAmount: new Prisma.Decimal(12000.0),
        joiningDate: new Date(new Date().setMonth(today.getMonth() - 2)),
        isActive: true,
      },
    });

    const labourDinesh = await prisma.labourer.create({
      data: {
        farmId: demoFarm.id,
        name: 'Dinesh (Packing & Loading)',
        phone: '9809988776',
        role: 'Daily Loader',
        salaryType: 'DAILY',
        salaryAmount: new Prisma.Decimal(450.0),
        joiningDate: new Date(new Date().setMonth(today.getMonth() - 1)),
        isActive: true,
      },
    });

    // Labour Payments
    // Ramu salary disbursement on Day -4 (₹10,000) and advance on Day -1 (₹2,000)
    const payRamu1 = await prisma.labourPayment.create({
      data: {
        farmId: demoFarm.id,
        labourerId: labourRamu.id,
        date: new Date(`${d4}T00:00:00.000Z`),
        amount: new Prisma.Decimal(10000.0),
        paymentType: 'SALARY',
        notes: 'Monthly salary disbursement (cash)',
      },
    });
    await prisma.cashEntry.create({
      data: {
        farmId: demoFarm.id,
        date: new Date(`${d4}T00:00:00.000Z`),
        type: 'OUT',
        amount: new Prisma.Decimal(10000.0),
        source: 'LABOUR',
        referenceId: payRamu1.id,
        notes: 'Salary paid to Ramu (Flock Attendant)',
        isManual: false,
      },
    });

    const payRamu2 = await prisma.labourPayment.create({
      data: {
        farmId: demoFarm.id,
        labourerId: labourRamu.id,
        date: new Date(`${d1}T00:00:00.000Z`),
        amount: new Prisma.Decimal(2000.0),
        paymentType: 'ADVANCE',
        notes: 'Emergency festival advance',
      },
    });
    await prisma.cashEntry.create({
      data: {
        farmId: demoFarm.id,
        date: new Date(`${d1}T00:00:00.000Z`),
        type: 'OUT',
        amount: new Prisma.Decimal(2000.0),
        source: 'LABOUR',
        referenceId: payRamu2.id,
        notes: 'Advance cash paid to Ramu',
        isManual: false,
      },
    });

    // Shyam salary disbursement on Day -5 (₹10,000)
    const payShyam = await prisma.labourPayment.create({
      data: {
        farmId: demoFarm.id,
        labourerId: labourShyam.id,
        date: new Date(`${d5}T00:00:00.000Z`),
        amount: new Prisma.Decimal(10000.0),
        paymentType: 'SALARY',
        notes: 'Salary installment cash',
      },
    });
    await prisma.cashEntry.create({
      data: {
        farmId: demoFarm.id,
        date: new Date(`${d5}T00:00:00.000Z`),
        type: 'OUT',
        amount: new Prisma.Decimal(10000.0),
        source: 'LABOUR',
        referenceId: payShyam.id,
        notes: 'Salary paid to Shyam (Shed Maintenance)',
        isManual: false,
      },
    });

    // 10. Seed Farm Operating Expenses
    const expensesList = [
      { date: d6, cat: 'Feed', desc: 'Maaka (Maize) 20 Bags', qty: 20, unitCost: 350, total: 7000, notes: 'Delivered by Kisan Feed Mill' },
      { date: d5, cat: 'Packaging', desc: 'Egg Cartons & Paper Trays (300 sets)', qty: 300, unitCost: 5, total: 1500, notes: 'Packaging bundle for Mandi sales' },
      { date: d4, cat: 'Vaccines', desc: 'ND Lasota + IBD Booster Vaccines', qty: 4, unitCost: 320, total: 1280, notes: 'Purchased from Veterinary Pharmacy' },
      { date: d3, cat: 'Transport', desc: 'Tempo Diesel for market transport', qty: 15, unitCost: 95, total: 1425, notes: 'Delivery fuel refill' },
      { date: d2, cat: 'Supplements', desc: 'Liquid Calcium & Vitamin AD3E Tonic', qty: 2, unitCost: 450, total: 900, notes: 'Egg shell strength improvement' },
      { date: d1, cat: 'Electricity', desc: 'Shed Coolers & Tube-well Pump Bill', qty: 1, unitCost: 2450, total: 2450, notes: 'Paid at electricity counter' },
      { date: d0, cat: 'Feed', desc: 'Layer Concentrate Feed 10 Bags', qty: 10, unitCost: 420, total: 4200, notes: 'Today morning feed delivery' },
    ];

    for (const exp of expensesList) {
      const expEntry = await prisma.expense.create({
        data: {
          farmId: demoFarm.id,
          date: new Date(`${exp.date}T00:00:00.000Z`),
          category: exp.cat,
          description: exp.desc,
          quantity: new Prisma.Decimal(exp.qty),
          unitCost: new Prisma.Decimal(exp.unitCost),
          totalAmount: new Prisma.Decimal(exp.total),
          notes: exp.notes,
        },
      });

      await prisma.cashEntry.create({
        data: {
          farmId: demoFarm.id,
          date: new Date(`${exp.date}T00:00:00.000Z`),
          type: 'OUT',
          amount: new Prisma.Decimal(exp.total),
          source: 'EXPENSE',
          referenceId: expEntry.id,
          notes: `${exp.cat}: ${exp.desc}`,
          isManual: false,
        },
      });
    }

    // 11. Seed 1-2 Manual Cash Adjustments
    await prisma.cashEntry.create({
      data: {
        farmId: demoFarm.id,
        date: new Date(`${d2}T00:00:00.000Z`),
        type: 'IN',
        amount: new Prisma.Decimal(480.0),
        source: 'MANUAL',
        notes: 'Sold 32 empty gunny feed sacks @ ₹15/sack',
        isManual: true,
      },
    });

    await prisma.cashEntry.create({
      data: {
        farmId: demoFarm.id,
        date: new Date(`${d0}T00:00:00.000Z`),
        type: 'OUT',
        amount: new Prisma.Decimal(1500.0),
        source: 'MANUAL',
        notes: 'Owner personal withdrawal for household grocery',
        isManual: true,
      },
    });

    // 12. Run recalculations to verify mathematical integrity
    await inventoryService.recalculate(demoFarm.id, d6);

    return {
      success: true,
      message: 'Demo farm data reset and reseeded with realistic operational records successfully.',
      farmId: demoFarm.id,
    };
  }
}

export const demoService = new DemoService();
