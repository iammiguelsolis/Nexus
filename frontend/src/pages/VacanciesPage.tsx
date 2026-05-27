import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { vacancyService } from '../services/api';
import { LoadingSpinner, Modal, EmptyState } from '../components/ui';
import { Briefcase, Building2, Inbox, Check } from 'lucide-react';

interface Vacancy {
  vacante_id: string;
  titulo: string;
  descripcion: string;
  salario_min: number;
  salario_max: number;
  modalidad: string;
  fecha_publicacion: string;
  activa: boolean;
  empresa_nombre: string;
  sector: string;
  logo_url: string | null;
}

interface Application {
  postulacion_id: string;
  vacante_titulo: string;
  empresa_nombre: string;
  estado: string;
  fecha_postulacion: string;
  modalidad: string;
}

type TabView = 'vacantes' | 'postulaciones';

const MODALIDAD_STYLES: Record<string, { bg: string; color: string }> = {
  Remoto: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
  Presencial: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
  Hibrido: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' },
};

const POSTULACION_STYLES: Record<string, { bg: string; color: string }> = {
  Enviada: { bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' },
  EnRevision: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
  Aceptada: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
  Rechazada: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-dark)' },
};

const VacanciesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabView>('vacantes');

  // UC-22: Filtros
  const [filterModalidad, setFilterModalidad] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  // Postularse modal
  const [showApply, setShowApply] = useState(false);
  const [applyVacancy, setApplyVacancy] = useState<Vacancy | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const loadData = async () => {
    try {
      const [vacRes] = await Promise.all([
        vacancyService.list(filterModalidad || undefined),
      ]);
      setVacancies(vacRes.data.data);

      if (isAuthenticated) {
        const appRes = await vacancyService.getMyApplications();
        setApplications(appRes.data.data);
      }
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filterModalidad]);

  const handleApply = async () => {
    if (!applyVacancy) return;
    setApplying(true);
    try {
      await vacancyService.apply(applyVacancy.vacante_id, applyMessage || undefined);
      setShowApply(false);
      setApplyVacancy(null);
      setApplyMessage('');
      loadData();
    } catch { /* handled */ }
    finally { setApplying(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const appliedIds = new Set(applications.map((a) => a.vacante_titulo));
  const isPadawan = user?.rol === 'Padawan';

  // UC-22: filtrar por texto
  const filtered = vacancies.filter((v) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return v.titulo.toLowerCase().includes(q)
        || v.empresa_nombre.toLowerCase().includes(q)
        || v.descripcion?.toLowerCase().includes(q)
        || v.sector?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Briefcase className="w-8 h-8 text-primary-500" /> {isPadawan ? 'Oportunidades Laborales' : 'Mercado Laboral'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {isPadawan 
            ? 'Explora posiciones alineadas a tu perfil y postúlate directamente.'
            : 'Explora las vacantes disponibles para recomendarlas a tus Padawans.'}
        </p>
      </div>

      {/* Tabs: Vacantes / Mis Postulaciones (Solo Padawan ve Postulaciones) */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-neutral-100)' }}>
        {([
          { key: 'vacantes' as TabView, label: 'Buscar Vacantes', count: filtered.length, show: true },
          { key: 'postulaciones' as TabView, label: 'Mis Postulaciones', count: applications.length, show: isPadawan },
        ]).filter(t => t.show).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: tab === t.key ? 'var(--surface-card)' : 'transparent',
                    color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
                  }}>
            {t.label} <span className="ml-1 opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === 'vacantes' && (
        <>
          {/* UC-22: Filtros */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <input className="input-field" placeholder="Buscar por título, empresa, sector..."
                     value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <select className="input-field" style={{ width: '180px' }}
                    value={filterModalidad} onChange={(e) => setFilterModalidad(e.target.value)}>
              <option value="">Todas las modalidades</option>
              <option value="Remoto">Remoto</option>
              <option value="Presencial">Presencial</option>
              <option value="Hibrido">Híbrido</option>
            </select>
          </div>

          {/* Vacancy Cards */}
          {filtered.length === 0 ? (
            <div className="card p-6">
              <EmptyState icon={<Briefcase className="w-12 h-12 text-neutral-400" />} title="Sin vacantes" description="No se encontraron vacantes con los filtros aplicados." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((v) => {
                const mStyle = MODALIDAD_STYLES[v.modalidad] || MODALIDAD_STYLES.Remoto;
                const hasApplied = appliedIds.has(v.titulo);

                return (
                  <div key={v.vacante_id} className="card p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{v.titulo}</h3>
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                          <Building2 className="w-3.5 h-3.5" /> {v.empresa_nombre} · {v.sector}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: mStyle.bg, color: mStyle.color }}>
                        {v.modalidad}
                      </span>
                    </div>

                    <p className="text-xs flex-1 mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {v.descripcion?.substring(0, 120)}{(v.descripcion?.length || 0) > 120 ? '...' : ''}
                    </p>

                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-primary-600)' }}>
                          S/ {v.salario_min?.toLocaleString()} — {v.salario_max?.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(v.fecha_publicacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {isPadawan && (
                        hasApplied ? (
                          <span className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"
                                style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>
                            <Check className="w-3.5 h-3.5" /> Postulado
                          </span>
                        ) : (
                          <button onClick={() => { setApplyVacancy(v); setShowApply(true); }}
                                  className="btn-primary text-xs px-3 py-1.5">
                            Postularme
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Mis Postulaciones Tab */}
      {tab === 'postulaciones' && (
        applications.length === 0 ? (
          <div className="card p-6">
            <EmptyState icon={<Inbox className="w-12 h-12 text-neutral-400" />} title="Sin postulaciones" description="Aún no te has postulado a ninguna vacante." />
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => {
              const pStyle = POSTULACION_STYLES[a.estado] || POSTULACION_STYLES.Enviada;
              return (
                <div key={a.postulacion_id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.vacante_titulo}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Building2 className="w-3.5 h-3.5" /> {a.empresa_nombre} · {a.modalidad}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(a.fecha_postulacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ backgroundColor: pStyle.bg, color: pStyle.color }}>
                    {a.estado === 'EnRevision' ? 'En Revisión' : a.estado}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal Postularse */}
      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Postularse a vacante">
        <div className="space-y-4">
          {applyVacancy && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{applyVacancy.titulo}</p>
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Building2 className="w-3.5 h-3.5" /> {applyVacancy.empresa_nombre} · {applyVacancy.modalidad}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-primary-600)' }}>
                S/ {applyVacancy.salario_min?.toLocaleString()} — {applyVacancy.salario_max?.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Mensaje (opcional)</label>
            <textarea className="input-field" rows={3} placeholder="Preséntate brevemente y explica por qué te interesa esta posición..."
                      value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} />
          </div>
          <button onClick={handleApply} disabled={applying} className="btn-primary w-full flex items-center justify-center gap-2">
            {applying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {applying ? 'Enviando...' : 'Enviar postulación'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default VacanciesPage;
