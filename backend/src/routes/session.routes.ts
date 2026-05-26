import { Router } from 'express';
import { createSession, listSessions, updateSession, deleteSession, getMySessions } from '../controllers/session.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { createSessionSchema, updateSessionSchema, matchingIdParamSchema, sessionIdParamSchema } from '../schemas/session.schema';

const router = Router();

// My sessions (convenience route)
router.get('/sessions/my-sessions', authMiddleware, getMySessions);

// CRUD on matchings/:matchingId/sessions
router.post('/matchings/:matchingId/sessions', authMiddleware, validate(matchingIdParamSchema, 'params'), validate(createSessionSchema), createSession);
router.get('/matchings/:matchingId/sessions', authMiddleware, validate(matchingIdParamSchema, 'params'), listSessions);

// Operations on specific sessions
router.put('/sessions/:sesionId', authMiddleware, validate(sessionIdParamSchema, 'params'), validate(updateSessionSchema), updateSession);
router.delete('/sessions/:sesionId', authMiddleware, validate(sessionIdParamSchema, 'params'), deleteSession);

export default router;
