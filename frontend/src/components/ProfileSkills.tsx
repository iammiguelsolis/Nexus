import { useState } from 'react';
import type { ProfileSkill } from '../hooks/useProfileSkills';
import { useProfileSkills } from '../hooks/useProfileSkills';
import { Badge } from './ui';

interface ProfileSkillsProps {
  profileId: string;
  onOpenAddSkillModal?: () => void;
}

const LEVEL_BADGE_COLORS = {
  'Basico': 'bg-warning-600/20 text-warning-300 border-warning-500/30',
  'Intermedio': 'bg-nexus-600/20 text-nexus-300 border-nexus-500/30',
  'Avanzado': 'bg-success-600/20 text-success-300 border-success-500/30',
};

const getCategoryBorderStyle = (categoria: string): React.CSSProperties => {
  const colorMap: Record<string, string> = {
    'Tecnica': '#2E5FA3',
    'Blanda': '#1D9E75',
    'Certificacion': '#F59E0B',
  };
  return { borderLeftColor: colorMap[categoria] || '#4B5563' };
};

const LEVEL_POINTS = {
  'Basico': 5,
  'Intermedio': 10,
  'Avanzado': 15,
};

export const ProfileSkills = ({ profileId, onOpenAddSkillModal }: ProfileSkillsProps) => {
  const { skills, score, loading, removeSkill } = useProfileSkills(profileId);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleRemoveSkill = async (skillId: string) => {
    try {
      setDeletingSkillId(skillId);
      setDeleteError('');
      await removeSkill(skillId);
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar la habilidad');
    } finally {
      setDeletingSkillId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-dark-400 text-sm">Cargando habilidades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Score and Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display">Mis Habilidades</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-dark-400">Empleabilidad</span>
              <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-nexus-600 to-success-500 rounded-full"
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-bold text-success-400 ml-2">{Math.round(score)}%</span>
          </div>
        </div>
        <button
          onClick={() => onOpenAddSkillModal?.()}
          className="px-4 py-2.5 bg-gradient-to-r from-nexus-600 to-nexus-500 text-white rounded-xl hover:shadow-lg hover:shadow-nexus-600/30 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap"
        >
          ✨ Agregar Habilidad
        </button>
      </div>

      {/* Error Message */}
      {deleteError && (
        <div className="p-4 rounded-xl bg-danger-600/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
          {deleteError}
        </div>
      )}

      {/* Skills List */}
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill: ProfileSkill, index) => (
            <div
              key={skill.ph_id}
              className="glass rounded-2xl p-4 card-hover animate-slide-up border-l-4 border-t border-r border-b border-dark-700/60"
              style={{
                animationDelay: `${index * 0.05}s`,
                ...getCategoryBorderStyle(skill.categoria),
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="font-semibold text-white truncate">{skill.nombre}</h4>
                    <Badge className={`flex-shrink-0 ${LEVEL_BADGE_COLORS[skill.nivel as keyof typeof LEVEL_BADGE_COLORS]}`}>
                      {skill.nivel}
                    </Badge>
                  </div>
                  <p className="text-xs text-dark-400 line-clamp-2 mb-3">{skill.descripcion}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-dark-700/40 text-dark-300 border border-dark-700/60">
                      {skill.categoria}
                    </span>
                    {skill.fecha_adquisicion && (
                      <span className="text-xs text-dark-500">
                        📅 {new Date(skill.fecha_adquisicion).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    <span className="text-xs text-success-400 font-medium ml-auto">
                      +{LEVEL_POINTS[skill.nivel as keyof typeof LEVEL_POINTS]} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill.ph_id)}
                  disabled={deletingSkillId === skill.ph_id}
                  className="mt-1 text-dark-400 hover:text-danger-400 hover:bg-danger-600/10 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  title="Eliminar habilidad"
                >
                  {deletingSkillId === skill.ph_id ? '⏳' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center border border-dark-700/60 animate-fade-in">
          <span className="text-4xl block mb-4">🎯</span>
          <p className="text-dark-400 text-sm mb-4">Aún no has registrado ninguna habilidad</p>
          <p className="text-dark-500 text-xs mb-4">Agrega habilidades para mejorar tu puntuación de empleabilidad</p>
          <button
            onClick={() => onOpenAddSkillModal?.()}
            className="px-4 py-2 bg-gradient-to-r from-nexus-600 to-nexus-500 text-white rounded-xl hover:shadow-lg hover:shadow-nexus-600/30 transition-all font-medium text-sm"
          >
            ✨ Agregar tu primera habilidad
          </button>
        </div>
      )}

    </div>
  );
};
