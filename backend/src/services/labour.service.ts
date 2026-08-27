import { prisma } from '../lib/prisma';
import { PaymentType, Prisma, SalaryType } from '@prisma/client';
import { cashbookService } from './cashbook.service';
import { settingsService } from './settings.service';
import { AppError } from '../middleware/errorHandler';

export interface CreateLabourerInput {
  name: string;
  phone?: string;
  role?: string;
  salaryType: SalaryType;
  salaryAmount: string | number;
  joiningDate: string;
}

export interface RecordLabourPaymentInput {
  date: string;
  amount: string | number;
  paymentType: PaymentType;
  notes?: string;
}

export class LabourService {
  /**
   * Helper to compute accrued salary based on salary type and elapsed time.
   */
  private computeAccruedSalary(
    salaryType: SalaryType,
    salaryAmount: Prisma.Decimal,
    joiningDate: Date,
    asOfDate: Date = new Date()
  ): Prisma.Decimal {
    if (salaryType !== 'MONTHLY') {
      return salaryAmount; // For daily/per-task, initialized or configured per log
    }

    const joinYear = joiningDate.getFullYear();
    const joinMonth = joiningDate.getMonth();
    const currentYear = asOfDate.getFullYear();
    const currentMonth = asOfDate.getMonth();

    const monthsDiff = (currentYear - joinYear) * 12 + (currentMonth - joinMonth) + 1;
    const months = Math.max(1, monthsDiff);

    return salaryAmount.mul(months);
  }

  async createLabourer(input: CreateLabourerInput, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const name = input.name.trim();
    if (!name) {
      throw new AppError('Labourer name is required', 400, 'VALIDATION_ERROR', 'name');
    }

    const salaryAmount = new Prisma.Decimal(input.salaryAmount.toString());
    if (salaryAmount.lte(0)) {
      throw new AppError('Salary amount must be positive', 400, 'VALIDATION_ERROR', 'salaryAmount');
    }

    const joiningDate = input.joiningDate ? new Date(`${input.joiningDate}T00:00:00.000Z`) : new Date();

    const labourer = await prisma.labourer.create({
      data: {
        farmId: farm.id,
        name,
        phone: input.phone?.trim() || null,
        role: input.role?.trim() || null,
        salaryType: input.salaryType,
        salaryAmount,
        joiningDate,
        isActive: true,
      },
    });

    return {
      id: labourer.id,
      name: labourer.name,
      phone: labourer.phone,
      role: labourer.role,
      salaryType: labourer.salaryType,
      salaryAmount: labourer.salaryAmount.toFixed(2),
      joiningDate: labourer.joiningDate.toISOString().split('T')[0],
      outstanding: '0.00',
      advanceBalance: '0.00',
    };
  }

  async getLabourers(farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const labourers = await prisma.labourer.findMany({
      where: { farmId: farm.id, isActive: true },
      include: { payments: true },
      orderBy: { name: 'asc' },
    });

    const now = new Date();

    return labourers.map((l) => {
      const accrued = this.computeAccruedSalary(l.salaryType, l.salaryAmount, l.joiningDate, now);

      let totalSalaryPaid = new Prisma.Decimal(0);
      let advanceBalance = new Prisma.Decimal(0);

      l.payments.forEach((p) => {
        if (p.paymentType === 'SALARY') {
          totalSalaryPaid = totalSalaryPaid.plus(p.amount);
        } else if (p.paymentType === 'ADVANCE') {
          advanceBalance = advanceBalance.plus(p.amount);
        }
      });

      const totalPaidAll = totalSalaryPaid.plus(advanceBalance);
      const remainingDue = accrued.minus(totalSalaryPaid);
      const outstanding = remainingDue.gt(0) ? remainingDue : new Prisma.Decimal(0);

      return {
        id: l.id,
        name: l.name,
        phone: l.phone,
        role: l.role,
        salaryType: l.salaryType,
        salaryAmount: l.salaryAmount.toFixed(2),
        joiningDate: l.joiningDate.toISOString().split('T')[0],
        totalAccrued: accrued.toFixed(2),
        totalPaid: totalPaidAll.toFixed(2),
        outstanding: outstanding.toFixed(2),
        advanceBalance: advanceBalance.toFixed(2),
      };
    });
  }

  async getLabourerById(id: string, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const labourer = await prisma.labourer.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!labourer || labourer.farmId !== farm.id) {
      throw new AppError('Labourer not found', 404, 'NOT_FOUND');
    }

    const accrued = this.computeAccruedSalary(labourer.salaryType, labourer.salaryAmount, labourer.joiningDate);
    let totalSalaryPaid = new Prisma.Decimal(0);
    let advanceBalance = new Prisma.Decimal(0);

    labourer.payments.forEach((p) => {
      if (p.paymentType === 'SALARY') {
        totalSalaryPaid = totalSalaryPaid.plus(p.amount);
      } else {
        advanceBalance = advanceBalance.plus(p.amount);
      }
    });

    const outstanding = accrued.minus(totalSalaryPaid);

    return {
      id: labourer.id,
      name: labourer.name,
      phone: labourer.phone,
      role: labourer.role,
      salaryType: labourer.salaryType,
      salaryAmount: labourer.salaryAmount.toFixed(2),
      joiningDate: labourer.joiningDate.toISOString().split('T')[0],
      totalAccrued: accrued.toFixed(2),
      totalPaid: totalSalaryPaid.plus(advanceBalance).toFixed(2),
      outstanding: (outstanding.gt(0) ? outstanding : new Prisma.Decimal(0)).toFixed(2),
      advanceBalance: advanceBalance.toFixed(2),
      payments: labourer.payments.map((p) => ({
        id: p.id,
        date: p.date.toISOString().split('T')[0],
        amount: p.amount.toFixed(2),
        paymentType: p.paymentType,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  async recordPayment(id: string, input: RecordLabourPaymentInput, farmId?: string) {
    const farm = farmId
      ? await settingsService.getOrCreateFarm(farmId)
      : await settingsService.getOrCreateFarm();
    const labourer = await prisma.labourer.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!labourer || labourer.farmId !== farm.id) {
      throw new AppError('Labourer not found', 404, 'NOT_FOUND');
    }

    const amount = new Prisma.Decimal(input.amount.toString());
    if (amount.lte(0)) {
      throw new AppError('Payment amount must be greater than zero', 400, 'VALIDATION_ERROR', 'amount');
    }

    // Validation for SALARY type
    if (input.paymentType === 'SALARY') {
      const accrued = this.computeAccruedSalary(labourer.salaryType, labourer.salaryAmount, labourer.joiningDate);
      const totalSalaryPaid = labourer.payments
        .filter((p) => p.paymentType === 'SALARY')
        .reduce((acc, p) => acc.plus(p.amount), new Prisma.Decimal(0));
      const outstandingSalary = accrued.minus(totalSalaryPaid);

      if (amount.gt(outstandingSalary)) {
        throw new AppError(
          `Salary outstanding is only ₹${outstandingSalary.toFixed(2)}. To pay more, select Advance.`,
          400,
          'VALIDATION_ERROR',
          'amount'
        );
      }
    }

    const paymentDate = new Date(`${input.date}T00:00:00.000Z`);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.labourPayment.create({
        data: {
          farmId: farm.id,
          labourerId: id,
          date: paymentDate,
          amount,
          paymentType: input.paymentType,
          notes: input.notes,
        },
      });

      // Post to Cash Book
      const cashEntry = await cashbookService.postEntry(
        farm.id,
        {
          date: input.date,
          type: 'OUT',
          amount,
          source: 'LABOUR',
          referenceId: payment.id,
          notes: `${input.paymentType === 'ADVANCE' ? 'Advance' : 'Salary'} paid to ${labourer.name}${input.notes ? `: ${input.notes}` : ''}`,
        },
        tx
      );

      await tx.labourPayment.update({
        where: { id: payment.id },
        data: { cashEntryId: cashEntry.id },
      });

      return {
        id: payment.id,
        labourerId: id,
        date: input.date,
        amount: payment.amount.toFixed(2),
        paymentType: payment.paymentType,
        notes: payment.notes,
      };
    });
  }

  async deleteLabourer(id: string) {
    const farm = await settingsService.getOrCreateFarm();
    const labourer = await prisma.labourer.findUnique({ where: { id } });

    if (!labourer || labourer.farmId !== farm.id) {
      throw new AppError('Labourer not found', 404, 'NOT_FOUND');
    }

    return prisma.labourer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const labourService = new LabourService();
