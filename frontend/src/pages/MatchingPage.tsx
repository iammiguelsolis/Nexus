import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui';
import api from '../services/api';
import { Wand2, Link2, Bot, Check, Clock, Star, ArrowRight, Calendar, RefreshCw, Users, Inbox, X } from 'lucide-react';

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

  // ==================== VISTA PADAWAN ====================
  if (isPadawan) {
    const activeMatching = matchings.find((m) => m.estado === 'Activo');
    const pendingMatching = matchings.find((m) => m.estado === 'Pendiente');
    const currentMatching = activeMatching || pendingMatching;

    return (
      <div className="animate-fade-in max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Wand2 className="w-8 h-8 text-primary-500" /> Mi Mentor Jedi
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tu conexión de mentoría personalizada. El algoritmo te conecta con el mentor ideal.
          </p>
        </div>

        {!currentMatching && (
          <div className="card p-8 text-center mb-6">
            <Link2 className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Aún no tienes mentor asignado
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Solicita un matching para conectarte con el mentor ideal según tu perfil.
            </p>
            <button onClick={handleGenerate} disabled={generating} className="btn-primary inline-flex items-center gap-2">
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Buscando...
                </>
              ) : <><Bot className="w-4 h-4" /> Buscar mentor compatible</>}
            </button>
          </div>
        )}

        {currentMatching && (
          <div className="card p-6 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl"
                   style={{ backgroundColor: 'var(--color-primary-500)' }}>
                {currentMatching.mentor_nombres?.charAt(0)}{currentMatching.mentor_apellidos?.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {currentMatching.mentor_nombres} {currentMatching.mentor_apellidos}
                </h2>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {currentMatching.especialidades || 'Mentor Jedi certificado'}
                </p>
                <span className="text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1" 
                      style={{
                        backgroundColor: currentMatching.estado === 'Activo' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                        color: currentMatching.estado === 'Activo' ? 'var(--color-success-dark)' : 'var(--color-warning-dark)',
                      }}>
                  {currentMatching.estado === 'Activo' ? <><Check className="w-3.5 h-3.5" /> Mentoría Activa</> : <><Clock className="w-3.5 h-3.5" /> Pendiente</>}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-input)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Afinidad</p>
                <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-primary-600)' }}>
                  {(currentMatching.score_afinidad * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-input)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Experiencia</p>
                <p className="text-xl font-bold mt-1">{currentMatching.anios_experiencia}+ años</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--surface-input)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Rating</p>
                <p className="text-xl font-bold mt-1 flex items-center justify-center gap-1"><Star className="w-5 h-5 text-warning" /> {currentMatching.calificacion_promedio}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', marginBottom: '1.5rem' }}></div>

            <div className="flex gap-2">
              <a href={`/profile/${currentMatching.mentor_usuario_id}`} className="text-sm font-medium flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-1"
                 style={{ backgroundColor: 'var(--surface-input)', color: 'var(--color-primary-500)' }}>
                Ver perfil <ArrowRight className="w-4 h-4" />
              </a>
              {currentMatching.estado === 'Activo' && (
                <a href="/sessions" className="text-sm font-medium flex-1 py-2 px-4 rounded-lg text-white btn-primary flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Mis Sesiones
                </a>
              )}
            </div>
          </div>
        )}

        {currentMatching && (
          <div className="text-center">
            <button onClick={handleGenerate} disabled={generating} className="text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                    style={{ color: 'var(--color-primary-500)' }}>
              <RefreshCw className="w-4 h-4" /> Buscar otro mentor
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==================== VISTA MENTOR (JEDI) ====================
  const pendingMatchings = matchings.filter((m) => m.estado === 'Pendiente');
  const activeMatchings = matchings.filter((m) => m.estado === 'Activo');

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Users className="w-8 h-8 text-primary-500" /> Mis Padawans
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Gestiona tus mentorias y aprendices.
        </p>
      </div>

      {matchings.length === 0 && (
        <div className="card p-8 text-center">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Sin aprendices asignados
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Los Padawans serán asignados cuando soliciten mentoría.
          </p>
        </div>
      )}

      {pendingMatchings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-5 h-5 text-warning" /> Solicitudes Pendientes ({pendingMatchings.length})
          </h2>
          <div className="space-y-3">
            {pendingMatchings.map((m) => (
              <div key={m.matching_id} className="card p-5 border-l-4" style={{ borderColor: 'var(--color-warning)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                         style={{ backgroundColor: 'var(--color-warning)' }}>
                      {m.padawan_nombres?.charAt(0)}{m.padawan_apellidos?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {m.padawan_nombres} {m.padawan_apellidos}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Afinidad: {(m.score_afinidad * 100).toFixed(0)}% · Score: {m.score_empleabilidad}
                      </p>
                    </div>
                  </div>
                </div>

                {m.resumen_bio && (
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--surface-input)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {m.resumen_bio}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <button onClick={() => handleRespond(m.matching_id, 'aceptar')}
                          disabled={responding === m.matching_id}
                          className="btn-primary text-sm flex-1 flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Aceptar
                  </button>
                  <button onClick={() => handleRespond(m.matching_id, 'rechazar')}
                          disabled={responding === m.matching_id}
                          className="btn-ghost text-sm flex-1 flex items-center justify-center gap-1"
                          style={{ color: 'var(--color-danger)' }}>
                    <X className="w-4 h-4" /> Rechazar
                  </button>
                  <a href={`/profile/${m.padawan_usuario_id}`}
                     className="text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                     style={{ backgroundColor: 'var(--surface-input)', color: 'var(--color-primary-500)' }}>
                    Ver <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMatchings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Check className="w-5 h-5 text-success" /> Mentorias Activas ({activeMatchings.length})
          </h2>
          <div className="space-y-3">
            {activeMatchings.map((m) => (
              <div key={m.matching_id} className="card p-5 border-l-4" style={{ borderColor: 'var(--color-success)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                         style={{ backgroundColor: 'var(--color-success)' }}>
                      {m.padawan_nombres?.charAt(0)}{m.padawan_apellidos?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {m.padawan_nombres} {m.padawan_apellidos}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Afinidad: {(m.score_afinidad * 100).toFixed(0)}% · Score: {m.score_empleabilidad}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>
                    Activo
                  </span>
                </div>

                {m.resumen_bio && (
                  <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'var(--surface-input)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {m.resumen_bio}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <a href="/sessions" className="text-sm font-medium flex-1 py-2 px-3 rounded-lg text-white btn-primary flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4" /> Crear sesión
                  </a>
                  <a href={`/profile/${m.padawan_usuario_id}`}
                     className="text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                     style={{ backgroundColor: 'var(--surface-input)', color: 'var(--color-primary-500)' }}>
                    Ver perfil <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingPage;
