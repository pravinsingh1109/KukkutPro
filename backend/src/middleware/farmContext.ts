import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { Farm } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      farmId: string;
      isDemo: boolean;
      farm: Farm;
    }
  }
}

export const farmContext = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const isDemoHeader = req.headers['x-demo-mode'] === 'true';
    const requestedFarmId = req.headers['x-farm-id'] as string | undefined;

    const farm = await settingsService.getOrCreateFarm(requestedFarmId, isDemoHeader);
    req.farmId = farm.id;
    req.isDemo = farm.isDemo;
    req.farm = farm;

    next();
  } catch (error) {
    next(error);
  }
};
