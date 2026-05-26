import { Router } from 'express';
import { getMyProfile, updateMyProfile, listSkills, addSkill, removeSkill, getUserProfile } from '../controllers/profile.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { updateProfileSchema, addSkillSchema } from '../schemas/profile.schema';

const router = Router();

// UC-04 / UC-05: Mi perfil
router.get('/profile/me', authMiddleware, getMyProfile);
router.put('/profile/me', authMiddleware, validate(updateProfileSchema), updateMyProfile);

// UC-04: Habilidades
router.get('/profile/skills', authMiddleware, listSkills);
router.post('/profile/skills', authMiddleware, validate(addSkillSchema), addSkill);
router.delete('/profile/skills/:habilidadId', authMiddleware, removeSkill);

// UC-06: Ver perfil público de otro usuario
router.get('/profile/user/:userId', authMiddleware, getUserProfile);

export default router;
