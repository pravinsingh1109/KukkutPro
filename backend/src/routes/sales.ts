import { Router } from 'express';
import { z } from 'zod';
import { salesService } from '../services/sales.service';
import { validateBody } from '../middleware/validate';
import { SaleStatus } from '@prisma/client';

const router = Router();

const createSaleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  customerId: z.string().min(1, 'Customer is required'),
  eggsQty: z.number().int().positive('Eggs quantity must be greater than zero'),
  pricePerEgg: z.union([z.string(), z.number()]),
  amountReceived: z.union([z.string(), z.number()]).optional().default(0),
  notes: z.string().optional().default(''),
});

const voidSaleSchema = z.object({
  reason: z.string().min(1, 'Reason for voiding the sale is required'),
});

router.post('/', validateBody(createSaleSchema), async (req, res, next) => {
  try {
    const data = await salesService.createSale(req.body, req.farmId);
    res.status(201).json({ data, message: 'Sale recorded successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const status = req.query.status as SaleStatus | undefined;

    const data = await salesService.getSales({ customerId, from, to, status }, req.farmId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await salesService.getSaleById(req.params.id, req.farmId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/void', validateBody(voidSaleSchema), async (req, res, next) => {
  try {
    const data = await salesService.voidSale(req.params.id, req.body.reason, req.farmId);
    res.json({ data, message: 'Sale voided successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
