import { Router } from 'express';
import { z } from 'zod';
import { productionService } from '../services/production.service';
import { validateBody } from '../middleware/validate';

const router = Router();

const createProductionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eggsProduced: z.number().int().min(0, 'Eggs produced must be 0 or more'),
  brokenEggs: z.number().int().min(0, 'Broken eggs must be 0 or more').default(0),
  notes: z.string().optional().default(''),
});

const updateProductionSchema = z.object({
  eggsProduced: z.number().int().min(0, 'Eggs produced must be 0 or more').optional(),
  brokenEggs: z.number().int().min(0, 'Broken eggs must be 0 or more').optional(),
  notes: z.string().optional(),
});

router.post('/', validateBody(createProductionSchema), async (req, res, next) => {
  try {
    const data = await productionService.createProduction(req.body, req.farmId);
    res.status(201).json({ data, message: 'Production recorded successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const data = await productionService.getProductionList(from, to, req.farmId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/:date', async (req, res, next) => {
  try {
    const data = await productionService.getProductionByDate(req.params.date, req.farmId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateBody(updateProductionSchema), async (req, res, next) => {
  try {
    const data = await productionService.updateProduction(req.params.id, req.body, req.farmId);
    res.json({ data, message: 'Production updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
