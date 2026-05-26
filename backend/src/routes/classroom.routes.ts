import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getClassroomFeed, createPost, deletePost, togglePin,
  addComment, deleteComment, addResource, getClassroomPeople
} from '../controllers/classroom.controller';

const router = Router();

router.get('/classroom/:matchingId/feed', authMiddleware, getClassroomFeed);
router.post('/classroom/:matchingId/posts', authMiddleware, createPost);
router.delete('/classroom/posts/:postId', authMiddleware, deletePost);
router.patch('/classroom/posts/:postId/pin', authMiddleware, togglePin);
router.post('/classroom/posts/:postId/comments', authMiddleware, addComment);
router.delete('/classroom/comments/:commentId', authMiddleware, deleteComment);
router.post('/classroom/posts/:postId/resources', authMiddleware, addResource);
router.get('/classroom/:matchingId/people', authMiddleware, getClassroomPeople);

export default router;
