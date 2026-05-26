import type { ClassroomPeople } from '../../types';

export default function PeopleTab({ people }: { people: ClassroomPeople | null }) {
  if (!people) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando...</p>;

  const PersonCard = ({ role, name, email, bio, extra }: {
    role: 'Mentor' | 'Estudiante'; name: string; email: string; bio: string; extra: React.ReactNode;
  }) => (
    <div className="card p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
             style={{ backgroundColor: role === 'Mentor' ? 'var(--color-primary-100)' : 'var(--color-success-light)',
                      color: role === 'Mentor' ? 'var(--color-primary-700)' : 'var(--color-success-dark)' }}>
          {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{email}</p>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ backgroundColor: role === 'Mentor' ? 'var(--color-primary-50)' : 'var(--color-success-light)',
                         color: role === 'Mentor' ? 'var(--color-primary-600)' : 'var(--color-success-dark)' }}>
            {role === 'Mentor' ? '🧙‍♂️ Mentor Jedi' : '🧑‍🎓 Padawan'}
          </span>
        </div>
      </div>
      {bio && <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{bio}</p>}
      {extra}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🧙‍♂️ Mentor</h3>
      <PersonCard role="Mentor"
        name={`${people.mentor_nombres} ${people.mentor_apellidos}`}
        email={people.mentor_email}
        bio={people.bio_profesional || ''}
        extra={
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {people.especialidades && <span>💡 {people.especialidades}</span>}
            {people.anios_experiencia > 0 && <span>📅 {people.anios_experiencia} años exp.</span>}
            {people.calificacion_promedio > 0 && <span>⭐ {Number(people.calificacion_promedio).toFixed(1)}</span>}
          </div>
        }
      />

      <h3 className="text-sm font-semibold mb-2 mt-6" style={{ color: 'var(--text-primary)' }}>🧑‍🎓 Estudiante</h3>
      <PersonCard role="Estudiante"
        name={`${people.padawan_nombres} ${people.padawan_apellidos}`}
        email={people.padawan_email}
        bio={people.resumen_bio || ''}
        extra={
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>📊 Score: {Number(people.score_empleabilidad).toFixed(0)}/100</span>
            {people.url_portafolio && (
              <a href={people.url_portafolio} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)' }}>
                🔗 Portafolio
              </a>
            )}
          </div>
        }
      />

      {/* Matching info */}
      <div className="card p-4 mt-4" style={{ backgroundColor: 'var(--surface-input)' }}>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>📊 Información del Matching</p>
        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Afinidad: {(Number(people.score_afinidad) * 100).toFixed(0)}%</span>
          <span>Desde: {new Date(people.fecha_asignacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
