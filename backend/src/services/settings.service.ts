import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export class SettingsService {
  async getOrCreateFarm() {
    let farm = await prisma.farm.findFirst({
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
          openingCash: 0,
          petiSize: 210,
          isSetupComplete: false,
        },
        include: {
          expenseCategories: true,
        },
      });
    }

    return farm;
  }

  async getSettings() {
    const farm = await this.getOrCreateFarm();
    return {
      id: farm.id,
      name: farm.name,
      openingEggStock: farm.openingEggStock,
      openingCash: farm.openingCash.toFixed(2),
      petiSize: farm.petiSize,
      isSetupComplete: farm.isSetupComplete,
      expenseCategories: farm.expenseCategories.map((c) => c.name),
    };
  }

  async updateSettings(data: { name?: string; petiSize?: number }) {
    const farm = await this.getOrCreateFarm();
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
      expenseCategories: updated.expenseCategories.map((c) => c.name),
    };
  }

  async completeSetup(data: { name: string; openingEggStock: number; openingCash: string | number }) {
    const farm = await this.getOrCreateFarm();
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
    };
  }

  async getCategories() {
    const farm = await this.getOrCreateFarm();
    return prisma.expenseCategory.findMany({
      where: { farmId: farm.id, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async addCategory(name: string) {
    const farm = await this.getOrCreateFarm();
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
}

export const settingsService = new SettingsService();
