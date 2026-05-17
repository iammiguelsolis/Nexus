import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { LoadingSpinner, EmptyState } from '../components/ui';
import api from '../services/api';

interface Matching {
  matching_id: string;
  score_afinidad: number;
  fecha_asignacion: string;
  estado: string;
  // Padawan ve estos campos
  mentor_nombres?: string;
  mentor_apellidos?: string;
  especialidades?: string;
  anios_experiencia?: number;
  calificacion_promedio?: number;
  mentor_usuario_id?: string;
  // Jedi ve estos campos
  padawan_nombres?: string;
  padawan_apellidos?: string;
  resumen_bio?: string;
  score_empleabilidad?: number;
  padawan_usuario_id?: string;
}

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Pendiente: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)', label: 'Pendiente' },
  Activo: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)', label: 'Activo' },
  Completado: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)', label: 'Completado' },
  Cancelado: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', label: 'Cancelado' },
};

const MatchingPage = () => {
  const { user } = useAuth();
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  const loadMatchings = () => {
    api.get('/matchings/me')
      .then((res) => setMatchings(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMatchings(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/matchings/generate');
      loadMatchings();
    } catch { /* handled */ }
    finally { setGenerating(false); }
  };

  const handleRespond = async (matchingId: string, accion: 'aceptar' | 'rechazar') => {
    setResponding(matchingId);
    try {
      await api.patch(`/matchings/${matchingId}/respond`, { accion });
      loadMatchings();
    } catch { /* handled */ }
    finally { setResponding(null); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const isPadawan = user?.rol === 'Padawan';
  const hasActive = matchings.some((m) => ['Pendiente', 'Activo'].includes(m.estado));

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            {isPadawan ? 'Mi Mentor' : 'Mis Padawans'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isPadawan ? 'Conexiones de mentoría asignadas por el sistema.' : 'Aprendices asignados por el algoritmo de matching.'}
          </p>
        </div>
        {isPadawan && !hasActive && (
          <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm flex items-center gap-2">
            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🤖'}
            {generating ? 'Buscando...' : 'Buscar mentor'}
          </button>
        )}
      </div>

      {matchings.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={isPadawan ? '🔗' : '📭'}
            title={isPadawan ? 'Aún no tienes mentor asignado' : 'Sin aprendices asignados'}
            description={isPadawan ? 'Solicita un matching para que el sistema te conecte con el mentor ideal.' : 'Los padawans serán asignados por el algoritmo cuando soliciten mentoría.'}
            action={isPadawan ? (
              <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
                {generating ? 'Buscando...' : '🤖 Buscar mentor'}
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {matchings.map((m) => {
            const style = ESTADO_STYLES[m.estado] || ESTADO_STYLES.Pendiente;
            return (
              <div key={m.matching_id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                         style={{ backgroundColor: 'var(--color-primary-500)' }}>
                      {isPadawan
                        ? `${m.mentor_nombres?.charAt(0)}${m.mentor_apellidos?.charAt(0)}`
                        : `${m.padawan_nombres?.charAt(0)}${m.padawan_apellidos?.charAt(0)}`}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {isPadawan ? `${m.mentor_nombres} ${m.mentor_apellidos}` : `${m.padawan_nombres} ${m.padawan_apellidos}`}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {isPadawan ? `${m.especialidades || 'Mentor Jedi'}` : `Score: ${m.score_empleabilidad || 0}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
                    {style.label}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-input)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Afinidad</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-primary-600)' }}>{(m.score_afinidad * 100).toFixed(0)}%</p>
                  </div>
                  {isPadawan && m.anios_experiencia !== undefined && (
                    <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-input)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Experiencia</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{m.anios_experiencia} años</p>
                    </div>
                  )}
                  {isPadawan && m.calificacion_promedio !== undefined && (
                    <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-input)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Calificación</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>⭐ {m.calificacion_promedio}</p>
                    </div>
                  )}
                  {!isPadawan && m.resumen_bio && (
                    <div className="p-2 rounded-lg col-span-2" style={{ backgroundColor: 'var(--surface-input)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bio</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{m.resumen_bio}</p>
                    </div>
                  )}
                </div>

                {/* Actions for Jedi on Pendiente matchings — UC-11 */}
                {!isPadawan && m.estado === 'Pendiente' && (
                  <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                    <button onClick={() => handleRespond(m.matching_id, 'aceptar')}
                            disabled={responding === m.matching_id}
                            className="btn-primary text-sm flex-1">
                      ✓ Aceptar
                    </button>
                    <button onClick={() => handleRespond(m.matching_id, 'rechazar')}
                            disabled={responding === m.matching_id}
                            className="btn-ghost text-sm flex-1"
                            style={{ color: 'var(--color-danger)' }}>
                      ✕ Rechazar
                    </button>
                  </div>
                )}

                {/* Link to profile */}
                {(m.mentor_usuario_id || m.padawan_usuario_id) && (
                  <Link to={`/profile/${isPadawan ? m.mentor_usuario_id : m.padawan_usuario_id}`}
                        className="text-xs mt-2 inline-block" style={{ color: 'var(--color-primary-500)' }}>
                    Ver perfil completo →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchingPage;
