import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// UC-09: Dashboard de progreso
router.get('/dashboard', authMiddleware, getDashboard);

export default router;
