import { Router } from 'express';
import { listVacancies, getVacancy, createVacancy, updateVacancy, applyToVacancy, getMyApplications } from '../controllers/vacancy.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { createVacancySchema, updateVacancySchema, vacancyIdParamSchema } from '../schemas/vacancy.schema';

const router = Router();

// Public routes
router.get('/', listVacancies);
router.get('/my-applications', authMiddleware, getMyApplications);
router.get('/:vacancyId', validate(vacancyIdParamSchema, 'params'), getVacancy);

// Padawan: apply to vacancy
router.post('/:vacancyId/apply', authMiddleware, validate(vacancyIdParamSchema, 'params'), applyToVacancy);

// Admin-only routes
router.post('/', authMiddleware, requireRole('Admin'), validate(createVacancySchema), createVacancy);
router.put('/:vacancyId', authMiddleware, requireRole('Admin'), validate(vacancyIdParamSchema, 'params'), validate(updateVacancySchema), updateVacancy);

export default router;
