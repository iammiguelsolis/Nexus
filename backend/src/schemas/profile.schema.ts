import { z } from 'zod';

/**
 * Esquema para agregar una habilidad al perfil
 */
export const addSkillSchema = z.object({
  habilidad_id: z.string().uuid('habilidad_id debe ser un UUID válido'),
  nivel: z.enum(['Basico', 'Intermedio', 'Avanzado'], {
    errorMap: () => ({
      message: 'nivel debe ser uno de: Basico, Intermedio, Avanzado',
    }),
  }),
  fecha_adquisicion: z.string().date().optional(),
});

/**
 * Esquema para validar profileId en parámetros
 */
export const profileIdParamSchema = z.object({
  profileId: z.string().uuid('profileId debe ser un UUID válido'),
});

/**
 * Esquema para validar skillId en parámetros
 */
export const skillIdParamSchema = z.object({
  skillId: z.string().uuid('skillId debe ser un UUID válido'),
});
