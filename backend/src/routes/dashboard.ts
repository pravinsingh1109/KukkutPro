import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service';

const router = Router();

router.get('/today', async (req, res, next) => {
  try {
    const date = req.query.date as string | undefined;
    const data = await dashboardService.getTodayDashboard(date);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
