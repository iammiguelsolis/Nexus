import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/notifications', authMiddleware, getNotifications);
router.get('/notifications/unread-count', authMiddleware, getUnreadCount);
router.patch('/notifications/:notificationId/read', authMiddleware, markAsRead);
router.patch('/notifications/read-all', authMiddleware, markAllAsRead);

export default router;
