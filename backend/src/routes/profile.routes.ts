import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addSkillSchema,
  profileIdParamSchema,
  skillIdParamSchema,
} from '../schemas/profile.schema';

export const profileRoutes = Router();

/**
 * GET /api/v1/habilidades
 * Obtener todas las habilidades disponibles (público)
 */
profileRoutes.get(
  '/habilidades',
  (req, res) => profileController.listSkills(req, res)
);

/**
 * POST /api/v1/profiles/:profileId/skills
 * Agregar una habilidad al perfil del aprendiz
 * Autenticación: JWT Bearer Token (Padawan)
 */
profileRoutes.post(
  '/:profileId/skills',
  authMiddleware,
  validate(profileIdParamSchema, 'params'),
  validate(addSkillSchema, 'body'),
  (req, res) => profileController.addSkillToProfile(req, res)
);

/**
 * GET /api/v1/profiles/:profileId/skills
 * Obtener todas las habilidades del perfil
 * Autenticación: JWT Bearer Token
 */
profileRoutes.get(
  '/:profileId/skills',
  authMiddleware,
  validate(profileIdParamSchema, 'params'),
  (req, res) => profileController.getProfileSkills(req, res)
);

/**
 * DELETE /api/v1/profiles/:profileId/skills/:skillId
 * Eliminar una habilidad del perfil
 * Autenticación: JWT Bearer Token (Padawan)
 */
profileRoutes.delete(
  '/:profileId/skills/:skillId',
  authMiddleware,
  validate(profileIdParamSchema, 'params'),
  validate(skillIdParamSchema, 'params'),
  (req, res) => profileController.removeSkillFromProfile(req, res)
);
