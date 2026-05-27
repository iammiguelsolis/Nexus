import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileService } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import type { ProfileData } from '../types';
import { User, GraduationCap, Wand2, Star, ArrowLeft } from 'lucide-react';

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    profileService.getUserProfile(userId)
      .then((res) => setProfile(res.data.data))
      .catch(() => setError('No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner size="lg" />;

  if (error || !profile) {
    return (
      <div className="animate-fade-in text-center py-16">
        <User className="w-16 h-16 mb-4 mx-auto text-neutral-400" />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {error || 'Usuario no encontrado'}
        </h2>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-block">Volver al dashboard</Link>
      </div>
    );
  }

  const isPadawan = profile.rol === 'Padawan';

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
               style={{ backgroundColor: 'var(--color-primary-500)' }}>
            {profile.nombres?.charAt(0)}{profile.apellidos?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              {profile.nombres} {profile.apellidos}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-primary flex items-center gap-1">
                {isPadawan ? <><GraduationCap className="w-3.5 h-3.5" /> Padawan</> : <><Wand2 className="w-3.5 h-3.5" /> Mentor Jedi</>}
              </span>
              {profile.fecha_registro && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Desde {new Date(profile.fecha_registro).toLocaleDateString('es-PE')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info del Padawan */}
      {isPadawan && (
        <>
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Sobre el aprendiz
            </h2>
            {profile.resumen_bio ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{profile.resumen_bio}</p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Sin bio registrada</p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Score de empleabilidad</p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-primary-700)' }}>
                  {profile.score_empleabilidad ?? '—'}
                </p>
              </div>
              {profile.url_portafolio && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Portafolio</p>
                  <a href={profile.url_portafolio} target="_blank" rel="noopener noreferrer"
                     className="text-sm font-medium hover:underline" style={{ color: 'var(--color-primary-500)' }}>
                    Ver portafolio →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Habilidades */}
          {profile.habilidades && profile.habilidades.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Habilidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.habilidades.map((skill, i) => (
                  <span key={i} className="badge badge-primary">
                    {skill.nombre} · {skill.nivel}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info del Mentor */}
      {!isPadawan && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Sobre el mentor
          </h2>
          {profile.bio_profesional ? (
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{profile.bio_profesional}</p>
          ) : (
            <p className="text-sm italic mb-4" style={{ color: 'var(--text-muted)' }}>Sin bio registrada</p>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Especialidades</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-primary-700)' }}>
                {profile.especialidades || '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Experiencia</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {profile.anios_experiencia ?? '—'} años
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-input)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Calificación</p>
              <p className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                <Star className="w-4 h-4 text-warning" /> {profile.calificacion_promedio ?? '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Link to="/dashboard" className="btn-ghost text-sm flex items-center gap-2 w-fit mt-4">
        <ArrowLeft className="w-4 h-4" /> Volver al dashboard
      </Link>
    </div>
  );
};

export default UserProfilePage;
