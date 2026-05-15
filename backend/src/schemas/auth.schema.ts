import { z } from 'zod';

export const registerSchema = z.object({
  nombres: z.string().min(2, 'Nombres debe tener al menos 2 caracteres').max(100),
  apellidos: z.string().min(2, 'Apellidos debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(150),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
  rol: z.enum(['Padawan', 'Jedi'], { message: 'Rol debe ser Padawan o Jedi' }),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  contrasena: z.string().min(1, 'Contraseña requerida'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
