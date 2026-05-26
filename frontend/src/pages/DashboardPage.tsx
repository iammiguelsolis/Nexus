import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { LoadingSpinner, ProgressBar } from '../components/ui';
import api from '../services/api';

interface DashboardData {
  score_empleabilidad: number;
  okrs_activos: { okr_id: string; descripcion: string; valor_meta: number; valor_actual: number; estado: string; fecha_limite: string }[];
  proximas_sesiones: { sesion_id: string; titulo: string; fecha_sesion: string; duracion_min: number; mentor_nombres: string; mentor_apellidos: string }[];
  stats: { okrs_completados: number; sesiones_realizadas: number; total_habilidades: number };
  onboarding: { evaluacion_completada: boolean; nivel_general: string | null; learning_path_generado: boolean; learning_path_titulo: string | null };
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
          ¡Bienvenido, {user?.nombres}!
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {user?.rol === 'Jedi' ? 'Mentor Jedi' : 'Padawan (Aprendiz)'}
        </p>
      </div>

      {/* Onboarding banner */}
      {data && !data.onboarding.evaluacion_completada && (
        <Link to="/onboarding" className="card p-5 mb-6 block transition-shadow hover:shadow-md"
              style={{ borderLeft: '4px solid var(--color-primary-500)' }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Completa tu evaluación diagnóstica</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Responde un test rápido para generar tu ruta de aprendizaje personalizada.</p>
            </div>
          </div>
        </Link>
      )}

      {data && data.onboarding.evaluacion_completada && !data.onboarding.learning_path_generado && (
        <Link to="/onboarding" className="card p-5 mb-6 block transition-shadow hover:shadow-md"
              style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Genera tu Learning Path</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tu evaluación está lista. Haz clic para generar tu ruta personalizada.</p>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Score', value: Number(data?.score_empleabilidad || 0).toFixed(0), icon: '⭐', desc: 'Empleabilidad' },
          { label: 'OKRs', value: String(data?.stats.okrs_completados || 0), icon: '✅', desc: 'Completados' },
          { label: 'Sesiones', value: String(data?.stats.sesiones_realizadas || 0), icon: '🎯', desc: 'Realizadas' },
          { label: 'Habilidades', value: String(data?.stats.total_habilidades || 0), icon: '💡', desc: 'Registradas' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OKRs activos */}
        <div className="card p-5">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>📈 OKRs Activos</h2>
          {data?.okrs_activos && data.okrs_activos.length > 0 ? (
            <div className="space-y-3">
              {data.okrs_activos.map((okr) => (
                <div key={okr.okr_id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{okr.descripcion}</p>
                  <ProgressBar value={okr.valor_actual} max={okr.valor_meta} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Sin OKRs activos</p>
          )}
        </div>

        {/* Próximas sesiones */}
        <div className="card p-5">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>📅 Próximas Sesiones</h2>
          {data?.proximas_sesiones && data.proximas_sesiones.length > 0 ? (
            <div className="space-y-3">
              {data.proximas_sesiones.map((s) => (
                <div key={s.sesion_id} className="p-3 rounded-lg flex items-center justify-between"
                     style={{ backgroundColor: 'var(--surface-input)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.titulo}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      con {s.mentor_nombres} {s.mentor_apellidos}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-primary-600)' }}>
                      {new Date(s.fecha_sesion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.duracion_min} min</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Sin sesiones programadas</p>
          )}
        </div>
      </div>

      {/* Learning Path preview */}
      {data?.onboarding.learning_path_generado && (
        <Link to="/onboarding" className="card p-5 mt-6 block transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺</span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.onboarding.learning_path_titulo}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nivel: {data.onboarding.nivel_general} · Ver ruta completa →</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
};

export default DashboardPage;
