import { Router } from 'express';
import { getDiagnostic, submitDiagnostic, getLearningPath, generateLearningPath } from '../controllers/onboarding.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// UC-07: Evaluación diagnóstica
router.get('/onboarding/diagnostic', authMiddleware, getDiagnostic);
router.post('/onboarding/diagnostic', authMiddleware, submitDiagnostic);

// UC-08: Ruta de aprendizaje
router.get('/onboarding/learning-path', authMiddleware, getLearningPath);
router.post('/onboarding/learning-path', authMiddleware, generateLearningPath);

export default router;
