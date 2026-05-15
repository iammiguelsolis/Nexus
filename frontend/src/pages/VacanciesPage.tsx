import { useEffect, useState } from 'react';
import { vacancyService } from '../services/api';
import type { Vacancy } from '../types';
import { LoadingSpinner, Badge, EmptyState, Modal } from '../components/ui';
import { formatCurrency, getModalidadColor, formatDate } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';
import type { AxiosError } from 'axios';

interface Application {
  postulacion_id: string;
  vacante_id: string;
  estado: string;
  vacante_titulo: string;
  empresa_nombre: string;
  fecha_postulacion: string;
}

const MODALIDAD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'Presencial', label: '🏢 Presencial' },
  { value: 'Remoto', label: '🌍 Remoto' },
  { value: 'Hibrido', label: '🔄 Híbrido' },
];

const VacanciesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [applyMsg, setApplyMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const loadVacancies = () => {
    setLoading(true);
    const promises: Promise<unknown>[] = [
      vacancyService.list(filter || undefined).then((res) => setVacancies(res.data.data || [])),
    ];
    if (isAuthenticated) {
      promises.push(
        vacancyService.getMyApplications().then((res) => setApplications(res.data.data || [])).catch(() => {})
      );
    }
    Promise.all(promises).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadVacancies(); }, [filter, isAuthenticated]);

  const hasApplied = (vacancyId: string) =>
    applications.some((a) => a.vacante_id === vacancyId);

  const getApplicationStatus = (vacancyId: string) =>
    applications.find((a) => a.vacante_id === vacancyId)?.estado;

  const openApplyModal = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setApplyMsg('');
    setError('');
    setSuccessMsg('');
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    if (!selectedVacancy) return;
    setApplying(true);
    setError('');
    try {
      await vacancyService.apply(selectedVacancy.vacante_id, applyMsg);
      setSuccessMsg('¡Postulación enviada con éxito! 🎉');
      setTimeout(() => {
        setShowApplyModal(false);
        setSuccessMsg('');
        loadVacancies();
      }, 2000);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      setError(axiosErr.response?.data?.error || 'Error al postular');
    } finally {
      setApplying(false);
    }
  };

  const getAppStatusBadge = (estado: string) => {
    const map: Record<string, string> = {
      'Enviada': 'bg-nexus-600/20 text-nexus-300 border-nexus-500/30',
      'EnRevision': 'bg-warning-600/20 text-warning-300 border-warning-500/30',
      'Aceptada': 'bg-success-600/20 text-success-300 border-success-500/30',
      'Rechazada': 'bg-danger-600/20 text-danger-300 border-danger-500/30',
    };
    return map[estado] || 'bg-dark-600/20 text-dark-300 border-dark-500/30';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Vacantes</h1>
        <p className="text-dark-400 text-sm mt-1">Explora oportunidades laborales de empresas aliadas</p>
      </div>

      {/* My Applications Summary */}
      {isAuthenticated && applications.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-dark-400 mb-3">📋 Mis Postulaciones ({applications.length})</h3>
          <div className="flex flex-wrap gap-2">
            {applications.map((app) => (
              <div key={app.postulacion_id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-700/40">
                <span className="text-sm text-white">{app.vacante_titulo}</span>
                <Badge className={getAppStatusBadge(app.estado)}>{app.estado}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {MODALIDAD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${filter === opt.value
                ? 'gradient-nexus text-white shadow-lg shadow-nexus-700/30'
                : 'glass text-dark-300 hover:text-white hover:bg-dark-700/80'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : vacancies.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No hay vacantes"
          description={filter ? `No se encontraron vacantes ${filter.toLowerCase()}` : 'No hay vacantes disponibles en este momento'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map((vacancy, index) => {
            const applied = hasApplied(vacancy.vacante_id);
            const appStatus = getApplicationStatus(vacancy.vacante_id);
            return (
              <div
                key={vacancy.vacante_id}
                className="glass rounded-2xl overflow-hidden card-hover animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="h-1 gradient-nexus" />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-nexus-700/30 flex items-center justify-center text-xl">
                      {vacancy.logo_url ? (
                        <img src={vacancy.logo_url} alt="" className="w-8 h-8 rounded" />
                      ) : '🏢'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-300">{vacancy.empresa_nombre}</p>
                      {vacancy.sector && <p className="text-xs text-dark-500">{vacancy.sector}</p>}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{vacancy.titulo}</h3>
                  {vacancy.descripcion && (
                    <p className="text-dark-400 text-sm line-clamp-3 mb-4">{vacancy.descripcion}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <Badge className={getModalidadColor(vacancy.modalidad)}>
                      {vacancy.modalidad === 'Hibrido' ? 'Híbrido' : vacancy.modalidad}
                    </Badge>
                    {applied && appStatus && (
                      <Badge className={getAppStatusBadge(appStatus)}>
                        ✓ {appStatus}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between pt-4 border-t border-dark-700/50 mb-4">
                      <div>
                        <p className="text-xs text-dark-500">Rango salarial</p>
                        <p className="text-success-400 font-semibold">
                          {formatCurrency(vacancy.salario_min)} - {formatCurrency(vacancy.salario_max)}
                        </p>
                      </div>
                      <p className="text-xs text-dark-500">{formatDate(vacancy.fecha_publicacion)}</p>
                    </div>

                    {/* Apply Button */}
                    {isAuthenticated && user?.rol === 'Padawan' && !applied && (
                      <button
                        onClick={() => openApplyModal(vacancy)}
                        className="btn-primary w-full text-sm"
                      >
                        🚀 Postular
                      </button>
                    )}
                    {applied && (
                      <div className="text-center text-sm text-success-400 font-medium py-2">
                        ✅ Ya postulaste
                      </div>
                    )}
                    {!isAuthenticated && (
                      <p className="text-center text-xs text-dark-500 py-2">
                        Inicia sesión para postular
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Postular a Vacante">
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
              {selectedVacancy && (
                <div className="p-4 rounded-xl bg-dark-700/40">
                  <h4 className="text-white font-medium">{selectedVacancy.titulo}</h4>
                  <p className="text-dark-400 text-sm mt-1">{selectedVacancy.empresa_nombre}</p>
                  <p className="text-success-400 text-sm mt-1">
                    {formatCurrency(selectedVacancy.salario_min)} - {formatCurrency(selectedVacancy.salario_max)}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Mensaje de presentación (opcional)
                </label>
                <textarea
                  className="input-field resize-none h-28"
                  placeholder="Cuéntales por qué eres el candidato ideal..."
                  value={applyMsg}
                  onChange={(e) => setApplyMsg(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleApply} disabled={applying} className="btn-primary flex-1">
                  {applying ? '...' : '🚀 Enviar Postulación'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default VacanciesPage;
