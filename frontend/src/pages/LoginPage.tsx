import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  contrasena: z.string().min(1, 'Contraseña requerida'),
});
type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      await login(data.email, data.contrasena);
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
      {/* Background effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-nexus-700/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-success-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-nexus shadow-xl shadow-nexus-700/30 mb-4">
            <span className="text-3xl font-bold text-white font-display">N</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display">NEXUS</h1>
          <p className="text-dark-400 mt-1">Transformación del Talento</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-600/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-danger-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Contraseña</label>
              <input
                {...register('contrasena')}
                type="password"
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.contrasena && <p className="text-danger-400 text-xs mt-1">{errors.contrasena.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-nexus-400 hover:text-nexus-300 font-medium transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <p className="text-center text-dark-500 text-xs mt-6">
          NEXUS · ODS 4, ODS 8, ODS 17 · UNMSM
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
