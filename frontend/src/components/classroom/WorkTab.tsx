import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { sessionService } from '../../services/api';
import { Modal } from '../ui';
import { useState } from 'react';
import type { Session } from '../../types';

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Programada: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)', label: '📅 Programada' },
  Realizada: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)', label: '✅ Realizada' },
  Cancelada: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', label: '❌ Cancelada' },
};

export default function WorkTab({ matchingId, sessions, reload }: { matchingId: string; sessions: Session[]; reload: () => void }) {
  const { user } = useAuth();
  const isJedi = user?.rol === 'Jedi';
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ titulo: '', fecha_sesion: '', duracion_min: 60, notas: '' });
  const [creating, setCreating] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeSession, setCompleteSession] = useState<Session | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const handleCreate = async () => {
    if (!form.titulo || !form.fecha_sesion) return;
    setCreating(true);
    try {
      await sessionService.create(matchingId, form);
      setShowCreate(false); setForm({ titulo: '', fecha_sesion: '', duracion_min: 60, notas: '' }); reload();
    } catch { /* */ } finally { setCreating(false); }
  };

  const handleComplete = async () => {
    if (!completeSession) return;
    try {
      await sessionService.update(completeSession.sesion_id, { estado: 'Realizada', notas: completeNotes || completeSession.notas });
      setShowComplete(false); setCompleteSession(null); reload();
    } catch { /* */ }
  };

  const programadas = sessions.filter(s => s.estado === 'Programada');
  const realizadas = sessions.filter(s => s.estado === 'Realizada');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Actions */}
      {isJedi && (
        <div className="flex justify-end">
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Nueva sesión</button>
        </div>
      )}

      {/* Programadas */}
      {programadas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            📅 Próximas sesiones <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}>{programadas.length}</span>
          </h3>
          <div className="space-y-2">
            {programadas.map(s => {
              const style = ESTADO_STYLES[s.estado];
              return (
                <div key={s.sesion_id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: style.bg }}>📝</div>
                    <div>
                      <Link to={`/sessions/${s.sesion_id}/okrs`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>{s.titulo}</Link>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.fecha_sesion).toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'short' })} · {s.duracion_min} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isJedi && (
                      <button onClick={() => { setCompleteSession(s); setCompleteNotes(s.notas||''); setShowComplete(true); }}
                        className="text-xs font-medium px-3 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>✓ Completar</button>
                    )}
                    <button onClick={async () => { await sessionService.delete(s.sesion_id); reload(); }}
                      className="text-xs" style={{ color: 'var(--color-danger)' }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Realizadas */}
      {realizadas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>✅ Sesiones completadas</h3>
          <div className="space-y-2">
            {realizadas.map(s => (
              <div key={s.sesion_id} className="card p-4 flex items-center justify-between" style={{ opacity: 0.85 }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: 'var(--color-success-light)' }}>✅</div>
                  <div>
                    <Link to={`/sessions/${s.sesion_id}/okrs`} className="text-sm font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>{s.titulo}</Link>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.fecha_sesion).toLocaleDateString('es-PE', { day:'numeric', month:'short' })} · {s.total_okrs||0} tareas
                    </p>
                  </div>
                </div>
                <Link to={`/sessions/${s.sesion_id}/okrs`} className="text-xs font-medium" style={{ color: 'var(--color-primary-500)' }}>Ver tareas →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sin sesiones aún</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isJedi ? 'Crea la primera sesión para tu Padawan.' : 'Tu mentor aún no ha creado sesiones.'}</p>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Programar sesión">
        <div className="space-y-3">
          <input className="input-field" placeholder="Título de la sesión" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="datetime-local" value={form.fecha_sesion} onChange={e => setForm({...form, fecha_sesion: e.target.value})} />
            <input className="input-field" type="number" min={15} value={form.duracion_min} onChange={e => setForm({...form, duracion_min: Number(e.target.value)})} />
          </div>
          <textarea className="input-field" rows={2} placeholder="Notas (opcional)" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
          <button onClick={handleCreate} disabled={creating || !form.titulo || !form.fecha_sesion} className="btn-primary w-full">
            {creating ? 'Creando...' : '📅 Programar'}
          </button>
        </div>
      </Modal>

      {/* Complete modal */}
      <Modal isOpen={showComplete} onClose={() => setShowComplete(false)} title="Completar sesión">
        <div className="space-y-3">
          <textarea className="input-field" rows={3} placeholder="Notas y feedback..." value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} />
          <button onClick={handleComplete} className="btn-primary w-full">✓ Marcar como Realizada</button>
        </div>
      </Modal>
    </div>
  );
}
