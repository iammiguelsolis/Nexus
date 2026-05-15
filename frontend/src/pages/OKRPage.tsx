import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { okrService } from '../services/api';
import type { OKR } from '../types';
import { LoadingSpinner, Badge, ProgressBar, EmptyState, Modal } from '../components/ui';
import { getEstadoOKRColor, formatDate, getProgressPercentage } from '../utils/helpers';
import type { AxiosError } from 'axios';

const OKRPage = () => {
  const { sesionId } = useParams<{ sesionId: string }>();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOkr, setSelectedOkr] = useState<OKR | null>(null);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [createForm, setCreateForm] = useState({
    descripcion: '', indicador: '', valor_meta: 1, fecha_limite: '',
  });
  const [completeForm, setCompleteForm] = useState({
    valor_actual: 0, nota_cierre: '',
  });

  const loadOkrs = () => {
    if (!sesionId) return;
    okrService.listBySession(sesionId)
      .then((res) => setOkrs(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOkrs(); }, [sesionId]);

  const handleCreate = async () => {
    if (!createForm.descripcion || !sesionId) return;
    setCreating(true);
    setError('');
    try {
      await okrService.create(sesionId, {
        descripcion: createForm.descripcion,
        indicador: createForm.indicador || undefined,
        valor_meta: createForm.valor_meta,
        fecha_limite: createForm.fecha_limite || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ descripcion: '', indicador: '', valor_meta: 1, fecha_limite: '' });
      loadOkrs();
    } catch {
      setError('Error al crear OKR');
    } finally {
      setCreating(false);
    }
  };

  const openCompleteModal = (okr: OKR) => {
    setSelectedOkr(okr);
    setCompleteForm({ valor_actual: okr.valor_meta, nota_cierre: '' });
    setError('');
    setSuccessMsg('');
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    if (!selectedOkr) return;
    setCompleting(true);
    setError('');
    try {
      const res = await okrService.complete(selectedOkr.okr_id, completeForm);
      const nuevoScore = res.data.okr?.nuevo_score;
      setSuccessMsg(`¡OKR completado! ${nuevoScore ? `Tu nuevo score es: ${nuevoScore}` : ''}`);
      setTimeout(() => {
        setShowCompleteModal(false);
        setSuccessMsg('');
        loadOkrs();
      }, 2000);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string; code: string; details?: Record<string, unknown> }>;
      const data = axiosErr.response?.data;
      const status = axiosErr.response?.status;

      if (status === 403) setError('⛔ No eres el propietario de este OKR');
      else if (status === 409) setError(`⚠️ ${data?.error}. Estado actual: ${data?.details?.estadoActual}`);
      else if (status === 422) setError(`📊 Tu progreso (${data?.details?.valor_actual}) no alcanza la meta (${data?.details?.valor_meta})`);
      else setError(data?.error || 'Error al completar OKR');
    } finally {
      setCompleting(false);
    }
  };

  const handleChangeStatus = async (okrId: string, estado: string) => {
    try {
      await okrService.update(okrId, { estado });
      loadOkrs();
    } catch { /* silently fail */ }
  };

  const handleDelete = async (okrId: string) => {
    if (!confirm('¿Cancelar este OKR?')) return;
    try {
      await okrService.delete(okrId);
      loadOkrs();
    } catch { /* silently fail */ }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/sessions" className="text-dark-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white font-display">OKRs de la Sesión</h1>
          <p className="text-dark-400 text-sm mt-1">Objetivos y resultados clave</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> Nuevo OKR
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['Pendiente', 'EnProgreso', 'Completado', 'Cancelado'] as const).map((estado) => {
          const count = okrs.filter((o) => o.estado === estado).length;
          return (
            <div key={estado} className="glass-light rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-white">{count}</span>
              <p className="text-xs text-dark-400 mt-1">{estado}</p>
            </div>
          );
        })}
      </div>

      {/* OKR List */}
      {okrs.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No hay OKRs"
          description="Crea tu primer OKR para esta sesión"
          action={
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">Crear OKR</button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {okrs.map((okr, index) => (
            <div
              key={okr.okr_id}
              className="glass rounded-2xl p-6 card-hover animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge className={getEstadoOKRColor(okr.estado)}>{okr.estado}</Badge>
                    {okr.fecha_limite && (
                      <span className="text-xs text-dark-400">📅 {formatDate(okr.fecha_limite)}</span>
                    )}
                  </div>
                  <p className="text-white font-medium">{okr.descripcion}</p>
                  {okr.indicador && (
                    <p className="text-dark-400 text-sm mt-1">📏 {okr.indicador}</p>
                  )}
                  <div className="mt-4">
                    <ProgressBar
                      value={Number(okr.valor_actual)}
                      max={Number(okr.valor_meta)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {okr.estado === 'Pendiente' && (
                    <button
                      onClick={() => handleChangeStatus(okr.okr_id, 'EnProgreso')}
                      className="btn-secondary text-sm px-3 py-1.5"
                    >
                      ▶ Iniciar
                    </button>
                  )}
                  {okr.estado === 'EnProgreso' && (
                    <button
                      onClick={() => openCompleteModal(okr)}
                      className="btn-success text-sm px-3 py-1.5"
                    >
                      ✓ Completar
                    </button>
                  )}
                  {okr.estado !== 'Completado' && okr.estado !== 'Cancelado' && (
                    <button
                      onClick={() => handleDelete(okr.okr_id)}
                      className="text-dark-400 hover:text-danger-400 transition-colors text-sm px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create OKR Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo OKR">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Descripción</label>
            <textarea
              className="input-field resize-none h-24"
              placeholder="Ej: Completar 3 pull requests con revisión aprobada"
              value={createForm.descripcion}
              onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Indicador de medición</label>
            <input
              className="input-field"
              placeholder="Ej: Pull requests merged"
              value={createForm.indicador}
              onChange={(e) => setCreateForm({ ...createForm, indicador: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Meta (valor numérico)</label>
              <input
                type="number" min={1} className="input-field"
                value={createForm.valor_meta}
                onChange={(e) => setCreateForm({ ...createForm, valor_meta: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Fecha límite</label>
              <input
                type="date" className="input-field"
                value={createForm.fecha_limite}
                onChange={(e) => setCreateForm({ ...createForm, fecha_limite: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
              {creating ? '...' : 'Crear OKR'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Complete OKR Modal */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Completar OKR">
        <div className="space-y-4">
          {successMsg ? (
            <div className="p-6 text-center animate-fade-in">
              <span className="text-5xl block mb-4">🎉</span>
              <p className="text-success-400 font-semibold text-lg">{successMsg}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-danger-600/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
                  {error}
                </div>
              )}
              {selectedOkr && (
                <div className="p-3 rounded-xl bg-dark-700/40">
                  <p className="text-white text-sm font-medium">{selectedOkr.descripcion}</p>
                  <p className="text-dark-400 text-xs mt-1">Meta: {selectedOkr.valor_meta}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Valor actual alcanzado</label>
                <input
                  type="number" className="input-field"
                  value={completeForm.valor_actual}
                  onChange={(e) => setCompleteForm({ ...completeForm, valor_actual: parseFloat(e.target.value) || 0 })}
                />
                {selectedOkr && completeForm.valor_actual < selectedOkr.valor_meta && (
                  <p className="text-warning-400 text-xs mt-1">
                    ⚠ El valor debe ser ≥ {selectedOkr.valor_meta} para completar
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Nota de cierre</label>
                <textarea
                  className="input-field resize-none h-24"
                  placeholder="Describe lo que lograste..."
                  value={completeForm.nota_cierre}
                  onChange={(e) => setCompleteForm({ ...completeForm, nota_cierre: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCompleteModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleComplete} disabled={completing} className="btn-success flex-1">
                  {completing ? '...' : '✓ Completar OKR'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OKRPage;
