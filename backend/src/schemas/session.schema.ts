import { z } from 'zod';

export const createSessionSchema = z.object({
  titulo: z.string().min(3, 'Título debe tener al menos 3 caracteres').max(200),
  fecha_sesion: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida'),
  duracion_min: z.number().int().min(15).max(480).default(60),
  notas: z.string().max(2000).optional(),
});

export const updateSessionSchema = z.object({
  titulo: z.string().min(3).max(200).optional(),
  fecha_sesion: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  duracion_min: z.number().int().min(15).max(480).optional(),
  estado: z.enum(['Programada', 'Realizada', 'Cancelada']).optional(),
  url_grabacion: z.string().url().max(255).optional(),
  notas: z.string().max(2000).optional(),
});

export const matchingIdParamSchema = z.object({
  matchingId: z.string().uuid('ID de matching inválido'),
});

export const sessionIdParamSchema = z.object({
  sesionId: z.string().uuid('ID de sesión inválido'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
