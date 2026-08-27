import { Router, Request, Response, NextFunction } from 'express';
import { demoService } from '../services/demo.service';
import { prisma } from '../lib/prisma';

export const demoRouter = Router();

// GET /api/demo/status
demoRouter.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const demoFarm = await prisma.farm.findFirst({
      where: { isDemo: true },
      select: {
        id: true,
        name: true,
        isSetupComplete: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const realFarm = await prisma.farm.findFirst({
      where: { isDemo: false },
      select: {
        id: true,
        name: true,
        isSetupComplete: true,
      },
    });

    res.json({
      success: true,
      isDemoMode: req.isDemo,
      activeFarmId: req.farmId,
      demoFarmExists: !!demoFarm,
      demoFarm,
      realFarm,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/demo/reset - Resets ONLY the dedicated demo farm
demoRouter.post('/reset', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await demoService.resetDemoData();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/demo/ensure - Ensures demo farm exists and seeds if empty
demoRouter.post('/ensure', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const demoFarm = await demoService.getOrCreateDemoFarm();
    const productionCount = await prisma.eggProduction.count({
      where: { farmId: demoFarm.id },
    });

    if (productionCount === 0) {
      await demoService.resetDemoData();
    }

    res.json({
      success: true,
      farmId: demoFarm.id,
      message: 'Demo farm ready',
    });
  } catch (error) {
    next(error);
  }
});
