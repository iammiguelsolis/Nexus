import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner, EmptyState } from '../components/ui';
import api from '../services/api';
import { Book, School, Calendar, Star, ArrowRight } from 'lucide-react';

interface MatchingAula {
  matching_id: string;
  estado: string;
  score_afinidad: number;
  fecha_asignacion: string;
  mentor_nombres?: string;
  mentor_apellidos?: string;
  padawan_nombres?: string;
  padawan_apellidos?: string;
  total_sesiones?: number;
  sesiones_programadas?: number;
}

const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #1a73e8 0%, #4285f4 50%, #669df6 100%)',
  'linear-gradient(135deg, #0d652d 0%, #1e8e3e 50%, #34a853 100%)',
  'linear-gradient(135deg, #e37400 0%, #f9ab00 50%, #fdd663 100%)',
  'linear-gradient(135deg, #a50e0e 0%, #d93025 50%, #ea8600 100%)',
  'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 50%, #ce93d8 100%)',
  'linear-gradient(135deg, #00695c 0%, #009688 50%, #4db6ac 100%)',
];

const getGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return BANNER_GRADIENTS[Math.abs(hash) % BANNER_GRADIENTS.length];
};

const getInitials = (nombres?: string, apellidos?: string) =>
  `${(nombres || '?')[0]}${(apellidos || '?')[0]}`.toUpperCase();

const SessionsPage = () => {
  const { user } = useAuth();
  const [matchings, setMatchings] = useState<MatchingAula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/matchings/me')
      .then((res) => {
        const active = res.data.data.filter((m: MatchingAula) => m.estado === 'Activo');
        setMatchings(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const isPadawan = user?.rol === 'Padawan';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          {isPadawan ? <><Book className="w-8 h-8 text-primary-500" /> Mi Aula</> : <><School className="w-8 h-8 text-primary-500" /> Mis Aulas</>}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {isPadawan
            ? 'Tu espacio de mentoría con recursos, tareas y comunicación directa.'
            : 'Espacios de mentoría con cada uno de tus Padawans.'}
        </p>
      </div>

      {matchings.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<School className="w-12 h-12 text-neutral-400" />}
            title="Sin aulas activas"
            description={isPadawan
              ? 'Aún no tienes un mentor asignado. Ve a Matching para buscar uno.'
              : 'No tienes Padawans activos aún. Acepta un matching para crear un aula.'}
            action={
              <Link to="/matching" className="btn-primary text-sm">
                Ir a Matching
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {matchings.map((m) => {
            const partnerName = isPadawan
              ? `${m.mentor_nombres} ${m.mentor_apellidos}`
              : `${m.padawan_nombres} ${m.padawan_apellidos}`;
            const initials = isPadawan
              ? getInitials(m.mentor_nombres, m.mentor_apellidos)
              : getInitials(m.padawan_nombres, m.padawan_apellidos);
            const gradient = getGradient(m.matching_id);

            return (
              <Link
                key={m.matching_id}
                to={`/classroom/${m.matching_id}`}
                className="block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {/* Banner */}
                <div className="relative p-5 pb-12" style={{ background: gradient, minHeight: '120px' }}>
                  <h3 className="text-lg font-bold text-white drop-shadow-sm">
                    {isPadawan ? 'Mentoría' : `Aula — ${m.padawan_nombres}`}
                  </h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    {isPadawan ? `Mentor: ${partnerName}` : partnerName}
                  </p>
                  {/* Avatar floating */}
                  <div
                    className="absolute -bottom-8 right-5 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
                    style={{ backgroundColor: 'var(--surface-card)', color: 'var(--color-primary-600)', border: '3px solid var(--surface-card)' }}
                  >
                    {initials}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 pt-3">
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(m.fecha_asignacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warning" /> Afinidad: {(Number(m.score_afinidad) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium px-3 py-1 rounded-full"
                          style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>
                      Activo
                    </span>
                    <span className="text-xs font-medium flex items-center justify-center gap-1" style={{ color: 'var(--color-primary-500)' }}>
                      Abrir aula <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
