import { Router } from 'express';
import { detectarRiesgoAbandono, listarRiesgosAbandono } from '../controllers/ia.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// UC-25: Padawan ve su propio riesgo
router.get('/ia/riesgo-abandono', authMiddleware, detectarRiesgoAbandono);

// UC-25: Admin/Jedi ve todos los padawans en riesgo
router.get('/ia/riesgo-abandono/all', authMiddleware, requireRole('Admin', 'Jedi'), listarRiesgosAbandono);

export default router;
