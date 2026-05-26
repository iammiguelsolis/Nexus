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
            NEXUS
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Transformación del Talento
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Iniciar Sesión
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
            <div>
              <label className="block text-sm font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                autoComplete="email"
                id="login-email"
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <input
                {...register('contrasena')}
                type="password"
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
                id="login-password"
              />
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
              id="login-submit"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--color-primary-500)' }}>
              Regístrate aquí
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          NEXUS · ODS 4, ODS 8, ODS 17 · UNMSM
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
