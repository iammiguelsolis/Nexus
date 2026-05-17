import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { okrService } from '../services/api';
import { LoadingSpinner, Modal, EmptyState, ProgressBar } from '../components/ui';

interface OKR {
  okr_id: string;
  sesion_id: string;
  descripcion: string;
  indicador: string | null;
  valor_meta: number;
  valor_actual: number;
  estado: 'Pendiente' | 'EnProgreso' | 'Completado' | 'Cancelado';
  fecha_limite: string | null;
  fecha_actualizacion: string;
  notas?: string | null;
}

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  Pendiente: { bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)', label: 'Pendiente', icon: '○' },
  EnProgreso: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)', label: 'En Progreso', icon: '◐' },
  Completado: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)', label: 'Completado', icon: '●' },
  Cancelado: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', label: 'Cancelado', icon: '✕' },
};

const OKRPage = () => {
  const { sesionId } = useParams<{ sesionId: string }>();
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);

  // UC-16: Modal crear OKR
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ descripcion: '', indicador: '', valor_meta: 1, fecha_limite: '' });
  const [creating, setCreating] = useState(false);

  // UC-17: Modal actualizar progreso
  const [showProgress, setShowProgress] = useState(false);
  const [progressOkr, setProgressOkr] = useState<OKR | null>(null);
  const [newValue, setNewValue] = useState(0);
  const [updating, setUpdating] = useState(false);

  // UC-18: Modal completar OKR
  const [showComplete, setShowComplete] = useState(false);
  const [completeOkr, setCompleteOkr] = useState<OKR | null>(null);
  const [completeValue, setCompleteValue] = useState(0);
  const [completeNote, setCompleteNote] = useState('');
  const [completing, setCompleting] = useState(false);

  // UC-19: Modal feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackOkr, setFeedbackOkr] = useState<OKR | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbacking, setFeedbacking] = useState(false);

  const loadOkrs = () => {
    if (!sesionId) return;
    okrService.listBySession(sesionId)
      .then((res) => setOkrs(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOkrs(); }, [sesionId]);

  const isJedi = user?.rol === 'Jedi';
  const isPadawan = user?.rol === 'Padawan';

  /** UC-16: Crear OKR */
  const handleCreate = async () => {
    if (!sesionId || !createForm.descripcion) return;
    setCreating(true);
    try {
      await okrService.create(sesionId, {
        descripcion: createForm.descripcion,
        indicador: createForm.indicador || undefined,
        valor_meta: createForm.valor_meta,
        fecha_limite: createForm.fecha_limite || undefined,
      });
      setShowCreate(false);
      setCreateForm({ descripcion: '', indicador: '', valor_meta: 1, fecha_limite: '' });
      loadOkrs();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  /** UC-17: Actualizar progreso */
  const handleUpdateProgress = async () => {
    if (!progressOkr) return;
    setUpdating(true);
    try {
      const newEstado = newValue > 0 && progressOkr.estado === 'Pendiente' ? 'EnProgreso' : undefined;
      await okrService.update(progressOkr.okr_id, {
        valor_actual: newValue,
        ...(newEstado ? { estado: newEstado } : {}),
      });
      setShowProgress(false);
      setProgressOkr(null);
      loadOkrs();
    } catch { /* handled */ }
    finally { setUpdating(false); }
  };

  /** UC-18: Completar OKR */
  const handleComplete = async () => {
    if (!completeOkr) return;
    setCompleting(true);
    try {
      await okrService.complete(completeOkr.okr_id, {
        valor_actual: completeValue,
        nota_cierre: completeNote,
      });
      setShowComplete(false);
      setCompleteOkr(null);
      setCompleteNote('');
      loadOkrs();
    } catch { /* handled */ }
    finally { setCompleting(false); }
  };

  /** UC-19: Feedback */
  const handleFeedback = async (accion: 'aprobar' | 'revisar') => {
    if (!feedbackOkr) return;
    setFeedbacking(true);
    try {
      await okrService.feedback(feedbackOkr.okr_id, { accion, comentario: feedbackComment });
      setShowFeedback(false);
      setFeedbackOkr(null);
      setFeedbackComment('');
      loadOkrs();
    } catch { /* handled */ }
    finally { setFeedbacking(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const stats = {
    total: okrs.length,
    completados: okrs.filter((o) => o.estado === 'Completado').length,
    enProgreso: okrs.filter((o) => o.estado === 'EnProgreso').length,
    pendientes: okrs.filter((o) => o.estado === 'Pendiente').length,
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Link to="/sessions" className="text-xs font-medium" style={{ color: 'var(--color-primary-500)' }}>
          ← Volver a Sesiones
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            OKRs de la Sesión
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Objetivos y resultados clave asignados en esta sesión.
          </p>
        </div>
        {isJedi && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            + Crear OKR
          </button>
        )}
      </div>

      {/* Stats bar */}
      {okrs.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: '📊' },
            { label: 'Pendientes', value: stats.pendientes, icon: '○' },
            { label: 'En Progreso', value: stats.enProgreso, icon: '◐' },
            { label: 'Completados', value: stats.completados, icon: '●' },
          ].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.icon} {s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* OKR List */}
      {okrs.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon="📈" title="Sin OKRs"
                      description={isJedi ? 'Crea el primer OKR para esta sesión.' : 'Tu mentor aún no ha definido OKRs para esta sesión.'}
                      action={isJedi ? <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Crear OKR</button> : undefined} />
        </div>
      ) : (
        <div className="space-y-3">
          {okrs.map((okr) => {
            const style = ESTADO_STYLES[okr.estado] || ESTADO_STYLES.Pendiente;
            const progress = okr.valor_meta > 0 ? Math.min((okr.valor_actual / okr.valor_meta) * 100, 100) : 0;

            return (
              <div key={okr.okr_id} className="card p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{okr.descripcion}</p>
                    {okr.indicador && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>📏 {okr.indicador}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: style.bg, color: style.color }}>
                    {style.icon} {style.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{okr.valor_actual} / {okr.valor_meta}</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={okr.valor_actual} max={okr.valor_meta} />
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  {okr.fecha_limite && (
                    <span>📅 {new Date(okr.fecha_limite).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                  )}
                  <span>🔄 {new Date(okr.fecha_actualizacion).toLocaleDateString('es-PE')}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                  {/* UC-17: Padawan actualiza progreso */}
                  {isPadawan && ['Pendiente', 'EnProgreso'].includes(okr.estado) && (
                    <button onClick={() => { setProgressOkr(okr); setNewValue(Number(okr.valor_actual)); setShowProgress(true); }}
                            className="text-xs font-medium" style={{ color: 'var(--color-primary-500)' }}>
                      📊 Actualizar progreso
                    </button>
                  )}

                  {/* UC-18: Padawan completa OKR */}
                  {isPadawan && okr.estado === 'EnProgreso' && (
                    <button onClick={() => { setCompleteOkr(okr); setCompleteValue(Number(okr.valor_meta)); setShowComplete(true); }}
                            className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                      ✓ Completar
                    </button>
                  )}

                  {/* UC-19: Jedi da feedback */}
                  {isJedi && okr.estado === 'Completado' && (
                    <button onClick={() => { setFeedbackOkr(okr); setShowFeedback(true); }}
                            className="text-xs font-medium" style={{ color: 'var(--color-primary-500)' }}>
                      💬 Dar feedback
                    </button>
                  )}

                  {/* Cancel */}
                  {isJedi && ['Pendiente', 'EnProgreso'].includes(okr.estado) && (
                    <button onClick={async () => { await okrService.delete(okr.okr_id); loadOkrs(); }}
                            className="text-xs font-medium ml-auto" style={{ color: 'var(--color-danger)' }}>
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UC-16: Modal crear OKR */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Crear nuevo OKR">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descripción del objetivo</label>
            <textarea className="input-field" rows={2} placeholder="Ej: Refactorizar 3 componentes con custom hooks"
                      value={createForm.descripcion} onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Indicador (opcional)</label>
            <input className="input-field" placeholder="Ej: Componentes refactorizados"
                   value={createForm.indicador} onChange={(e) => setCreateForm({ ...createForm, indicador: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Valor meta</label>
              <input className="input-field" type="number" min={1}
                     value={createForm.valor_meta} onChange={(e) => setCreateForm({ ...createForm, valor_meta: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha límite</label>
              <input className="input-field" type="date"
                     value={createForm.fecha_limite} onChange={(e) => setCreateForm({ ...createForm, fecha_limite: e.target.value })} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !createForm.descripcion}
                  className="btn-primary w-full flex items-center justify-center gap-2">
            {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {creating ? 'Creando...' : 'Crear OKR'}
          </button>
        </div>
      </Modal>

      {/* UC-17: Modal actualizar progreso */}
      <Modal isOpen={showProgress} onClose={() => setShowProgress(false)} title="Actualizar progreso">
        <div className="space-y-4">
          {progressOkr && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{progressOkr.descripcion}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Meta: {progressOkr.valor_meta} · Actual: {progressOkr.valor_actual}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nuevo valor actual</label>
            <input className="input-field" type="number" min={0} max={progressOkr?.valor_meta}
                   value={newValue} onChange={(e) => setNewValue(Number(e.target.value))} />
          </div>
          <button onClick={handleUpdateProgress} disabled={updating || newValue === Number(progressOkr?.valor_actual)}
                  className="btn-primary w-full flex items-center justify-center gap-2">
            {updating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {updating ? 'Guardando...' : 'Actualizar progreso'}
          </button>
        </div>
      </Modal>

      {/* UC-18: Modal completar OKR */}
      <Modal isOpen={showComplete} onClose={() => setShowComplete(false)} title="Completar OKR">
        <div className="space-y-4">
          {completeOkr && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-light)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-success-dark)' }}>{completeOkr.descripcion}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-success-dark)' }}>Meta: {completeOkr.valor_meta}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Valor alcanzado (≥ meta)</label>
            <input className="input-field" type="number" min={completeOkr?.valor_meta || 0}
                   value={completeValue} onChange={(e) => setCompleteValue(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nota de cierre</label>
            <textarea className="input-field" rows={3} placeholder="Resumen de lo que lograste..."
                      value={completeNote} onChange={(e) => setCompleteNote(e.target.value)} />
          </div>
          <button onClick={handleComplete} disabled={completing || !completeNote || completeValue < (completeOkr?.valor_meta || 0)}
                  className="btn-primary w-full flex items-center justify-center gap-2">
            {completing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {completing ? 'Completando...' : '✓ Marcar como Completado'}
          </button>
        </div>
      </Modal>

      {/* UC-19: Modal feedback */}
      <Modal isOpen={showFeedback} onClose={() => setShowFeedback(false)} title="Dar feedback sobre OKR">
        <div className="space-y-4">
          {feedbackOkr && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{feedbackOkr.descripcion}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Completado: {feedbackOkr.valor_actual} / {feedbackOkr.valor_meta}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Comentario (opcional)</label>
            <textarea className="input-field" rows={3} placeholder="Buen trabajo, o indicaciones para mejorar..."
                      value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleFeedback('aprobar')} disabled={feedbacking}
                    className="btn-primary flex items-center justify-center gap-2">
              {feedbacking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              ✓ Aprobar
            </button>
            <button onClick={() => handleFeedback('revisar')} disabled={feedbacking}
                    className="btn-ghost flex items-center justify-center gap-2"
                    style={{ color: 'var(--color-warning-dark)', border: '1px solid var(--color-warning-dark)' }}>
              🔄 Pedir revisión
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OKRPage;
