import { z } from 'zod';

export const createVacancySchema = z.object({
  empresa_id: z.string().uuid(),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().max(5000).optional(),
  salario_min: z.number().positive().optional(),
  salario_max: z.number().positive().optional(),
  modalidad: z.enum(['Presencial', 'Remoto', 'Hibrido']),
});

export const updateVacancySchema = z.object({
  titulo: z.string().min(3).max(200).optional(),
  descripcion: z.string().max(5000).optional(),
  salario_min: z.number().positive().optional(),
  salario_max: z.number().positive().optional(),
  modalidad: z.enum(['Presencial', 'Remoto', 'Hibrido']).optional(),
  activa: z.boolean().optional(),
});

export const vacancyIdParamSchema = z.object({
  vacancyId: z.string().uuid(),
});

export type CreateVacancyInput = z.infer<typeof createVacancySchema>;
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>;
