import { Router } from 'express';
import { z } from 'zod';
import { customerService } from '../services/customer.service';
import { validateBody } from '../middleware/validate';

const router = Router();

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name cannot be empty').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.union([z.string(), z.number()]),
  isAdvance: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

router.post('/', validateBody(createCustomerSchema), async (req, res, next) => {
  try {
    const data = await customerService.createCustomer(req.body, req.farmId);
    res.status(201).json({ data, message: 'Customer created successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const hasDues = req.query.hasDues === 'true';
    const search = req.query.search as string | undefined;
    const data = await customerService.getCustomers({ hasDues, search }, req.farmId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await customerService.getCustomerById(req.params.id, req.farmId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateBody(updateCustomerSchema), async (req, res, next) => {
  try {
    const data = await customerService.updateCustomer(req.params.id, req.body);
    res.json({ data, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    res.json({ message: 'Customer deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payments', validateBody(paymentSchema), async (req, res, next) => {
  try {
    const data = await customerService.recordPayment(req.params.id, req.body, req.farmId);
    res.status(201).json({ data, message: 'Payment recorded successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
