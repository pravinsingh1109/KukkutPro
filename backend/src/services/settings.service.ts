import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export class SettingsService {
  async getOrCreateFarm(requestedFarmId?: string, isDemoRequested?: boolean) {
    if (requestedFarmId) {
      const found = await prisma.farm.findUnique({
        where: { id: requestedFarmId },
        include: {
          expenseCategories: { where: { isActive: true } },
        },
      });
      if (found) return found;
    }

    // Default: Real farm (isDemo: false)
    let farm = await prisma.farm.findFirst({
      where: { isDemo: false },
      include: {
        expenseCategories: {
          where: { isActive: true },
        },
      },
    });

    if (!farm) {
      farm = await prisma.farm.create({
        data: {
          name: 'My Poultry Farm',
          openingEggStock: 0,
          openingCash: new Prisma.Decimal(0),
          petiSize: 210,
          isSetupComplete: false,
          isDemo: false,
        },
        include: {
          expenseCategories: true,
        },
      });
    }

    return farm;
  }

  async getSettings(farmId?: string, isDemo?: boolean) {
    const farm = await this.getOrCreateFarm(farmId, isDemo);
    return {
      id: farm.id,
      name: farm.name,
      openingEggStock: farm.openingEggStock,
      openingCash: farm.openingCash.toFixed(2),
      petiSize: farm.petiSize,
      isSetupComplete: farm.isSetupComplete,
      isDemo: farm.isDemo,
      expenseCategories: farm.expenseCategories.map((c) => c.name),
    };
  }

  async updateSettings(data: { name?: string; petiSize?: number }, farmId?: string, isDemo?: boolean) {
    const farm = await this.getOrCreateFarm(farmId, isDemo);
    const updated = await prisma.farm.update({
      where: { id: farm.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.petiSize ? { petiSize: data.petiSize } : {}),
      },
      include: {
        expenseCategories: { where: { isActive: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      openingEggStock: updated.openingEggStock,
      openingCash: updated.openingCash.toFixed(2),
      petiSize: updated.petiSize,
      isSetupComplete: updated.isSetupComplete,
      isDemo: updated.isDemo,
      expenseCategories: updated.expenseCategories.map((c) => c.name),
    };
  }

  async completeSetup(
    data: { name: string; openingEggStock: number; openingCash: string | number },
    farmId?: string,
    isDemo?: boolean
  ) {
    const farm = await this.getOrCreateFarm(farmId, isDemo);
    const openingCashDecimal = new Prisma.Decimal(data.openingCash.toString());

    if (data.openingEggStock < 0) {
      throw new AppError('Opening egg stock cannot be negative', 400, 'VALIDATION_ERROR', 'openingEggStock');
    }

    if (openingCashDecimal.lt(0)) {
      throw new AppError('Opening cash balance cannot be negative', 400, 'VALIDATION_ERROR', 'openingCash');
    }

    const updated = await prisma.farm.update({
      where: { id: farm.id },
      data: {
        name: data.name,
        openingEggStock: data.openingEggStock,
        openingCash: openingCashDecimal,
        isSetupComplete: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      openingEggStock: updated.openingEggStock,
      openingCash: updated.openingCash.toFixed(2),
      isSetupComplete: updated.isSetupComplete,
      isDemo: updated.isDemo,
    };
  }

  async getCategories(farmId?: string, isDemo?: boolean) {
    const farm = await this.getOrCreateFarm(farmId, isDemo);
    return prisma.expenseCategory.findMany({
      where: { farmId: farm.id, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async addCategory(name: string, farmId?: string, isDemo?: boolean) {
    const farm = await this.getOrCreateFarm(farmId, isDemo);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError('Category name cannot be empty', 400, 'VALIDATION_ERROR', 'name');
    }

    const existing = await prisma.expenseCategory.findUnique({
      where: {
        farmId_name: {
          farmId: farm.id,
          name: trimmed,
        },
      },
    });

    if (existing) {
      if (!existing.isActive) {
        return prisma.expenseCategory.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      throw new AppError('Category already exists', 409, 'DUPLICATE_ENTRY');
    }

    return prisma.expenseCategory.create({
      data: {
        farmId: farm.id,
        name: trimmed,
        isSystem: false,
        isActive: true,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    if (category.isSystem) {
      throw new AppError('Cannot delete system category', 400, 'VALIDATION_ERROR');
    }

    return prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllFarms() {
    const farms = await prisma.farm.findMany({
      orderBy: [{ isDemo: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            productions: true,
            sales: true,
            customers: true,
          },
        },
      },
    });

    return farms.map((f) => ({
      id: f.id,
      name: f.name,
      petiSize: f.petiSize,
      openingEggStock: f.openingEggStock,
      openingCash: f.openingCash.toFixed(2),
      isSetupComplete: f.isSetupComplete,
      isDemo: f.isDemo,
      createdAt: f.createdAt,
      productionCount: f._count.productions,
      saleCount: f._count.sales,
      customerCount: f._count.customers,
    }));
  }

  async createFarm(data: {
    name: string;
    petiSize?: number;
    openingEggStock?: number;
    openingCash?: string | number;
  }) {
    const trimmed = data.name?.trim();
    if (!trimmed) {
      throw new AppError('Farm name cannot be empty', 400, 'VALIDATION_ERROR', 'name');
    }

    const petiSize = data.petiSize || 210;
    const openingEggStock = data.openingEggStock || 0;
    const openingCash = new Prisma.Decimal((data.openingCash || '0').toString());

    const defaultCategories = [
      'Feed (Makaa/Daana)',
      'Medicine & Vaccines',
      'Electricity & Light',
      'Bedding (Bhoosa)',
      'Transport & Delivery',
      'Equipment & Maintenance',
      'Labour Daily Wages',
      'Miscellaneous',
    ];

    const farm = await prisma.farm.create({
      data: {
        name: trimmed,
        petiSize,
        openingEggStock,
        openingCash,
        isSetupComplete: true,
        isDemo: false,
        expenseCategories: {
          create: defaultCategories.map((name) => ({
            name,
            isSystem: true,
            isActive: true,
          })),
        },
      },
      include: {
        expenseCategories: true,
      },
    });

    return {
      id: farm.id,
      name: farm.name,
      petiSize: farm.petiSize,
      openingEggStock: farm.openingEggStock,
      openingCash: farm.openingCash.toFixed(2),
      isSetupComplete: farm.isSetupComplete,
      isDemo: farm.isDemo,
    };
  }
}

export const settingsService = new SettingsService();
