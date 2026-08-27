import { Router } from 'express';
import { z } from 'zod';
import { expenseService } from '../services/expense.service';
import { validateBody } from '../middleware/validate';

const router = Router();

const createExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().optional(),
  unitCost: z.union([z.string(), z.number()]).optional(),
  totalAmount: z.union([z.string(), z.number()]),
  notes: z.string().optional(),
});

router.post('/', validateBody(createExpenseSchema), async (req, res, next) => {
  try {
    const data = await expenseService.createExpense(req.body);
    res.status(201).json({ data, message: 'Expense recorded successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const category = req.query.category as string | undefined;

    const data = await expenseService.getExpenses({ from, to, category });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
