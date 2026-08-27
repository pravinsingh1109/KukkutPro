import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';

import settingsRouter from './routes/settings';
import productionRouter from './routes/production';
import inventoryRouter from './routes/inventory';
import salesRouter from './routes/sales';
import customersRouter from './routes/customers';
import cashbookRouter from './routes/cashbook';
import labourRouter from './routes/labour';
import expensesRouter from './routes/expenses';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json());

// Rate limiter for write endpoints (100 req/min)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  message: {
    error: 'Too many requests. Please wait before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use('/api', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { farmContext } from './middleware/farmContext';
import { demoRouter } from './routes/demo';

// Register farm context middleware (resolves real farm vs demo farm per request)
app.use(farmContext);

// Register API domain routes
app.use('/api/demo', demoRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/production', productionRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sales', salesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/cashbook', cashbookRouter);
app.use('/api/labour', labourRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/dashboard', dashboardRouter);

// Centralized error handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 KukkutPro Backend running on http://localhost:${PORT}`);
  });
}

export default app;
