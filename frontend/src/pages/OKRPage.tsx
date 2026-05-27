import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { okrService } from '../services/api';
import { LoadingSpinner, Modal, EmptyState, ProgressBar } from '../components/ui';
import { ClipboardList, Upload, CheckCircle2, XCircle, FileEdit, BarChart2, AlertTriangle, Calendar, Target, Paperclip, MessageSquare, Clock, Pencil, Trash2 } from 'lucide-react';

interface OKR {
  okr_id: string; sesion_id: string; descripcion: string; indicador: string | null;
  valor_meta: number; valor_actual: number;
  estado: 'Pendiente' | 'EnProgreso' | 'Completado' | 'Cancelado';
  fecha_limite: string | null; fecha_actualizacion: string; notas?: string | null;
}

const ESTADO_MAP: Record<string, { bg: string; color: string; label: string; icon: any }> = {
  Pendiente:  { bg: 'var(--color-warning-light,#fff3cd)', color: 'var(--color-warning-dark,#856404)', label: 'Sin entregar', icon: <ClipboardList className="w-4 h-4 inline" /> },
  EnProgreso: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)', label: 'Entregado', icon: <Upload className="w-4 h-4 inline" /> },
  Completado: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)', label: 'Calificado', icon: <CheckCircle2 className="w-4 h-4 inline" /> },
  Cancelado:  { bg: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', label: 'Cancelado', icon: <XCircle className="w-4 h-4 inline" /> },
};

const OKRPage = () => {
  const { sesionId } = useParams<{ sesionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const isJedi = user?.rol === 'Jedi';
  const isPadawan = user?.rol === 'Padawan';

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ descripcion: '', indicador: '', valor_meta: 100, fecha_limite: '' });
  const [creating, setCreating] = useState(false);

  // Submit (student)
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitOkr, setSubmitOkr] = useState<OKR | null>(null);
  const [submitText, setSubmitText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Grade (mentor)
  const [showGrade, setShowGrade] = useState(false);
  const [gradeOkr, setGradeOkr] = useState<OKR | null>(null);
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeNote, setGradeNote] = useState('');
  const [grading, setGrading] = useState(false);

  const loadOkrs = () => {
    if (!sesionId) return;
    okrService.listBySession(sesionId).then(r => setOkrs(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { loadOkrs(); }, [sesionId]);

  const handleCreate = async () => {
    if (!sesionId || !createForm.descripcion) return;
    setCreating(true);
    try {
      await okrService.create(sesionId, {
        descripcion: createForm.descripcion, indicador: createForm.indicador || undefined,
        valor_meta: createForm.valor_meta, fecha_limite: createForm.fecha_limite || undefined,
      });
      setShowCreate(false); setCreateForm({ descripcion: '', indicador: '', valor_meta: 100, fecha_limite: '' }); loadOkrs();
    } catch (e: any) { alert(e.response?.data?.error || 'Error'); } finally { setCreating(false); }
  };

  const handleSubmit = async () => {
    if (!submitOkr || !submitText.trim()) return;
    setSubmitting(true);
    try {
      await okrService.update(submitOkr.okr_id, { indicador: submitText, estado: 'EnProgreso' });
      setShowSubmit(false); setSubmitOkr(null); setSubmitText(''); loadOkrs();
    } catch (e: any) { alert(e.response?.data?.error || 'Error'); } finally { setSubmitting(false); }
  };

  const handleGrade = async () => {
    if (!gradeOkr || !gradeNote.trim()) return;
    setGrading(true);
    try {
      await okrService.complete(gradeOkr.okr_id, { valor_actual: gradeScore, nota_cierre: gradeNote });
      setShowGrade(false); setGradeOkr(null); setGradeNote(''); loadOkrs();
    } catch (e: any) { alert(e.response?.data?.error || 'Error'); } finally { setGrading(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const stats = {
    total: okrs.length,
    sinEntregar: okrs.filter(o => o.estado === 'Pendiente').length,
    entregados: okrs.filter(o => o.estado === 'EnProgreso').length,
    calificados: okrs.filter(o => o.estado === 'Completado').length,
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-xs font-medium mb-2 inline-flex items-center gap-1" style={{ color: 'var(--color-primary-500)' }}>
        ← Volver
      </button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileEdit className="w-6 h-6 text-primary-500" /> {isJedi ? 'Tareas de la Sesión' : 'Mis Tareas'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isJedi ? 'Asigna tareas y califica las entregas de tu Padawan.' : 'Entrega tus tareas para que tu mentor las revise.'}
          </p>
        </div>
        {isJedi && <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Nueva tarea</button>}
      </div>

      {/* Stats */}
      {okrs.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: <BarChart2 className="w-4 h-4 inline" />, bg: 'var(--surface-input)' },
            { label: 'Sin entregar', value: stats.sinEntregar, icon: <ClipboardList className="w-4 h-4 inline" />, bg: 'var(--color-warning-light,#fff3cd)' },
            { label: 'Entregados', value: stats.entregados, icon: <Upload className="w-4 h-4 inline" />, bg: 'var(--color-primary-100)' },
            { label: 'Calificados', value: stats.calificados, icon: <CheckCircle2 className="w-4 h-4 inline" />, bg: 'var(--color-success-light)' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center" style={{ backgroundColor: s.bg }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.icon} {s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Task List */}
      {okrs.length === 0 ? (
        <div className="card p-6">
          <EmptyState icon={<FileEdit className="w-12 h-12 text-neutral-400" />} title="Sin tareas"
            description={isJedi ? 'Crea la primera tarea para esta sesión.' : 'Tu mentor aún no ha asignado tareas.'}
            action={isJedi ? <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Nueva tarea</button> : undefined} />
        </div>
      ) : (
        <div className="space-y-3">
          {okrs.map(okr => {
            const st = ESTADO_MAP[okr.estado] || ESTADO_MAP.Pendiente;
            const score = okr.valor_meta > 0 ? Math.min((okr.valor_actual / okr.valor_meta) * 100, 100) : 0;
            const isLate = okr.fecha_limite && new Date(okr.fecha_limite) < new Date() && okr.estado === 'Pendiente';

            return (
              <div key={okr.okr_id} className="card p-0 overflow-hidden" style={{ border: isLate ? '2px solid var(--color-danger)' : '1px solid var(--border-light)' }}>
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{okr.descripcion}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {okr.fecha_limite && (
                          <span className="flex items-center gap-1" style={{ color: isLate ? 'var(--color-danger)' : undefined }}>
                            {isLate ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />} {new Date(okr.fecha_limite).toLocaleDateString('es-PE', { day:'numeric', month:'short' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Puntaje máx: {okr.valor_meta}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1" style={{ backgroundColor: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                </div>

                {/* Submission area */}
                {okr.indicador && (
                  <div className="px-4 py-3 mx-4 mb-3 rounded-xl text-xs" style={{ backgroundColor: 'var(--surface-input)', border: '1px dashed var(--border-light)' }}>
                    <p className="font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}><Paperclip className="w-3.5 h-3.5" /> Entrega del estudiante:</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{okr.indicador}</p>
                  </div>
                )}

                {/* Grade display */}
                {okr.estado === 'Completado' && (
                  <div className="px-4 pb-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-success-light)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-success-dark)' }}><BarChart2 className="w-3.5 h-3.5" /> Calificación</span>
                        <span className="text-lg font-bold" style={{ color: 'var(--color-success-dark)' }}>{okr.valor_actual}/{okr.valor_meta}</span>
                      </div>
                      <ProgressBar value={okr.valor_actual} max={okr.valor_meta} showLabel={false} />
                      {okr.notas && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--color-success-dark)' }}><MessageSquare className="w-3.5 h-3.5" /> {okr.notas}</p>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--surface-input)' }}>
                  {isPadawan && okr.estado === 'Pendiente' && (
                    <button onClick={() => { setSubmitOkr(okr); setSubmitText(okr.indicador || ''); setShowSubmit(true); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: 'var(--color-primary-500)', color: '#fff' }}>
                      <Upload className="w-3.5 h-3.5" /> Entregar tarea
                    </button>
                  )}
                  {isPadawan && okr.estado === 'EnProgreso' && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Clock className="w-3.5 h-3.5" /> Esperando calificación del mentor...</span>
                  )}
                  {isJedi && okr.estado === 'EnProgreso' && (
                    <button onClick={() => { setGradeOkr(okr); setGradeScore(Number(okr.valor_meta)); setGradeNote(''); setShowGrade(true); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}>
                      <Pencil className="w-3.5 h-3.5" /> Calificar
                    </button>
                  )}
                  {isJedi && okr.estado === 'Pendiente' && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ClipboardList className="w-3.5 h-3.5" /> Esperando entrega del estudiante...</span>
                  )}
                  {isJedi && ['Pendiente', 'EnProgreso'].includes(okr.estado) && (
                    <button onClick={async () => { await okrService.delete(okr.okr_id); loadOkrs(); }}
                      className="text-xs font-medium ml-auto flex items-center gap-1" style={{ color: 'var(--color-danger)' }}><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={<span className="flex items-center gap-2"><FileEdit className="w-5 h-5" /> Asignar nueva tarea</span>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Descripción de la tarea</label>
            <textarea className="input-field" rows={3} placeholder="Ej: Implementar un hook personalizado para manejo de formularios..."
              value={createForm.descripcion} onChange={e => setCreateForm({...createForm, descripcion: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Puntaje máximo</label>
              <input className="input-field" type="number" min={1} value={createForm.valor_meta}
                onChange={e => setCreateForm({...createForm, valor_meta: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fecha límite</label>
              <input className="input-field" type="date" value={createForm.fecha_limite}
                onChange={e => setCreateForm({...createForm, fecha_limite: e.target.value})} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !createForm.descripcion} className="btn-primary w-full flex items-center justify-center gap-2">
            {creating ? 'Creando...' : <><FileEdit className="w-4 h-4" /> Asignar tarea</>}
          </button>
        </div>
      </Modal>

      {/* Submit Modal */}
      <Modal isOpen={showSubmit} onClose={() => setShowSubmit(false)} title={<span className="flex items-center gap-2"><Upload className="w-5 h-5" /> Entregar tarea</span>}>
        <div className="space-y-4">
          {submitOkr && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--surface-input)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{submitOkr.descripcion}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Puntaje máx: {submitOkr.valor_meta}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tu entrega (texto o enlace)</label>
            <textarea className="input-field" rows={4} placeholder="Describe lo que hiciste, pega un enlace a tu repositorio, etc..."
              value={submitText} onChange={e => setSubmitText(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={submitting || !submitText.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? 'Enviando...' : <><Upload className="w-4 h-4" /> Entregar</>}
          </button>
        </div>
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={showGrade} onClose={() => setShowGrade(false)} title={<span className="flex items-center gap-2"><Pencil className="w-5 h-5" /> Calificar tarea</span>}>
        <div className="space-y-4">
          {gradeOkr && (
            <>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--surface-input)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{gradeOkr.descripcion}</p>
              </div>
              {gradeOkr.indicador && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px dashed var(--color-primary-200)' }}>
                  <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-primary-700)' }}><Paperclip className="w-3.5 h-3.5" /> Entrega del estudiante:</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{gradeOkr.indicador}</p>
                </div>
              )}
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Puntaje (máx: {gradeOkr?.valor_meta})
            </label>
            <input className="input-field" type="number" min={0} max={gradeOkr?.valor_meta || 100}
              value={gradeScore} onChange={e => setGradeScore(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Retroalimentación</label>
            <textarea className="input-field" rows={3} placeholder="Buen trabajo, pero podrías mejorar..."
              value={gradeNote} onChange={e => setGradeNote(e.target.value)} />
          </div>
          <button onClick={handleGrade} disabled={grading || !gradeNote.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {grading ? 'Calificando...' : <><Pencil className="w-4 h-4" /> Calificar</>}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OKRPage;
