import { Router } from 'express';
import { inventoryService } from '../services/inventory.service';
import { settingsService } from '../services/settings.service';

const router = Router();

router.get('/stock', async (req, res, next) => {
  try {
    const farm = await settingsService.getOrCreateFarm();
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const data = await inventoryService.getStock(farm.id, dateStr);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const farm = await settingsService.getOrCreateFarm();
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const data = await inventoryService.getHistory(farm.id, from, to);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
