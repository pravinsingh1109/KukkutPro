import { PrismaClient } from '@prisma/client';
import { DEFAULT_EXPENSE_CATEGORIES } from '../src/lib/constants';
import { demoService } from '../src/services/demo.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Ensure default real farm exists
  let farm = await prisma.farm.findFirst({ where: { isDemo: false } });
  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        name: 'My Poultry Farm',
        openingEggStock: 0,
        openingCash: 0,
        petiSize: 210,
        isSetupComplete: false,
        isDemo: false,
      },
    });
    console.log(`Created default real farm: ${farm.name} (ID: ${farm.id})`);
  } else {
    console.log(`Using existing real farm: ${farm.name} (ID: ${farm.id})`);
  }

  // Seed default expense categories for real farm
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

  // 2. Seed realistic isolated Demo Farm dataset
  console.log('\n🐓 Seeding dedicated Demo Farm dataset...');
  const demoResult = await demoService.resetDemoData();
  console.log(`✅ Demo Farm seeded successfully (Farm ID: ${demoResult.farmId})`);

  console.log('\n🎉 Complete database seed finished!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
