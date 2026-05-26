import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { AxiosError } from 'axios';

const registerSchema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['Padawan', 'Jedi']),
});
type RegisterForm = z.infer<typeof registerSchema>;

const ROL_OPTIONS = [
  { value: 'Padawan' as const, label: 'Padawan', subtitle: 'Aprendiz', icon: '🎓' },
  { value: 'Jedi' as const, label: 'Mentor Jedi', subtitle: 'Guía profesional', icon: '🧙‍♂️' },
];

const RegisterPage = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { rol: 'Padawan' },
  });

  const selectedRol = watch('rol');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      await authRegister(data);
      navigate('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      setError(axiosErr.response?.data?.error || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ backgroundColor: 'var(--surface-page)' }}>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
               style={{ backgroundColor: 'var(--color-primary-500)' }}>
            <span className="text-2xl font-bold text-white font-display">N</span>
          </div>
          <h1 className="text-3xl font-bold font-display"
              style={{ color: 'var(--text-primary)' }}>
            Únete a NEXUS
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Comienza tu transformación profesional
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Crear Cuenta
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm animate-fade-in"
                 style={{
                   backgroundColor: 'var(--color-danger-light)',
                   color: 'var(--color-danger-dark)',
                   border: '1px solid var(--color-danger)',
                 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium mb-2"
                     style={{ color: 'var(--text-secondary)' }}>
                ¿Cuál es tu rol?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROL_OPTIONS.map((rol) => (
                  <label
                    key={rol.value}
                    className="flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all duration-200"
                    style={{
                      backgroundColor: selectedRol === rol.value
                        ? 'var(--color-primary-50)'
                        : 'var(--surface-input)',
                      border: `2px solid ${selectedRol === rol.value
                        ? 'var(--color-primary-400)'
                        : 'var(--border-light)'}`,
                      color: selectedRol === rol.value
                        ? 'var(--color-primary-700)'
                        : 'var(--text-secondary)',
                    }}
                    id={`role-${rol.value.toLowerCase()}`}
                  >
                    <input type="radio" {...register('rol')} value={rol.value} className="sr-only" />
                    <span className="text-2xl mb-1">{rol.icon}</span>
                    <span className="font-semibold text-sm">{rol.label}</span>
                    <span className="text-xs mt-0.5 opacity-70">{rol.subtitle}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--text-secondary)' }}>
                  Nombres
                </label>
                <input {...register('nombres')}
                       className="input-field"
                       placeholder="María"
                       id="register-nombres" />
                {errors.nombres && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.nombres.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5"
                       style={{ color: 'var(--text-secondary)' }}>
                  Apellidos
                </label>
                <input {...register('apellidos')}
                       className="input-field"
                       placeholder="García"
                       id="register-apellidos" />
                {errors.apellidos && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.apellidos.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input {...register('email')}
                     type="email"
                     className="input-field"
                     placeholder="tu@email.com"
                     id="register-email" />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <input {...register('contrasena')}
                     type="password"
                     className="input-field"
                     placeholder="Mínimo 8 caracteres"
                     id="register-password" />
              {errors.contrasena && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.contrasena.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              id="register-submit"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--color-primary-500)' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
