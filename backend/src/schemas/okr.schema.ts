import { z } from 'zod';

export const createOKRSchema = z.object({
  descripcion: z.string().min(5).max(1000),
  indicador: z.string().max(500).optional(),
  valor_meta: z.number().positive(),
  fecha_limite: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida').optional(),
});

export const updateOKRSchema = z.object({
  descripcion: z.string().min(5).max(1000).optional(),
  indicador: z.string().max(500).optional(),
  valor_meta: z.number().positive().optional(),
  valor_actual: z.number().min(0).optional(),
  estado: z.enum(['Pendiente', 'EnProgreso', 'Completado', 'Cancelado']).optional(),
  fecha_limite: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida').optional(),
});

export const completeOKRSchema = z.object({
  valor_actual: z.number().min(0),
  nota_cierre: z.string().min(1).max(2000),
});

export const feedbackOKRSchema = z.object({
  accion: z.enum(['aprobar', 'revisar']),
  comentario: z.string().max(2000).optional(),
});

export const sesionIdParamSchema = z.object({
  sesionId: z.string().uuid(),
});

export const okrIdParamSchema = z.object({
  okrId: z.string().uuid(),
});

export type CreateOKRInput = z.infer<typeof createOKRSchema>;
export type UpdateOKRInput = z.infer<typeof updateOKRSchema>;
export type CompleteOKRInput = z.infer<typeof completeOKRSchema>;
export type FeedbackOKRInput = z.infer<typeof feedbackOKRSchema>;

