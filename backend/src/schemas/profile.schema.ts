import { z } from 'zod';

/**
 * UC-04: Completar perfil — agregar habilidad al perfil del Padawan
 */
export const addSkillSchema = z.object({
  habilidad_id: z.string().uuid('ID de habilidad inválido'),
  nivel: z.enum(['Basico', 'Intermedio', 'Avanzado'], {
    message: 'Nivel debe ser Basico, Intermedio o Avanzado',
  }),
});

/**
 * UC-05: Actualizar perfil profesional
 */
export const updateProfileSchema = z.object({
  nombres: z.string().min(2).max(100).optional(),
  apellidos: z.string().min(2).max(100).optional(),
  resumen_bio: z.string().max(1000).optional().nullable(),
  url_portafolio: z.string().url('URL inválida').max(255).optional().nullable(),
  // Campos exclusivos de Mentor
  especialidades: z.string().max(500).optional().nullable(),
  anios_experiencia: z.number().int().min(0).max(50).optional(),
  bio_profesional: z.string().max(2000).optional().nullable(),
});

export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
