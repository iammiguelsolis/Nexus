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
      setError(axiosErr.response?.data?.error || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-nexus-700/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-success-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-nexus shadow-xl shadow-nexus-700/30 mb-4">
            <span className="text-3xl font-bold text-white font-display">N</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display">Únete a NEXUS</h1>
          <p className="text-dark-400 mt-1">Comienza tu transformación profesional</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Crear Cuenta</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-600/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">¿Cuál es tu rol?</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Padawan', 'Jedi'] as const).map((rol) => (
                  <label
                    key={rol}
                    className={`flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border
                      ${selectedRol === rol
                        ? 'bg-nexus-700/20 border-nexus-500/50 text-nexus-300'
                        : 'bg-dark-800 border-dark-600/30 text-dark-400 hover:border-dark-500'
                      }`}
                  >
                    <input type="radio" {...register('rol')} value={rol} className="sr-only" />
                    <span className="text-2xl mb-1">{rol === 'Padawan' ? '🎓' : '🧙‍♂️'}</span>
                    <span className="font-semibold text-sm">{rol}</span>
                    <span className="text-xs mt-0.5">{rol === 'Padawan' ? 'Aprendiz' : 'Mentor'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Nombres</label>
                <input {...register('nombres')} className="input-field" placeholder="Carlos" />
                {errors.nombres && <p className="text-danger-400 text-xs mt-1">{errors.nombres.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Apellidos</label>
                <input {...register('apellidos')} className="input-field" placeholder="García" />
                {errors.apellidos && <p className="text-danger-400 text-xs mt-1">{errors.apellidos.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="tu@email.com" />
              {errors.email && <p className="text-danger-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Contraseña</label>
              <input {...register('contrasena')} type="password" className="input-field" placeholder="Mínimo 8 caracteres" />
              {errors.contrasena && <p className="text-danger-400 text-xs mt-1">{errors.contrasena.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-nexus-400 hover:text-nexus-300 font-medium transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
