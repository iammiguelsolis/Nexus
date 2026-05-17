import { Router } from 'express';
import { getMyMatchings, generateMatching, respondMatching } from '../controllers/matching.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// UC-10: Ver mis matchings + generar matching
router.get('/matchings/me', authMiddleware, getMyMatchings);
router.post('/matchings/generate', authMiddleware, generateMatching);

// UC-11: Aceptar o rechazar matching
router.patch('/matchings/:matchingId/respond', authMiddleware, respondMatching);

export default router;
