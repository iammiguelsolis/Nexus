import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sessionService } from '../services/api';
import type { Session } from '../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../components/ui';
import { formatDateTime, getEstadoSesionColor } from '../utils/helpers';

const SessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ titulo: '', fecha_sesion: '', duracion_min: 60 });
  const [error, setError] = useState('');

  const loadSessions = () => {
    sessionService.getMySessions()
      .then((res) => setSessions(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSessions(); }, []);

  const handleCreate = async () => {
    if (!form.titulo || !form.fecha_sesion) {
      setError('Título y fecha son requeridos');
      return;
    }
    setCreating(true);
    setError('');
    try {
      // Use the first available matching
      const matchingId = sessions[0]?.matching_id;
      if (!matchingId) {
        setError('No tienes un matching activo. Contacta al administrador.');
        setCreating(false);
        return;
      }
      await sessionService.create(matchingId, {
        titulo: form.titulo,
        fecha_sesion: form.fecha_sesion,
        duracion_min: form.duracion_min,
      });
      setShowCreateModal(false);
      setForm({ titulo: '', fecha_sesion: '', duracion_min: 60 });
      loadSessions();
    } catch {
      setError('Error al crear la sesión');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (sesionId: string) => {
    if (!confirm('¿Cancelar esta sesión?')) return;
    try {
      await sessionService.delete(sesionId);
      loadSessions();
    } catch { /* handled silently */ }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Mis Sesiones</h1>
          <p className="text-dark-400 text-sm mt-1">Gestiona tus sesiones de mentoría</p>
        </div>
        {sessions.length > 0 && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <span>+</span> Nueva Sesión
          </button>
        )}
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No hay sesiones"
          description="Aún no tienes sesiones de mentoría. Necesitas un matching activo para comenzar."
        />
      ) : (
        <div className="grid gap-4">
          {sessions.map((session, index) => (
            <div
              key={session.sesion_id}
              className="glass rounded-2xl p-6 card-hover animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-nexus-700/30 flex items-center justify-center text-xl flex-shrink-0">
                    📅
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{session.titulo}</h3>
                    <p className="text-dark-400 text-sm mt-1">{formatDateTime(session.fecha_sesion)}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge className={getEstadoSesionColor(session.estado)}>
                        {session.estado}
                      </Badge>
                      <span className="text-dark-400 text-sm">⏱ {session.duracion_min} min</span>
                      {session.mentor_nombres && (
                        <span className="text-dark-400 text-sm">
                          🧙‍♂️ {session.mentor_nombres} {session.mentor_apellidos}
                        </span>
                      )}
                    </div>
                    {/* OKR Stats */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm text-dark-400">
                        OKRs: <span className="text-nexus-300 font-medium">{session.okrs_completados || 0}</span>
                        /{session.total_okrs || 0} completados
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/sessions/${session.sesion_id}/okrs`}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Ver OKRs
                  </Link>
                  {session.estado === 'Programada' && (
                    <button
                      onClick={() => handleCancel(session.sesion_id)}
                      className="text-dark-400 hover:text-danger-400 transition-colors p-2 rounded-lg hover:bg-dark-700/50"
                      title="Cancelar sesión"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva Sesión de Mentoría">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-danger-600/10 border border-danger-500/30 text-danger-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Título</label>
            <input
              className="input-field"
              placeholder="Ej: Revisión de código React"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Fecha y hora</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.fecha_sesion}
              onChange={(e) => setForm({ ...form, fecha_sesion: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Duración (minutos)</label>
            <input
              type="number"
              className="input-field"
              min={15} max={480}
              value={form.duracion_min}
              onChange={(e) => setForm({ ...form, duracion_min: parseInt(e.target.value) || 60 })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1 flex items-center justify-center">
              {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Crear Sesión'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SessionsPage;
