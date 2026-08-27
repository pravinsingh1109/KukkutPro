import { Router } from 'express';
import { z } from 'zod';
import { labourService } from '../services/labour.service';
import { validateBody } from '../middleware/validate';
import { PaymentType, SalaryType } from '@prisma/client';

const router = Router();

const createLabourerSchema = z.object({
  name: z.string().min(1, 'Labourer name is required'),
  phone: z.string().optional(),
  role: z.string().optional(),
  salaryType: z.enum(['MONTHLY', 'DAILY', 'PER_TASK'] as const),
  salaryAmount: z.union([z.string(), z.number()]),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const labourPaymentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.union([z.string(), z.number()]),
  paymentType: z.enum(['SALARY', 'ADVANCE'] as const),
  notes: z.string().optional(),
});

router.post('/', validateBody(createLabourerSchema), async (req, res, next) => {
  try {
    const data = await labourService.createLabourer(req.body);
    res.status(201).json({ data, message: 'Labourer added successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const data = await labourService.getLabourers();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await labourService.getLabourerById(req.params.id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payments', validateBody(labourPaymentSchema), async (req, res, next) => {
  try {
    const data = await labourService.recordPayment(req.params.id, req.body);
    res.status(201).json({ data, message: 'Labour payment recorded' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await labourService.deleteLabourer(req.params.id);
    res.json({ message: 'Labourer deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
