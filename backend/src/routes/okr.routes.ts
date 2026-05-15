import { Router } from 'express';
import { createOKR, listOKRs, updateOKR, deleteOKR, completeOKR } from '../controllers/okr.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { createOKRSchema, updateOKRSchema, completeOKRSchema, sesionIdParamSchema, okrIdParamSchema } from '../schemas/okr.schema';

const router = Router();

router.use(authMiddleware);

// OKRs by session
router.post('/sessions/:sesionId/okrs', validate(sesionIdParamSchema, 'params'), validate(createOKRSchema), createOKR);
router.get('/sessions/:sesionId/okrs', validate(sesionIdParamSchema, 'params'), listOKRs);

// OKR operations
router.put('/okrs/:okrId', validate(okrIdParamSchema, 'params'), validate(updateOKRSchema), updateOKR);
router.delete('/okrs/:okrId', validate(okrIdParamSchema, 'params'), deleteOKR);
router.patch('/okrs/:okrId/complete', validate(okrIdParamSchema, 'params'), validate(completeOKRSchema), completeOKR);

export default router;
