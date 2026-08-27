import { Router } from 'express';
import { z } from 'zod';
import { cashbookService } from '../services/cashbook.service';
import { settingsService } from '../services/settings.service';
import { validateBody } from '../middleware/validate';
import { CashEntryType } from '@prisma/client';

const router = Router();

const manualCashEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['IN', 'OUT'] as const),
  amount: z.union([z.string(), z.number()]),
  notes: z.string().min(1, 'Notes are required for manual cash entries'),
});

router.get('/', async (req, res, next) => {
  try {
    const farm = await settingsService.getOrCreateFarm();
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const data = await cashbookService.getEntries(farm.id, from, to);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/balance', async (req, res, next) => {
  try {
    const farm = await settingsService.getOrCreateFarm();
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const closingBalance = await cashbookService.getBalance(farm.id, dateStr);
    res.json({ data: { date: dateStr, closingBalance } });
  } catch (error) {
    next(error);
  }
});

router.post('/manual', validateBody(manualCashEntrySchema), async (req, res, next) => {
  try {
    const farm = await settingsService.getOrCreateFarm();
    const entry = await cashbookService.postEntry(farm.id, {
      date: req.body.date,
      type: req.body.type as CashEntryType,
      amount: req.body.amount,
      source: 'MANUAL',
      notes: req.body.notes,
      isManual: true,
    });

    res.status(201).json({
      data: {
        id: entry.id,
        date: entry.date.toISOString().split('T')[0],
        type: entry.type,
        amount: entry.amount.toFixed(2),
        source: entry.source,
        notes: entry.notes,
        isManual: entry.isManual,
      },
      message: 'Manual cash entry recorded',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
