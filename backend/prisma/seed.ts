import { PrismaClient } from '@prisma/client';
import { DEFAULT_EXPENSE_CATEGORIES } from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Ensure default farm exists
  let farm = await prisma.farm.findFirst();
  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        name: 'My Poultry Farm',
        openingEggStock: 0,
        openingCash: 0,
        petiSize: 210,
        isSetupComplete: false,
      },
    });
    console.log(`Created default farm: ${farm.name} (ID: ${farm.id})`);
  } else {
    console.log(`Using existing farm: ${farm.name} (ID: ${farm.id})`);
  }

  // Seed default expense categories
  for (const categoryName of DEFAULT_EXPENSE_CATEGORIES) {
    const existing = await prisma.expenseCategory.findUnique({
      where: {
        farmId_name: {
          farmId: farm.id,
          name: categoryName,
        },
      },
    });

    if (!existing) {
      await prisma.expenseCategory.create({
        data: {
          farmId: farm.id,
          name: categoryName,
          isSystem: true,
          isActive: true,
        },
      });
      console.log(`  + Seeded expense category: ${categoryName}`);
    }
  }

  console.log('✅ Database seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
