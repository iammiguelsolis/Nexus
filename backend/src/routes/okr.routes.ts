import { Router } from 'express';
import { createOKR, listOKRs, updateOKR, deleteOKR, completeOKR, feedbackOKR } from '../controllers/okr.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { createOKRSchema, updateOKRSchema, completeOKRSchema, feedbackOKRSchema, sesionIdParamSchema, okrIdParamSchema } from '../schemas/okr.schema';

const router = Router();

// OKRs by session
router.post('/sessions/:sesionId/okrs', authMiddleware, validate(sesionIdParamSchema, 'params'), validate(createOKRSchema), createOKR);
router.get('/sessions/:sesionId/okrs', authMiddleware, validate(sesionIdParamSchema, 'params'), listOKRs);

// OKR operations
router.put('/okrs/:okrId', authMiddleware, validate(okrIdParamSchema, 'params'), validate(updateOKRSchema), updateOKR);
router.delete('/okrs/:okrId', authMiddleware, validate(okrIdParamSchema, 'params'), deleteOKR);
router.post('/okrs/:okrId/complete', authMiddleware, validate(okrIdParamSchema, 'params'), validate(completeOKRSchema), completeOKR);
router.post('/okrs/:okrId/feedback', authMiddleware, validate(okrIdParamSchema, 'params'), validate(feedbackOKRSchema), feedbackOKR);

export default router;

