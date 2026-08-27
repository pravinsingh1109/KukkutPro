import { Router } from 'express';
import { z } from 'zod';
import { settingsService } from '../services/settings.service';
import { validateBody } from '../middleware/validate';

const router = Router();

const updateSettingsSchema = z.object({
  name: z.string().min(1, 'Farm name cannot be empty').optional(),
  petiSize: z
    .number()
    .int()
    .min(30, 'A Peti must contain at least 30 eggs (1 tray)')
    .max(420, 'A single Peti carton cannot exceed 420 eggs (14 trays). If you intended bird count, this setting is for egg box size.')
    .optional(),
});

const setupSchema = z.object({
  name: z.string().min(1, 'Farm name is required'),
  openingEggStock: z.number().int().min(0, 'Opening egg stock must be 0 or more'),
  openingCash: z.union([z.string(), z.number()]),
});

const addCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

router.get('/', async (req, res, next) => {
  try {
    const data = await settingsService.getSettings(req.farmId, req.isDemo);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/', validateBody(updateSettingsSchema), async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.body, req.farmId, req.isDemo);
    res.json({ data, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/setup', validateBody(setupSchema), async (req, res, next) => {
  try {
    const data = await settingsService.completeSetup(req.body, req.farmId, req.isDemo);
    res.json({ data, message: 'Farm setup completed successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const data = await settingsService.getCategories(req.farmId, req.isDemo);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/categories', validateBody(addCategorySchema), async (req, res, next) => {
  try {
    const data = await settingsService.addCategory(req.body.name, req.farmId, req.isDemo);
    res.status(201).json({ data, message: 'Category added successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const data = await settingsService.deleteCategory(req.params.id);
    res.json({ data, message: 'Category removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
