import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getChatMessages, sendMessage, getUnreadCount } from '../controllers/chat.controller';

const router = Router();

router.get('/chat/:matchingId/messages', authMiddleware, getChatMessages);
router.post('/chat/:matchingId/messages', authMiddleware, sendMessage);
router.get('/chat/:matchingId/unread', authMiddleware, getUnreadCount);

export default router;
