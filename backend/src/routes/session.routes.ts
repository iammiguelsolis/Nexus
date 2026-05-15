import { Router } from 'express';
import { createSession, listSessions, updateSession, deleteSession, getMySessions } from '../controllers/session.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { createSessionSchema, updateSessionSchema, matchingIdParamSchema, sessionIdParamSchema } from '../schemas/session.schema';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

// My sessions (convenience route)
router.get('/sessions/my-sessions', getMySessions);

// CRUD on matchings/:matchingId/sessions
router.post('/matchings/:matchingId/sessions', validate(matchingIdParamSchema, 'params'), validate(createSessionSchema), createSession);
router.get('/matchings/:matchingId/sessions', validate(matchingIdParamSchema, 'params'), listSessions);

// Operations on specific sessions
router.put('/sessions/:sesionId', validate(sessionIdParamSchema, 'params'), validate(updateSessionSchema), updateSession);
router.delete('/sessions/:sesionId', validate(sessionIdParamSchema, 'params'), deleteSession);

export default router;
